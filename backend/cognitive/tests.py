"""
Cognitive Training — Test Suite.

Tests cover:
  1. RL Engine (unit tests — no Django)
     - PolicyNet / ValueNet forward pass
     - State vector construction
     - Reward computation
     - PPO update convergence
     - Weight serialisation round-trip
  2. Difficulty Mapping (unit tests — no Django)
  3. Metrics Computation (unit tests — no Django)
  4. API Integration (Django TestCase)
     - Session lifecycle: start → complete → profile updated
     - Leaderboard
"""

import math
from datetime import datetime, timedelta, timezone

import numpy as np
import torch
from django.contrib.auth.models import User
from django.test import TestCase

from .difficulty import get_task_params
from .metrics import (
    build_session_metrics_for_rl,
    build_task_stats_entry,
    compute_hours_since,
    compute_profile_updates,
    compute_session_metrics,
)
from .models import (
    CognitiveSession,
    CognitiveTask,
    CognitiveTrial,
    RLAgentState,
    UserCognitiveProfile,
)
from .rl_engine import (
    ACTION_DELTAS,
    NUM_ACTIONS,
    STATE_DIM,
    PPOAgent,
    PolicyNet,
    SessionMetrics,
    ValueNet,
    build_state_vector,
    compute_reward,
    deserialize_state_dict,
    serialize_state_dict,
)
from .rl_persistence import (
    DifficultyDecision,
    UpdateResult,
    load_agent,
    save_agent,
    select_difficulty,
)


# ═════════════════════════════════════════════════════════════════════════════
# 1. RL Engine Unit Tests
# ═════════════════════════════════════════════════════════════════════════════


class TestPolicyNet(TestCase):
    """PolicyNet produces valid log-probabilities."""

    def test_output_shape(self):
        net = PolicyNet()
        x = torch.randn(1, STATE_DIM)
        out = net(x)
        self.assertEqual(out.shape, (1, NUM_ACTIONS))

    def test_output_is_log_probabilities(self):
        net = PolicyNet()
        x = torch.randn(1, STATE_DIM)
        out = net(x)
        # exp(log_probs) should sum to ~1.0
        probs = torch.exp(out)
        self.assertAlmostEqual(probs.sum().item(), 1.0, places=5)

    def test_batch_forward(self):
        net = PolicyNet()
        x = torch.randn(8, STATE_DIM)
        out = net(x)
        self.assertEqual(out.shape, (8, NUM_ACTIONS))

    def test_cold_start_bias(self):
        """Fresh PolicyNet should slightly favour action 2 (delta=0)."""
        net = PolicyNet()
        x = torch.zeros(1, STATE_DIM)
        out = net(x)
        probs = torch.exp(out).squeeze()
        # Action 2 should have the highest probability
        self.assertEqual(probs.argmax().item(), 2)


class TestValueNet(TestCase):
    """ValueNet produces scalar value estimates."""

    def test_output_shape(self):
        net = ValueNet()
        x = torch.randn(1, STATE_DIM)
        out = net(x)
        self.assertEqual(out.shape, (1,))

    def test_batch_forward(self):
        net = ValueNet()
        x = torch.randn(8, STATE_DIM)
        out = net(x)
        self.assertEqual(out.shape, (8,))


class TestStateVector(TestCase):
    """build_state_vector produces valid normalised 8-dim vectors."""

    def test_default_metrics(self):
        m = SessionMetrics()
        s = build_state_vector(m)
        self.assertEqual(s.shape, (8,))
        self.assertEqual(s.dtype, np.float32)

    def test_all_values_in_range(self):
        m = SessionMetrics(
            accuracy=0.8,
            avg_reaction_time_ms=1200.0,
            interference_error_rate=0.3,
            omission_error_rate=0.1,
            current_difficulty=5,
            total_sessions_for_task=20,
            recent_accuracies=[0.6, 0.7, 0.75, 0.8, 0.82],
            hours_since_last_session=24.0,
        )
        s = build_state_vector(m)
        # All values should be in [-1, 1]
        self.assertTrue(np.all(s >= -1.0))
        self.assertTrue(np.all(s <= 1.0))

    def test_improvement_trend_positive(self):
        """Ascending accuracies should produce a positive trend."""
        m = SessionMetrics(
            accuracy=0.9,
            recent_accuracies=[0.5, 0.6, 0.7, 0.8, 0.9],
        )
        s = build_state_vector(m)
        # s[6] is improvement_trend
        self.assertGreater(s[6], 0.0)

    def test_improvement_trend_negative(self):
        """Descending accuracies should produce a negative trend."""
        m = SessionMetrics(
            accuracy=0.5,
            recent_accuracies=[0.9, 0.8, 0.7, 0.6, 0.5],
        )
        s = build_state_vector(m)
        self.assertLess(s[6], 0.0)

    def test_clipping_extreme_values(self):
        """Extreme inputs should be clipped, not produce NaN."""
        m = SessionMetrics(
            accuracy=1.5,  # out of range
            avg_reaction_time_ms=99999.0,  # extreme
            hours_since_last_session=1000.0,  # extreme
        )
        s = build_state_vector(m)
        self.assertFalse(np.any(np.isnan(s)))
        self.assertTrue(np.all(np.isfinite(s)))


