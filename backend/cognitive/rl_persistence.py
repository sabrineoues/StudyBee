"""
Cognitive Training — RL Persistence Layer.

Bridges the pure-PyTorch ``rl_engine`` module with Django models.
All Django ORM access for the RL system goes through this module.

Responsibilities
----------------
* Load / create PPO agents from ``RLAgentState`` rows.
* Save updated weights back after training.
* Build the complete state vector from a user's DB history.
* Orchestrate the full RL decision cycle (select action, compute reward, update).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import NamedTuple, Optional

from .metrics import (
    build_session_metrics_for_rl,
    compute_hours_since,
)
from .models import (
    CognitiveSession,
    CognitiveTask,
    RLAgentState,
    UserCognitiveProfile,
)
from .rl_engine import (
    ACTION_DELTAS,
    COLD_START_DIFFICULTY,
    PPOAgent,
    build_state_vector,
    compute_reward,
)


# ─────────────────────────────────────────────────────────────────────────────
# Data Structures
# ─────────────────────────────────────────────────────────────────────────────

class DifficultyDecision(NamedTuple):
    """Result of the RL agent's difficulty selection."""
    difficulty: int
    action_index: int
    action_delta: int
    log_prob: float
    is_cold_start: bool


class UpdateResult(NamedTuple):
    """Result of an RL update after a completed session."""
    reward: float
    loss: float
    next_difficulty: int
    next_action_delta: int
    total_episodes: int


# ─────────────────────────────────────────────────────────────────────────────
# Agent Loading
# ─────────────────────────────────────────────────────────────────────────────

def load_agent(user, task: CognitiveTask) -> tuple[PPOAgent, Optional[RLAgentState]]:
    """
    Load a persisted PPO agent for this user×task pair.

    Returns
    -------
    (agent, db_state_or_None)
        If no persisted state exists, returns a freshly initialised agent
        and None for the DB row.
    """
    try:
        state = RLAgentState.objects.get(user=user, task=task)
        agent = PPOAgent.from_weights(
            policy_bytes=bytes(state.policy_weights),
            value_bytes=bytes(state.value_weights),
            total_episodes=state.total_episodes,
            optimizer_bytes=(
                bytes(state.optimizer_state) if state.optimizer_state else None
            ),
        )
        return agent, state
    except RLAgentState.DoesNotExist:
        return PPOAgent.new(), None


def save_agent(
    agent: PPOAgent,
    user,
    task: CognitiveTask,
    reward: float,
    loss: float,
    existing_state: Optional[RLAgentState] = None,
) -> RLAgentState:
    """
    Persist the agent's current weights to the database.

    If ``existing_state`` is provided, updates that row in-place.
    Otherwise creates a new ``RLAgentState`` row.
    """
    p_bytes, v_bytes, opt_bytes = agent.export_weights()

    if existing_state is not None:
        existing_state.policy_weights = p_bytes
        existing_state.value_weights = v_bytes
        existing_state.optimizer_state = opt_bytes
        existing_state.total_episodes = agent.total_episodes
        existing_state.last_reward = reward
        existing_state.last_loss = loss
        existing_state.save()
        return existing_state

    return RLAgentState.objects.create(
        user=user,
        task=task,
        policy_weights=p_bytes,
        value_weights=v_bytes,
        optimizer_state=opt_bytes,
        total_episodes=agent.total_episodes,
        last_reward=reward,
        last_loss=loss,
    )


# ─────────────────────────────────────────────────────────────────────────────
# History Queries
# ─────────────────────────────────────────────────────────────────────────────

def get_completed_session_count(user, task: CognitiveTask) -> int:
    """Number of completed sessions for this user×task."""
    return CognitiveSession.objects.filter(
        user=user, task=task, ended_at__isnull=False,
    ).count()


def get_recent_accuracies(
    user, task: CognitiveTask, limit: int = 5,
) -> list[float]:
    """
    Last *limit* session accuracies, oldest first.

    Used to compute the improvement_trend feature in the RL state.
    """
    qs = (
        CognitiveSession.objects
        .filter(user=user, task=task, ended_at__isnull=False)
        .order_by("-started_at")
        .values_list("accuracy", flat=True)[:limit]
    )
    return list(reversed(list(qs)))


def get_last_completed_session(
    user, task: CognitiveTask,
) -> Optional[CognitiveSession]:
    """Most recently completed session for this user×task, or None."""
    return (
        CognitiveSession.objects
        .filter(user=user, task=task, ended_at__isnull=False)
        .order_by("-started_at")
        .first()
    )


def get_previous_session(
    user,
    task: CognitiveTask,
    exclude_session_id: int,
) -> Optional[CognitiveSession]:
    """
    Most recently completed session, excluding the given session ID.

    Used to get ``prev_accuracy`` for the improvement reward component.
    """
    return (
        CognitiveSession.objects
        .filter(user=user, task=task, ended_at__isnull=False)
        .exclude(id=exclude_session_id)
        .order_by("-started_at")
        .first()
    )


# ─────────────────────────────────────────────────────────────────────────────
# State Vector Construction
# ─────────────────────────────────────────────────────────────────────────────

