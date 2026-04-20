"""
Cognitive Training — PPO Reinforcement Learning Engine.

A lightweight, self-contained Proximal Policy Optimisation (PPO) agent for
adaptive difficulty adjustment.  Depends only on PyTorch and NumPy — no
Django imports.

Architecture
------------
* PolicyNet : 8 → 32 → 16 → 5  (softmax)  —  ~900 parameters
* ValueNet  : 8 → 32 → 16 → 1              —  ~600 parameters

State (8-dim)
-------------
accuracy, normalised_rt, interference_error_rate, omission_error_rate,
normalised_difficulty, experience_level, improvement_trend, recency

Action (discrete, 5)
--------------------
{-2, -1, 0, +1, +2}  →  difficulty delta

Reward
------
Composite: accuracy-ZPD (0.55) + speed (0.20) + improvement (0.15) +
           stability (0.10)
"""

from __future__ import annotations

import io
import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical


# ── Constants ────────────────────────────────────────────────────────────────

STATE_DIM = 8
NUM_ACTIONS = 5                     # maps to deltas [-2, -1, 0, +1, +2]
ACTION_DELTAS = [-2, -1, 0, 1, 2]

# Reward weights
W_ACCURACY = 0.55
W_SPEED = 0.20
W_IMPROVEMENT = 0.15
W_STABILITY = 0.10

# ZPD target
ZPD_CENTER = 0.775
ZPD_SHARPNESS = 12.0

# PPO hyper-parameters
LEARNING_RATE = 3e-4
GAMMA = 0.99
GAE_LAMBDA = 0.95
CLIP_EPS = 0.2
ENTROPY_COEFF_START = 0.05
ENTROPY_COEFF_END = 0.01
ENTROPY_DECAY_EPISODES = 100
VALUE_LOSS_COEFF = 0.5
PPO_EPOCHS = 3
MAX_REASONABLE_RT_MS = 5000.0
MAX_SESSIONS_LOG = math.log(200.0)
MAX_RECENCY_HOURS = 168.0      # 1 week

# Default starting difficulty for brand-new users
COLD_START_DIFFICULTY = 3


# ── Networks ─────────────────────────────────────────────────────────────────