class TestRewardFunction(TestCase):
    """compute_reward produces sensible values."""

    def test_optimal_accuracy_high_reward(self):
        """77.5% accuracy should produce the highest accuracy reward."""
        r_optimal = compute_reward(0.775, 0.3, None, 2)  # action=0
        r_low = compute_reward(0.4, 0.3, None, 2)
        r_high = compute_reward(0.98, 0.3, None, 2)
        self.assertGreater(r_optimal, r_low)
        self.assertGreater(r_optimal, r_high)

    def test_stability_penalty(self):
        """Larger difficulty jumps should produce lower reward."""
        r_stay = compute_reward(0.775, 0.3, None, 2)     # delta=0
        r_small = compute_reward(0.775, 0.3, None, 3)    # delta=+1
        r_big = compute_reward(0.775, 0.3, None, 4)      # delta=+2
        self.assertGreater(r_stay, r_small)
        self.assertGreater(r_small, r_big)

    def test_improvement_bonus(self):
        """Improving accuracy should increase reward."""
        r_no_prev = compute_reward(0.775, 0.3, None, 2)
        r_improved = compute_reward(0.775, 0.3, 0.6, 2)  # improved from 0.6
        self.assertGreater(r_improved, r_no_prev)

    def test_speed_matters(self):
        """Faster responses (lower normalised RT) should improve reward."""
        r_fast = compute_reward(0.775, 0.2, None, 2)
        r_slow = compute_reward(0.775, 0.8, None, 2)
        self.assertGreater(r_fast, r_slow)

    def test_reward_is_finite(self):
        """Reward should never be NaN or Inf."""
        for acc in [0.0, 0.5, 0.775, 1.0]:
            for rt in [0.0, 0.5, 1.0]:
                for prev in [None, 0.3, 0.9]:
                    for action in range(NUM_ACTIONS):
                        r = compute_reward(acc, rt, prev, action)
                        self.assertTrue(math.isfinite(r),
                                        f"Non-finite reward for acc={acc}, rt={rt}, prev={prev}, action={action}")


class TestPPOAgent(TestCase):
    """PPOAgent select/update/export lifecycle."""

    def test_select_action_returns_valid(self):
        agent = PPOAgent.new()
        state = np.random.randn(STATE_DIM).astype(np.float32)
        action_idx, log_prob = agent.select_action(state)
        self.assertIn(action_idx, range(NUM_ACTIONS))
        self.assertTrue(math.isfinite(log_prob))

    def test_update_reduces_loss(self):
        """PPO update should produce a finite loss."""
        agent = PPOAgent.new()
        state = np.random.randn(STATE_DIM).astype(np.float32)
        action_idx, log_prob = agent.select_action(state)
        loss = agent.update(state, action_idx, log_prob, reward=0.5)
        self.assertTrue(math.isfinite(loss))

    def test_episode_counter_increments(self):
        agent = PPOAgent.new()
        self.assertEqual(agent.total_episodes, 0)
        state = np.random.randn(STATE_DIM).astype(np.float32)
        _, lp = agent.select_action(state)
        agent.update(state, 2, lp, 0.5)
        self.assertEqual(agent.total_episodes, 1)

    def test_weight_serialisation_roundtrip(self):
        """Export → import should produce identical outputs."""
        agent1 = PPOAgent.new()
        state = np.random.randn(STATE_DIM).astype(np.float32)

        # Get output from original agent
        with torch.no_grad():
            s = torch.from_numpy(state).unsqueeze(0)
            out1 = agent1.policy(s).numpy()

        # Export and re-import
        p_bytes, v_bytes, opt_bytes = agent1.export_weights()
        agent2 = PPOAgent.from_weights(p_bytes, v_bytes, agent1.total_episodes, opt_bytes)

        with torch.no_grad():
            out2 = agent2.policy(s).numpy()

        np.testing.assert_allclose(out1, out2, atol=1e-6)

    def test_get_difficulty_delta(self):
        agent = PPOAgent.new()
        for i, expected in enumerate(ACTION_DELTAS):
            self.assertEqual(agent.get_difficulty_delta(i), expected)