def build_state_from_history(
    user,
    task: CognitiveTask,
    session_accuracy: float,
    session_avg_rt_ms: float,
    error_breakdown: dict,
    total_trials: int,
    current_difficulty: int,
) -> "import numpy; numpy.ndarray":
    """
    Build the full 8-dim RL state vector from DB history + current session.

    This is the main entry point for constructing the RL observation.
    It queries the DB for historical context (session count, recent
    accuracies, recency) and combines it with the current session's metrics.
    """
    import numpy as np

    session_count = get_completed_session_count(user, task)
    recent_accs = get_recent_accuracies(user, task)
    last_session = get_last_completed_session(user, task)

    hours_since = compute_hours_since(
        last_session.ended_at if last_session else None,
    )

    metrics = build_session_metrics_for_rl(
        session_accuracy=session_accuracy,
        session_avg_rt_ms=session_avg_rt_ms,
        error_breakdown=error_breakdown,
        total_trials=total_trials,
        current_difficulty=current_difficulty,
        total_sessions_for_task=session_count,
        recent_accuracies=recent_accs,
        hours_since_last=hours_since,
        difficulty_min=task.min_difficulty,
        difficulty_max=task.max_difficulty,
    )

    return build_state_vector(metrics)


# ─────────────────────────────────────────────────────────────────────────────
# High-Level Orchestration
# ─────────────────────────────────────────────────────────────────────────────

def select_difficulty(user, task: CognitiveTask) -> DifficultyDecision:
    """
    Full RL decision cycle for selecting the next session's difficulty.

    Called at session start. Returns the difficulty level and audit data.

    For cold-start users (no completed sessions), returns a safe default
    difficulty of 3 without invoking the RL agent.
    """
    session_count = get_completed_session_count(user, task)

    if session_count == 0:
        return DifficultyDecision(
            difficulty=COLD_START_DIFFICULTY,
            action_index=2,  # delta=0
            action_delta=0,
            log_prob=0.0,
            is_cold_start=True,
        )

    agent, _ = load_agent(user, task)
    last_session = get_last_completed_session(user, task)

    if last_session is None:
        # Shouldn't happen if session_count > 0, but be safe
        return DifficultyDecision(
            difficulty=COLD_START_DIFFICULTY,
            action_index=2,
            action_delta=0,
            log_prob=0.0,
            is_cold_start=True,
        )

    # Build state from the last session's outcome
    state_vec = build_state_from_history(
        user=user,
        task=task,
        session_accuracy=last_session.accuracy,
        session_avg_rt_ms=last_session.avg_reaction_time_ms,
        error_breakdown=last_session.error_breakdown or {},
        total_trials=last_session.total_trials,
        current_difficulty=last_session.difficulty,
    )

    action_index, log_prob = agent.select_action(state_vec)
    delta = agent.get_difficulty_delta(action_index)
    difficulty = max(
        task.min_difficulty,
        min(task.max_difficulty, last_session.difficulty + delta),
    )

    return DifficultyDecision(
        difficulty=difficulty,
        action_index=action_index,
        action_delta=delta,
        log_prob=log_prob,
        is_cold_start=False,
    )


def update_agent_after_session(
    user,
    task: CognitiveTask,
    session: CognitiveSession,
    session_metrics: dict,
) -> UpdateResult:
    """
    Full RL training cycle after a session is completed.

    Steps
    -----
    1. Load agent weights from DB (or create fresh).
    2. Build the state vector from the just-completed session.
    3. Compute the composite reward.
    4. Run PPO update (3 epochs).
    5. Persist new weights to DB.
    6. Determine the predicted next difficulty.

    Parameters
    ----------
    user : auth.User
    task : CognitiveTask
    session : CognitiveSession
        The completed session (must have ``ended_at``, ``accuracy``, etc.).
    session_metrics : dict
        Output of ``compute_session_metrics()``.

    Returns
    -------
    UpdateResult
    """
    agent, agent_db = load_agent(user, task)

    # Build state vector
    state_vec = build_state_from_history(
        user=user,
        task=task,
        session_accuracy=session_metrics["accuracy"],
        session_avg_rt_ms=session_metrics["avg_reaction_time_ms"],
        error_breakdown=session_metrics["error_breakdown"],
        total_trials=session_metrics["total_trials"],
        current_difficulty=session.difficulty,
    )

    # Get the action that was taken at session start
    rl_action_index = ACTION_DELTAS.index(session.rl_action or 0)

    # Re-evaluate log_prob under current policy (needed for PPO ratio)
    _, log_prob = agent.select_action(state_vec)

    # Previous session for improvement reward
    prev_session = get_previous_session(user, task, session.id)
    prev_accuracy = prev_session.accuracy if prev_session else None

    # Compute reward
    normalized_rt = min(
        session_metrics["avg_reaction_time_ms"] / 5000.0, 1.0,
    )
    reward = compute_reward(
        accuracy=session_metrics["accuracy"],
        normalized_rt=normalized_rt,
        prev_accuracy=prev_accuracy,
        action_index=rl_action_index,
    )

    # PPO update
    loss = agent.update(state_vec, rl_action_index, log_prob, reward)

    # Persist
    save_agent(agent, user, task, reward, loss, existing_state=agent_db)

    # Predict next difficulty
    next_action_idx, _ = agent.select_action(state_vec)
    next_delta = agent.get_difficulty_delta(next_action_idx)
    next_difficulty = max(
        task.min_difficulty,
        min(task.max_difficulty, session.difficulty + next_delta),
    )

    return UpdateResult(
        reward=reward,
        loss=loss,
        next_difficulty=next_difficulty,
        next_action_delta=next_delta,
        total_episodes=agent.total_episodes,
    )