class PolicyNet(nn.Module):
    """Maps state → action probabilities via softmax."""

    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(STATE_DIM, 32)
        self.fc2 = nn.Linear(32, 16)
        self.fc3 = nn.Linear(16, NUM_ACTIONS)

        # Xavier init for stable cold-start
        nn.init.xavier_uniform_(self.fc1.weight)
        nn.init.xavier_uniform_(self.fc2.weight)
        nn.init.xavier_uniform_(self.fc3.weight)
        nn.init.zeros_(self.fc1.bias)
        nn.init.zeros_(self.fc2.bias)
        # Slight bias toward action index 2 (delta=0, "keep same difficulty")
        with torch.no_grad():
            self.fc3.bias.zero_()
            self.fc3.bias[2] = 0.5

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Return action log-probabilities (log-softmax)."""
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return F.log_softmax(self.fc3(x), dim=-1)


class ValueNet(nn.Module):
    """Maps state → scalar state-value estimate."""

    def __init__(self) -> None:
        super().__init__()
        self.fc1 = nn.Linear(STATE_DIM, 32)
        self.fc2 = nn.Linear(32, 16)
        self.fc3 = nn.Linear(16, 1)

        nn.init.xavier_uniform_(self.fc1.weight)
        nn.init.xavier_uniform_(self.fc2.weight)
        nn.init.xavier_uniform_(self.fc3.weight)
        nn.init.zeros_(self.fc1.bias)
        nn.init.zeros_(self.fc2.bias)
        nn.init.zeros_(self.fc3.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x).squeeze(-1)


# ── State Construction ───────────────────────────────────────────────────────

@dataclass
class SessionMetrics:
    """Raw metrics from one completed session, used to build the RL state."""

    accuracy: float = 0.0
    avg_reaction_time_ms: float = 0.0
    interference_error_rate: float = 0.0
    omission_error_rate: float = 0.0
    current_difficulty: int = COLD_START_DIFFICULTY
    total_sessions_for_task: int = 0
    # Accuracy values of the last N sessions, oldest first
    recent_accuracies: list[float] = field(default_factory=list)
    hours_since_last_session: float = 0.0
    difficulty_min: int = 1
    difficulty_max: int = 10


def build_state_vector(m: SessionMetrics) -> np.ndarray:
    """
    Convert raw session metrics into the normalised 8-dim state vector.

    All values are clipped to their expected ranges so the network never
    sees out-of-distribution inputs.
    """
    s1 = float(np.clip(m.accuracy, 0.0, 1.0))
    s2 = float(np.clip(m.avg_reaction_time_ms / MAX_REASONABLE_RT_MS, 0.0, 1.0))
    s3 = float(np.clip(m.interference_error_rate, 0.0, 1.0))
    s4 = float(np.clip(m.omission_error_rate, 0.0, 1.0))

    diff_range = max(m.difficulty_max - m.difficulty_min, 1)
    s5 = float(np.clip(
        (m.current_difficulty - m.difficulty_min) / diff_range, 0.0, 1.0
    ))

    s6 = float(np.clip(
        math.log(m.total_sessions_for_task + 1) / MAX_SESSIONS_LOG, 0.0, 1.0
    ))

    # Improvement trend: linear regression slope over recent accuracies
    if len(m.recent_accuracies) >= 2:
        x = np.arange(len(m.recent_accuracies), dtype=np.float64)
        y = np.array(m.recent_accuracies, dtype=np.float64)
        n = len(x)
        slope = float(
            (n * np.dot(x, y) - x.sum() * y.sum())
            / max(n * np.dot(x, x) - x.sum() ** 2, 1e-9)
        )
        s7 = float(np.clip(slope, -1.0, 1.0))
    else:
        s7 = 0.0

    s8 = float(np.clip(m.hours_since_last_session / MAX_RECENCY_HOURS, 0.0, 1.0))

    return np.array([s1, s2, s3, s4, s5, s6, s7, s8], dtype=np.float32)


# ── Reward Computation ───────────────────────────────────────────────────────

def compute_reward(
    accuracy: float,
    normalized_rt: float,
    prev_accuracy: float | None,
    action_index: int,
) -> float:
    """
    Composite reward targeting the Zone of Proximal Development (70-85%).

    Components
    ----------
    R_accuracy     Gaussian centred on 77.5% accuracy (weight 0.55)
    R_speed        Linear penalty for slow responses      (weight 0.20)
    R_improvement  Bonus for session-over-session gain     (weight 0.15)
    R_stability    Penalty for large difficulty jumps      (weight 0.10)

    Returns a scalar reward, typically in [-0.5, 1.0].
    """
    # R_accuracy: Gaussian ZPD reward
    distance = accuracy - ZPD_CENTER
    r_accuracy = math.exp(-ZPD_SHARPNESS * distance * distance)

    # R_speed: higher is better (fast RT → low normalised_rt → high reward)
    r_speed = max(0.0, 1.0 - normalized_rt)

    # R_improvement
    if prev_accuracy is not None:
        r_improvement = float(np.clip(accuracy - prev_accuracy, -0.3, 0.3))
    else:
        r_improvement = 0.0

    # R_stability: penalise large difficulty changes
    delta = abs(ACTION_DELTAS[action_index])
    r_stability = -float(delta)

    reward = (
        W_ACCURACY * r_accuracy
        + W_SPEED * r_speed
        + W_IMPROVEMENT * r_improvement
        + W_STABILITY * r_stability
    )
    return float(reward)


# ── Serialisation Helpers ────────────────────────────────────────────────────

def serialize_state_dict(state_dict: dict) -> bytes:
    """Serialise a PyTorch state_dict to bytes for DB storage."""
    buf = io.BytesIO()
    torch.save(state_dict, buf)
    return buf.getvalue()


def deserialize_state_dict(data: bytes) -> dict:
    """Deserialise bytes back to a PyTorch state_dict."""
    buf = io.BytesIO(data)
    return torch.load(buf, map_location="cpu", weights_only=True)


# ── PPO Agent ────────────────────────────────────────────────────────────────

class PPOAgent:
    """
    Lightweight PPO agent for per-user, per-task difficulty adjustment.

    Typical lifecycle per session
    -----------------------------
    1. ``agent = PPOAgent.from_weights(policy_bytes, value_bytes, episodes)``
       or ``agent = PPOAgent()`` for cold start.
    2. ``action_idx, log_prob = agent.select_action(state_vector)``
    3. User plays session  →  compute ``reward``.
    4. ``loss = agent.update(state_vector, action_idx, log_prob, reward)``
    5. ``p_bytes, v_bytes, opt_bytes = agent.export_weights()``
    6. Persist ``p_bytes``, ``v_bytes``, ``opt_bytes`` to DB.
    """

    def __init__(self, total_episodes: int = 0) -> None:
        self.policy = PolicyNet()
        self.value = ValueNet()
        self.total_episodes = total_episodes

        params = list(self.policy.parameters()) + list(self.value.parameters())
        self.optimizer = torch.optim.Adam(params, lr=LEARNING_RATE)

    # ── Factory Methods ──────────────────────────────────────────────────

    @classmethod
    def from_weights(
        cls,
        policy_bytes: bytes,
        value_bytes: bytes,
        total_episodes: int = 0,
        optimizer_bytes: Optional[bytes] = None,
    ) -> "PPOAgent":
        """Reconstruct an agent from persisted weight blobs."""
        agent = cls(total_episodes=total_episodes)
        agent.policy.load_state_dict(deserialize_state_dict(policy_bytes))
        agent.value.load_state_dict(deserialize_state_dict(value_bytes))
        if optimizer_bytes:
            agent.optimizer.load_state_dict(deserialize_state_dict(optimizer_bytes))
        return agent

    @classmethod
    def new(cls) -> "PPOAgent":
        """Create a fresh agent with Xavier-initialised weights."""
        return cls(total_episodes=0)

    # ── Inference ────────────────────────────────────────────────────────

    @torch.no_grad()
    def select_action(
        self, state: np.ndarray
    ) -> tuple[int, float]:
        """
        Choose a difficulty delta given the current state.

        Parameters
        ----------
        state : np.ndarray, shape (8,)
            Normalised state vector.

        Returns
        -------
        action_index : int
            Index into ACTION_DELTAS (0..4).
        log_prob : float
            Log-probability of the chosen action under the current policy.
        """
        self.policy.eval()
        s = torch.from_numpy(state).unsqueeze(0)          # (1, 8)
        log_probs = self.policy(s)                          # (1, 5)
        dist = Categorical(logits=log_probs)
        action = dist.sample()
        return int(action.item()), float(dist.log_prob(action).item())

    @torch.no_grad()
    def get_difficulty_delta(self, action_index: int) -> int:
        """Map action index to the integer difficulty delta."""
        return ACTION_DELTAS[action_index]

    # ── Training ─────────────────────────────────────────────────────────

    def _entropy_coeff(self) -> float:
        """Linearly decay entropy bonus from start to end over N episodes."""
        progress = min(self.total_episodes / max(ENTROPY_DECAY_EPISODES, 1), 1.0)
        return ENTROPY_COEFF_START + progress * (ENTROPY_COEFF_END - ENTROPY_COEFF_START)

    def update(
        self,
        state: np.ndarray,
        action_index: int,
        old_log_prob: float,
        reward: float,
    ) -> float:
        """
        Perform a PPO update from a single-episode transition.

        Because each *session* is one episode with one effective (s, a, r)
        tuple, we perform PPO_EPOCHS passes over this single data point.
        The clipped surrogate still provides stable updates.

        Parameters
        ----------
        state : np.ndarray, shape (8,)
        action_index : int
        old_log_prob : float
        reward : float

        Returns
        -------
        mean_loss : float
            Average total loss across PPO epochs (for monitoring).
        """
        self.policy.train()
        self.value.train()

        s = torch.from_numpy(state).unsqueeze(0)           # (1, 8)
        a = torch.tensor([action_index], dtype=torch.long)
        old_lp = torch.tensor([old_log_prob], dtype=torch.float32)
        r = torch.tensor([reward], dtype=torch.float32)

        total_loss_accum = 0.0

        for _ in range(PPO_EPOCHS):
            # Current policy evaluation
            log_probs = self.policy(s)                      # (1, 5)
            dist = Categorical(logits=log_probs)
            new_lp = dist.log_prob(a)                       # (1,)
            entropy = dist.entropy()                        # (1,)

            # Value estimate
            v = self.value(s)                               # (1,)

            # Advantage (single-step: A = r - V(s))
            advantage = (r - v.detach())

            # PPO clipped surrogate
            ratio = torch.exp(new_lp - old_lp)
            surr1 = ratio * advantage
            surr2 = torch.clamp(ratio, 1.0 - CLIP_EPS, 1.0 + CLIP_EPS) * advantage
            policy_loss = -torch.min(surr1, surr2).mean()

            # Value loss (MSE)
            value_loss = F.mse_loss(v, r)

            # Total loss
            ent_coeff = self._entropy_coeff()
            loss = (
                policy_loss
                + VALUE_LOSS_COEFF * value_loss
                - ent_coeff * entropy.mean()
            )

            self.optimizer.zero_grad()
            loss.backward()
            # Gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(
                list(self.policy.parameters()) + list(self.value.parameters()),
                max_norm=0.5,
            )
            self.optimizer.step()

            total_loss_accum += loss.item()

        self.total_episodes += 1
        return total_loss_accum / PPO_EPOCHS

    # ── Weight Export ────────────────────────────────────────────────────

    def export_weights(self) -> tuple[bytes, bytes, bytes]:
        """
        Serialise policy, value, and optimiser state dicts to bytes.

        Returns
        -------
        (policy_bytes, value_bytes, optimizer_bytes)
        """
        return (
            serialize_state_dict(self.policy.state_dict()),
            serialize_state_dict(self.value.state_dict()),
            serialize_state_dict(self.optimizer.state_dict()),
        )