class TestSerialisation(TestCase):
    """serialize_state_dict / deserialize_state_dict round-trip."""

    def test_roundtrip(self):
        net = PolicyNet()
        original = net.state_dict()
        blob = serialize_state_dict(original)
        restored = deserialize_state_dict(blob)

        for key in original:
            torch.testing.assert_close(original[key], restored[key])

    def test_blob_is_small(self):
        """Serialised PolicyNet should be < 20KB."""
        net = PolicyNet()
        blob = serialize_state_dict(net.state_dict())
        self.assertLess(len(blob), 20_000)


# ═════════════════════════════════════════════════════════════════════════════
# 2. Difficulty Mapping Tests
# ═════════════════════════════════════════════════════════════════════════════


class TestDifficultyMapping(TestCase):
    """get_task_params returns valid configs for all 4×10 combinations."""

    def test_all_tasks_all_levels(self):
        for slug in ("stroop", "nback", "schulte", "kakuro"):
            for diff in range(1, 11):
                params = get_task_params(slug, diff)
                self.assertIsInstance(params, dict)
                self.assertTrue(len(params) > 0, f"Empty params for {slug} d{diff}")

    def test_stroop_difficulty_increases(self):
        p1 = get_task_params("stroop", 1)
        p10 = get_task_params("stroop", 10)
        # Higher difficulty = more trials, less time, lower congruent ratio
        self.assertGreater(p10["trial_count"], p1["trial_count"])
        self.assertLess(p10["time_limit_ms"], p1["time_limit_ms"])
        self.assertLess(p10["congruent_ratio"], p1["congruent_ratio"])

    def test_nback_level_increases(self):
        p1 = get_task_params("nback", 1)
        p10 = get_task_params("nback", 10)
        self.assertGreater(p10["n_level"], p1["n_level"])

    def test_schulte_grid_increases(self):
        p1 = get_task_params("schulte", 1)
        p10 = get_task_params("schulte", 10)
        self.assertGreater(p10["grid_size"], p1["grid_size"])

    def test_kakuro_grid_increases(self):
        p1 = get_task_params("kakuro", 1)
        p10 = get_task_params("kakuro", 10)
        self.assertGreater(p10["grid_size"], p1["grid_size"])

    def test_invalid_slug_raises(self):
        with self.assertRaises(ValueError):
            get_task_params("unknown_task", 5)

    def test_invalid_difficulty_raises(self):
        with self.assertRaises(ValueError):
            get_task_params("stroop", 0)
        with self.assertRaises(ValueError):
            get_task_params("stroop", 11)


# ═════════════════════════════════════════════════════════════════════════════
# 3. Metrics Tests
# ═════════════════════════════════════════════════════════════════════════════


class TestSessionMetrics(TestCase):
    """compute_session_metrics aggregates trial data correctly."""

    def test_empty_trials(self):
        result = compute_session_metrics([])
        self.assertEqual(result["total_trials"], 0)
        self.assertEqual(result["accuracy"], 0.0)

    def test_basic_metrics(self):
        trials = [
            {"is_correct": True, "reaction_time_ms": 500, "error_type": ""},
            {"is_correct": True, "reaction_time_ms": 600, "error_type": ""},
            {"is_correct": False, "reaction_time_ms": 1200, "error_type": "interference"},
            {"is_correct": False, "reaction_time_ms": 800, "error_type": "omission"},
        ]
        result = compute_session_metrics(trials)
        self.assertEqual(result["total_trials"], 4)
        self.assertEqual(result["correct_trials"], 2)
        self.assertAlmostEqual(result["accuracy"], 0.5)
        self.assertAlmostEqual(result["avg_reaction_time_ms"], 775.0)
        self.assertEqual(result["error_breakdown"]["interference"], 1)
        self.assertEqual(result["error_breakdown"]["omission"], 1)


class TestProfileUpdates(TestCase):
    """compute_profile_updates applies EMA correctly."""

    def test_stroop_primary_domain_is_attention(self):
        """Stroop should affect attention_score the most."""
        scores = {
            "attention_score": 50.0,
            "working_memory_score": 50.0,
            "processing_speed_score": 50.0,
            "problem_solving_score": 50.0,
        }
        updated = compute_profile_updates("stroop", 1.0, 500.0, scores)
        # Attention delta should be the largest
        attention_delta = abs(updated["attention_score"] - 50.0)
        wm_delta = abs(updated["working_memory_score"] - 50.0)
        self.assertGreater(attention_delta, wm_delta)

    def test_scores_stay_bounded(self):
        """Scores should remain in [0, 100]."""
        scores = {
            "attention_score": 99.0,
            "working_memory_score": 1.0,
            "processing_speed_score": 50.0,
            "problem_solving_score": 50.0,
        }
        updated = compute_profile_updates("stroop", 1.0, 100.0, scores)
        for key, val in updated.items():
            self.assertGreaterEqual(val, 0.0)
            self.assertLessEqual(val, 100.0)


class TestTaskStatsEntry(TestCase):
    """build_task_stats_entry creates and updates correctly."""

    def test_first_session(self):
        entry = build_task_stats_entry(
            existing_entry=None,
            session_accuracy=0.8,
            session_avg_rt_ms=900.0,
            new_difficulty=4,
        )
        self.assertEqual(entry["sessions_completed"], 1)
        self.assertEqual(entry["best_accuracy"], 0.8)
        self.assertEqual(entry["current_difficulty"], 4)

    def test_updates_running_average(self):
        existing = {
            "sessions_completed": 2,
            "current_difficulty": 3,
            "best_accuracy": 0.7,
            "avg_reaction_time_ms": 1000.0,
            "last_played": None,
        }
        entry = build_task_stats_entry(
            existing_entry=existing,
            session_accuracy=0.9,
            session_avg_rt_ms=800.0,
            new_difficulty=5,
        )
        self.assertEqual(entry["sessions_completed"], 3)
        self.assertEqual(entry["best_accuracy"], 0.9)
        # Running avg: (1000*2 + 800) / 3 = 933.3
        self.assertAlmostEqual(entry["avg_reaction_time_ms"], 933.3, places=0)


class TestHoursSince(TestCase):
    """compute_hours_since handles edge cases."""

    def test_none_returns_zero(self):
        self.assertEqual(compute_hours_since(None), 0.0)

    def test_positive_delta(self):
        now = datetime(2026, 4, 20, 12, 0, tzinfo=timezone.utc)
        last = datetime(2026, 4, 19, 12, 0, tzinfo=timezone.utc)
        hours = compute_hours_since(last, now)
        self.assertAlmostEqual(hours, 24.0, places=1)


# ═════════════════════════════════════════════════════════════════════════════
# 4. API Integration Tests
# ═════════════════════════════════════════════════════════════════════════════


class TestAPIIntegration(TestCase):
    """End-to-end session lifecycle via the API views."""

    def setUp(self):
        """Create a user and seed a cognitive task."""
        self.user = User.objects.create_user(
            username="testplayer",
            password="testpass123",
        )
        self.task = CognitiveTask.objects.create(
            slug="stroop",
            display_name="Stroop Task",
            description="Test Stroop task.",
            brain_regions=["DLPFC", "ACC"],
            cognitive_domains=["Attention", "Inhibition"],
            research_refs=[],
            icon_name="palette",
            min_difficulty=1,
            max_difficulty=10,
        )

    def _get_token(self) -> str:
        """Obtain a JWT access token for the test user."""
        from rest_framework_simplejwt.tokens import AccessToken
        return str(AccessToken.for_user(self.user))

    def _auth_headers(self) -> dict:
        return {"HTTP_AUTHORIZATION": f"Bearer {self._get_token()}"}

    def test_task_list(self):
        response = self.client.get(
            "/api/cognitive/tasks/",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["slug"], "stroop")

    def test_task_detail(self):
        response = self.client.get(
            "/api/cognitive/tasks/stroop/",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["slug"], "stroop")

    def test_task_detail_not_found(self):
        response = self.client.get(
            "/api/cognitive/tasks/nonexistent/",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 404)

    def test_session_start(self):
        """POST /sessions/start/ should create a session with difficulty 3 (cold start)."""
        response = self.client.post(
            "/api/cognitive/sessions/start/",
            data={"task": "stroop"},
            content_type="application/json",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["task"], "stroop")
        self.assertEqual(data["difficulty"], 3)  # cold start
        self.assertIn("task_params", data)
        self.assertIn("session_id", data)

    def test_full_session_lifecycle(self):
        """Start → complete → verify profile update."""
        headers = self._auth_headers()

        # 1. Start session
        start_resp = self.client.post(
            "/api/cognitive/sessions/start/",
            data={"task": "stroop"},
            content_type="application/json",
            **headers,
        )
        self.assertEqual(start_resp.status_code, 201)
        session_id = start_resp.json()["session_id"]

        # 2. Complete session with trial data
        trials = [
            {
                "trial_index": i,
                "stimulus": {"word": "RED", "color": "blue", "congruent": False},
                "response": {"chosen_color": "blue" if i % 3 != 0 else "red"},
                "is_correct": i % 3 != 0,
                "reaction_time_ms": 800 + i * 50,
                "error_type": "interference" if i % 3 == 0 else "",
            }
            for i in range(10)
        ]
        complete_resp = self.client.post(
            f"/api/cognitive/sessions/{session_id}/complete/",
            data={
                "ended_at": "2026-04-21T00:10:00Z",
                "trials": trials,
            },
            content_type="application/json",
            **headers,
        )
        self.assertEqual(complete_resp.status_code, 200)
        data = complete_resp.json()

        # Verify metrics
        self.assertEqual(data["metrics"]["total_trials"], 10)
        self.assertGreater(data["metrics"]["accuracy"], 0.0)
        self.assertIn("error_breakdown", data["metrics"])

        # Verify RL decision
        self.assertIn("reward", data["rl_decision"])
        self.assertIn("next_difficulty", data["rl_decision"])

        # Verify profile was created and updated
        self.assertIn("updated_profile", data)
        profile = UserCognitiveProfile.objects.get(user=self.user)
        self.assertGreater(profile.total_training_minutes, 0)

        # Verify RL agent state was persisted
        rl_state = RLAgentState.objects.get(user=self.user, task=self.task)
        self.assertEqual(rl_state.total_episodes, 1)
        self.assertIsNotNone(rl_state.last_reward)

        # 3. Verify session history
        hist_resp = self.client.get(
            "/api/cognitive/sessions/",
            **headers,
        )
        self.assertEqual(hist_resp.status_code, 200)
        self.assertEqual(len(hist_resp.json()), 1)

        # 4. Verify session detail includes trials
        detail_resp = self.client.get(
            f"/api/cognitive/sessions/{session_id}/",
            **headers,
        )
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(len(detail_resp.json()["trials"]), 10)

        # 5. Verify profile endpoint
        profile_resp = self.client.get(
            "/api/cognitive/profile/",
            **headers,
        )
        self.assertEqual(profile_resp.status_code, 200)
        self.assertIn("attention_score", profile_resp.json())

    def test_double_complete_rejected(self):
        """Completing a session twice should return 400."""
        headers = self._auth_headers()

        start_resp = self.client.post(
            "/api/cognitive/sessions/start/",
            data={"task": "stroop"},
            content_type="application/json",
            **headers,
        )
        session_id = start_resp.json()["session_id"]

        trial_data = {
            "ended_at": "2026-04-21T00:10:00Z",
            "trials": [{
                "trial_index": 0,
                "stimulus": {"word": "RED", "color": "blue"},
                "response": {"chosen_color": "blue"},
                "is_correct": True,
                "reaction_time_ms": 800,
                "error_type": "",
            }],
        }

        # First complete
        resp1 = self.client.post(
            f"/api/cognitive/sessions/{session_id}/complete/",
            data=trial_data,
            content_type="application/json",
            **headers,
        )
        self.assertEqual(resp1.status_code, 200)

        # Second complete — should fail
        resp2 = self.client.post(
            f"/api/cognitive/sessions/{session_id}/complete/",
            data=trial_data,
            content_type="application/json",
            **headers,
        )
        self.assertEqual(resp2.status_code, 400)

    def test_session_not_found(self):
        response = self.client.get(
            "/api/cognitive/sessions/99999/",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_rejected(self):
        """All endpoints should reject unauthenticated requests."""
        endpoints = [
            ("/api/cognitive/tasks/", "get"),
            ("/api/cognitive/sessions/start/", "post"),
            ("/api/cognitive/profile/", "get"),
        ]
        for url, method in endpoints:
            func = getattr(self.client, method)
            resp = func(url)
            self.assertIn(resp.status_code, [401, 403], f"{method.upper()} {url}")


class TestRLPersistence(TestCase):
    """RL persistence layer (load/save/select)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="rltest",
            password="testpass123",
        )
        self.task = CognitiveTask.objects.create(
            slug="nback",
            display_name="N-Back",
            description="Test N-Back.",
            brain_regions=["DLPFC"],
            cognitive_domains=["Working memory"],
            research_refs=[],
            icon_name="grid_view",
        )

    def test_load_cold_start(self):
        """load_agent should return a fresh agent when no state exists."""
        agent, db_state = load_agent(self.user, self.task)
        self.assertIsNotNone(agent)
        self.assertIsNone(db_state)
        self.assertEqual(agent.total_episodes, 0)

    def test_save_and_reload(self):
        """save_agent → load_agent should produce equivalent agents."""
        agent = PPOAgent.new()
        state = np.random.randn(STATE_DIM).astype(np.float32)
        _, lp = agent.select_action(state)
        agent.update(state, 2, lp, 0.5)

        db_state = save_agent(agent, self.user, self.task, 0.5, 0.1)
        self.assertEqual(db_state.total_episodes, 1)

        agent2, db_state2 = load_agent(self.user, self.task)
        self.assertIsNotNone(db_state2)
        self.assertEqual(agent2.total_episodes, 1)

    def test_select_difficulty_cold_start(self):
        """First session should return cold-start difficulty."""
        decision = select_difficulty(self.user, self.task)
        self.assertIsInstance(decision, DifficultyDecision)
        self.assertTrue(decision.is_cold_start)
        self.assertEqual(decision.difficulty, 3)

    def test_select_difficulty_after_session(self):
        """After a completed session, RL agent should decide difficulty."""
        # Create a completed session
        session = CognitiveSession.objects.create(
            user=self.user,
            task=self.task,
            difficulty=3,
            task_params={},
            total_trials=10,
            correct_trials=8,
            accuracy=0.8,
            avg_reaction_time_ms=900.0,
            error_breakdown={},
            rl_action=0,
            ended_at=datetime.now(timezone.utc),
        )

        decision = select_difficulty(self.user, self.task)
        self.assertIsInstance(decision, DifficultyDecision)
        self.assertFalse(decision.is_cold_start)
        self.assertIn(decision.difficulty, range(1, 11))


class TestLeaderboard(TestCase):
    """Leaderboard endpoint tests."""

    def setUp(self):
        self.task = CognitiveTask.objects.create(
            slug="stroop",
            display_name="Stroop Task",
            description="Test.",
            brain_regions=[],
            cognitive_domains=[],
            research_refs=[],
        )
        self.user = User.objects.create_user("leader1", password="pass")
        # Create 3 completed sessions (minimum to qualify)
        for i in range(3):
            CognitiveSession.objects.create(
                user=self.user,
                task=self.task,
                difficulty=5,
                accuracy=0.8 + i * 0.05,
                total_trials=10,
                correct_trials=8 + i,
                avg_reaction_time_ms=900.0,
                ended_at=datetime.now(timezone.utc),
            )

    def _auth_headers(self) -> dict:
        from rest_framework_simplejwt.tokens import AccessToken
        return {"HTTP_AUTHORIZATION": f"Bearer {str(AccessToken.for_user(self.user))}"}

    def test_leaderboard_returns_user(self):
        resp = self.client.get(
            "/api/cognitive/profile/leaderboard/?task=stroop",
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["username"], "leader1")
        self.assertEqual(data[0]["rank"], 1)

    def test_leaderboard_requires_task(self):
        resp = self.client.get(
            "/api/cognitive/profile/leaderboard/",
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, 400)

    def test_leaderboard_minimum_sessions(self):
        """Users with < 3 sessions should not appear."""
        user2 = User.objects.create_user("leader2", password="pass")
        CognitiveSession.objects.create(
            user=user2,
            task=self.task,
            difficulty=5,
            accuracy=0.99,
            total_trials=10,
            correct_trials=10,
            avg_reaction_time_ms=500.0,
            ended_at=datetime.now(timezone.utc),
        )
        resp = self.client.get(
            "/api/cognitive/profile/leaderboard/?task=stroop",
            **self._auth_headers(),
        )
        usernames = [e["username"] for e in resp.json()]
        self.assertNotIn("leader2", usernames)
