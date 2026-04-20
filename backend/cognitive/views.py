"""
Cognitive Training — API Views.

Follows the existing StudyBee convention: class-based ``APIView`` subclasses,
``IsAuthenticated`` permission, user-scoped querysets.

Endpoints
---------
GET    /api/cognitive/tasks/                   List all tasks (with science data)
GET    /api/cognitive/tasks/<slug>/             Single task detail
POST   /api/cognitive/sessions/start/           Start a session (RL picks difficulty)
POST   /api/cognitive/sessions/<id>/complete/   Submit trials, RL update
GET    /api/cognitive/sessions/                 User's session history
GET    /api/cognitive/sessions/<id>/            Session detail + trials
GET    /api/cognitive/profile/                  User's cognitive profile
GET    /api/cognitive/profile/history/          Time-series for charts
GET    /api/cognitive/profile/leaderboard/      Top users per task
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from django.db.models import Avg, Count, Max, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
    COLD_START_DIFFICULTY,
    PPOAgent,
    build_state_vector,
    compute_reward,
)
from .serializers import (
    CognitiveSessionDetailSerializer,
    CognitiveSessionListSerializer,
    CognitiveTaskSerializer,
    CompleteSessionSerializer,
    HistoryResponseSerializer,
    LeaderboardEntrySerializer,
    SessionCompleteResponseSerializer,
    SessionStartResponseSerializer,
    StartSessionSerializer,
    UserCognitiveProfileSerializer,
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _get_or_create_profile(user) -> UserCognitiveProfile:
    """Get or lazily create the user's cognitive profile."""
    profile, _ = UserCognitiveProfile.objects.get_or_create(user=user)
    return profile


def _get_recent_accuracies(user, task: CognitiveTask, limit: int = 5) -> list[float]:
    """Return the last *limit* session accuracies for this user/task (oldest first)."""
    qs = (
        CognitiveSession.objects
        .filter(user=user, task=task, ended_at__isnull=False)
        .order_by("-started_at")
        .values_list("accuracy", flat=True)[:limit]
    )
    return list(reversed(list(qs)))


def _get_last_session(user, task: CognitiveTask) -> CognitiveSession | None:
    """Return the most recently completed session, or None."""
    return (
        CognitiveSession.objects
        .filter(user=user, task=task, ended_at__isnull=False)
        .order_by("-started_at")
        .first()
    )


def _load_or_create_agent(
    user, task: CognitiveTask
) -> tuple[PPOAgent, RLAgentState | None]:
    """
    Load persisted PPO agent weights, or create a fresh agent.

    Returns (agent, db_row_or_None).
    """
    try:
        state = RLAgentState.objects.get(user=user, task=task)
        agent = PPOAgent.from_weights(
            policy_bytes=bytes(state.policy_weights),
            value_bytes=bytes(state.value_weights),
            total_episodes=state.total_episodes,
            optimizer_bytes=bytes(state.optimizer_state) if state.optimizer_state else None,
        )
        return agent, state
    except RLAgentState.DoesNotExist:
        return PPOAgent.new(), None


# ─────────────────────────────────────────────────────────────────────────────
# Task Views
# ─────────────────────────────────────────────────────────────────────────────

class CognitiveTaskListView(APIView):
    """GET /api/cognitive/tasks/ — list all cognitive tasks."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = CognitiveTask.objects.all()
        serializer = CognitiveTaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CognitiveTaskDetailView(APIView):
    """GET /api/cognitive/tasks/<slug>/ — single task with full science data."""

    permission_classes = [IsAuthenticated]

    def get(self, request, slug: str):
        try:
            task = CognitiveTask.objects.get(slug=slug)
        except CognitiveTask.DoesNotExist:
            return Response(
                {"detail": f"Task '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CognitiveTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Session Views
# ─────────────────────────────────────────────────────────────────────────────

class StartSessionView(APIView):
    """
    POST /api/cognitive/sessions/start/

    Starts a new cognitive session.  The RL agent selects the difficulty
    based on the user's history with this task.

    Request body: ``{ "task": "stroop" }``
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = StartSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        task: CognitiveTask = ser.validated_data["task"]
        user = request.user

        # Ensure profile exists
        _get_or_create_profile(user)

        # Load agent + history
        agent, agent_state = _load_or_create_agent(user, task)
        last_session = _get_last_session(user, task)
        recent_accs = _get_recent_accuracies(user, task)
        session_count = CognitiveSession.objects.filter(
            user=user, task=task, ended_at__isnull=False,
        ).count()

        # Decide difficulty
        if session_count == 0:
            # Cold start: use a safe default
            difficulty = COLD_START_DIFFICULTY
            rl_action_index = 2  # delta=0 (notional)
        else:
            # Build state from last completed session
            prev_difficulty = last_session.difficulty if last_session else COLD_START_DIFFICULTY
            hours_since = compute_hours_since(
                last_session.ended_at if last_session else None,
            )

            metrics = build_session_metrics_for_rl(
                session_accuracy=last_session.accuracy if last_session else 0.5,
                session_avg_rt_ms=last_session.avg_reaction_time_ms if last_session else 2000.0,
                error_breakdown=last_session.error_breakdown if last_session else {},
                total_trials=last_session.total_trials if last_session else 0,
                current_difficulty=prev_difficulty,
                total_sessions_for_task=session_count,
                recent_accuracies=recent_accs,
                hours_since_last=hours_since,
                difficulty_min=task.min_difficulty,
                difficulty_max=task.max_difficulty,
            )
            state_vec = build_state_vector(metrics)
            rl_action_index, _ = agent.select_action(state_vec)
            delta = agent.get_difficulty_delta(rl_action_index)
            difficulty = max(
                task.min_difficulty,
                min(task.max_difficulty, prev_difficulty + delta),
            )

        # Map difficulty to concrete game parameters
        task_params = get_task_params(task.slug, difficulty)

        # Create the session row
        session = CognitiveSession.objects.create(
            user=user,
            task=task,
            difficulty=difficulty,
            task_params=task_params,
            rl_action=ACTION_DELTAS[rl_action_index],
        )

        response_data = {
            "session_id": session.id,
            "task": task.slug,
            "difficulty": difficulty,
            "task_params": task_params,
            "started_at": session.started_at,
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


class CompleteSessionView(APIView):
    """
    POST /api/cognitive/sessions/<id>/complete/

    Submits trial data, computes metrics, runs RL update, persists everything.

    Request body: ``{ "ended_at": "...", "trials": [...] }``
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, session_id: int):
        # Fetch session
        try:
            session = CognitiveSession.objects.select_related("task").get(
                id=session_id, user=request.user,
            )
        except CognitiveSession.DoesNotExist:
            return Response(
                {"detail": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if session.ended_at is not None:
            return Response(
                {"detail": "Session already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate input
        ser = CompleteSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        trials_data = ser.validated_data["trials"]
        ended_at = ser.validated_data["ended_at"]

        # ── 1. Bulk-create trials ────────────────────────────────────────
        trial_objs = [
            CognitiveTrial(
                session=session,
                trial_index=t["trial_index"],
                stimulus=t["stimulus"],
                response=t["response"],
                is_correct=t["is_correct"],
                reaction_time_ms=t["reaction_time_ms"],
                error_type=t.get("error_type", ""),
            )
            for t in trials_data
        ]
        CognitiveTrial.objects.bulk_create(trial_objs)

        # ── 2. Compute session metrics ───────────────────────────────────
        metrics = compute_session_metrics(trials_data)

        session.ended_at = ended_at
        session.total_trials = metrics["total_trials"]
        session.correct_trials = metrics["correct_trials"]
        session.accuracy = metrics["accuracy"]
        session.avg_reaction_time_ms = metrics["avg_reaction_time_ms"]
        session.error_breakdown = metrics["error_breakdown"]

        # ── 3. RL update ─────────────────────────────────────────────────
        task = session.task
        user = request.user

        agent, agent_db = _load_or_create_agent(user, task)

        # Historical data for state vector
        recent_accs = _get_recent_accuracies(user, task)
        session_count = CognitiveSession.objects.filter(
            user=user, task=task, ended_at__isnull=False,
        ).count()

        # Previous session for improvement reward
        prev_sessions = (
            CognitiveSession.objects
            .filter(user=user, task=task, ended_at__isnull=False)
            .exclude(id=session.id)
            .order_by("-started_at")
        )
        prev_session = prev_sessions.first()
        prev_accuracy = prev_session.accuracy if prev_session else None

        hours_since = compute_hours_since(
            prev_session.ended_at if prev_session else None,
        )

        rl_metrics = build_session_metrics_for_rl(
            session_accuracy=metrics["accuracy"],
            session_avg_rt_ms=metrics["avg_reaction_time_ms"],
            error_breakdown=metrics["error_breakdown"],
            total_trials=metrics["total_trials"],
            current_difficulty=session.difficulty,
            total_sessions_for_task=session_count,
            recent_accuracies=recent_accs,
            hours_since_last=hours_since,
            difficulty_min=task.min_difficulty,
            difficulty_max=task.max_difficulty,
        )
        state_vec = build_state_vector(rl_metrics)

        # Reconstruct the action taken at session start
        rl_action_index = ACTION_DELTAS.index(session.rl_action or 0)

        # We need log_prob — re-evaluate under current policy
        _, log_prob = agent.select_action(state_vec)

        # Compute reward
        normalized_rt = min(
            metrics["avg_reaction_time_ms"] / 5000.0, 1.0,
        )
        reward = compute_reward(
            accuracy=metrics["accuracy"],
            normalized_rt=normalized_rt,
            prev_accuracy=prev_accuracy,
            action_index=rl_action_index,
        )
        session.reward = reward

        # PPO update
        loss = agent.update(state_vec, rl_action_index, log_prob, reward)

        # Persist agent weights
        p_bytes, v_bytes, opt_bytes = agent.export_weights()
        if agent_db is None:
            RLAgentState.objects.create(
                user=user,
                task=task,
                policy_weights=p_bytes,
                value_weights=v_bytes,
                optimizer_state=opt_bytes,
                total_episodes=agent.total_episodes,
                last_reward=reward,
                last_loss=loss,
            )
        else:
            agent_db.policy_weights = p_bytes
            agent_db.value_weights = v_bytes
            agent_db.optimizer_state = opt_bytes
            agent_db.total_episodes = agent.total_episodes
            agent_db.last_reward = reward
            agent_db.last_loss = loss
            agent_db.save()

        # ── 4. Update cognitive profile ──────────────────────────────────
        profile = _get_or_create_profile(user)

        current_scores = {
            "attention_score": profile.attention_score,
            "working_memory_score": profile.working_memory_score,
            "processing_speed_score": profile.processing_speed_score,
            "problem_solving_score": profile.problem_solving_score,
        }
        updated_scores = compute_profile_updates(
            task_slug=task.slug,
            session_accuracy=metrics["accuracy"],
            session_avg_rt_ms=metrics["avg_reaction_time_ms"],
            current_scores=current_scores,
        )
        profile.attention_score = updated_scores["attention_score"]
        profile.working_memory_score = updated_scores["working_memory_score"]
        profile.processing_speed_score = updated_scores["processing_speed_score"]
        profile.problem_solving_score = updated_scores["problem_solving_score"]

        # Determine next difficulty for task_stats
        next_action_idx, _ = agent.select_action(state_vec)
        next_delta = agent.get_difficulty_delta(next_action_idx)
        next_difficulty = max(
            task.min_difficulty,
            min(task.max_difficulty, session.difficulty + next_delta),
        )

        # Update per-task stats
        task_stats = dict(profile.task_stats or {})
        task_stats[task.slug] = build_task_stats_entry(
            existing_entry=task_stats.get(task.slug),
            session_accuracy=metrics["accuracy"],
            session_avg_rt_ms=metrics["avg_reaction_time_ms"],
            new_difficulty=next_difficulty,
            ended_at=ended_at,
        )
        profile.task_stats = task_stats

        # Accumulate training time
        dur = session.duration_seconds
        if dur and dur > 0:
            profile.total_training_minutes += dur / 60.0

        profile.save()

        # ── 5. Save session ──────────────────────────────────────────────
        session.save()

        # ── 6. Build response ────────────────────────────────────────────
        response_data = {
            "session_id": session.id,
            "metrics": {
                "total_trials": metrics["total_trials"],
                "correct": metrics["correct_trials"],
                "accuracy": metrics["accuracy"],
                "avg_reaction_time_ms": metrics["avg_reaction_time_ms"],
                "error_breakdown": metrics["error_breakdown"],
                "duration_seconds": dur or 0,
            },
            "rl_decision": {
                "reward": round(reward, 4),
                "previous_difficulty": session.difficulty,
                "next_difficulty": next_difficulty,
                "action_taken": f"{'+' if next_delta > 0 else ''}{next_delta}",
            },
            "updated_profile": updated_scores,
        }
        return Response(response_data, status=status.HTTP_200_OK)


class SessionListView(APIView):
    """GET /api/cognitive/sessions/ — paginated session history."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = CognitiveSession.objects.filter(
            user=request.user,
        ).select_related("task")

        # Optional task filter
        task_slug = request.query_params.get("task")
        if task_slug:
            qs = qs.filter(task__slug=task_slug)

        # Limit
        try:
            limit = int(request.query_params.get("limit", 50))
            limit = max(1, min(limit, 200))
        except (ValueError, TypeError):
            limit = 50

        sessions = qs[:limit]
        serializer = CognitiveSessionListSerializer(sessions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionDetailView(APIView):
    """GET /api/cognitive/sessions/<id>/ — session detail with all trials."""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id: int):
        try:
            session = (
                CognitiveSession.objects
                .select_related("task")
                .prefetch_related("trials")
                .get(id=session_id, user=request.user)
            )
        except CognitiveSession.DoesNotExist:
            return Response(
                {"detail": "Session not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CognitiveSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Profile Views
# ─────────────────────────────────────────────────────────────────────────────

class CognitiveProfileView(APIView):
    """GET /api/cognitive/profile/ — user's aggregated cognitive scores."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = _get_or_create_profile(request.user)
        serializer = UserCognitiveProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileHistoryView(APIView):
    """
    GET /api/cognitive/profile/history/?task=stroop&days=30

    Returns daily-aggregated time-series data for progress charts.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        task_slug = request.query_params.get("task")
        if not task_slug:
            return Response(
                {"detail": "Query parameter 'task' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            days = int(request.query_params.get("days", 30))
            days = max(1, min(days, 365))
        except (ValueError, TypeError):
            days = 30

        since = datetime.now(timezone.utc) - timedelta(days=days)

        sessions = (
            CognitiveSession.objects
            .filter(
                user=request.user,
                task__slug=task_slug,
                ended_at__isnull=False,
                started_at__gte=since,
            )
            .order_by("started_at")
            .values_list(
                "started_at", "accuracy", "avg_reaction_time_ms", "difficulty",
            )
        )

        # Aggregate by date
        daily: dict[date, dict] = defaultdict(
            lambda: {"accuracies": [], "rts": [], "difficulties": [], "count": 0},
        )
        for started, acc, rt, diff in sessions:
            d = started.date()
            entry = daily[d]
            entry["accuracies"].append(acc)
            entry["rts"].append(rt)
            entry["difficulties"].append(diff)
            entry["count"] += 1

        data_points = []
        for d in sorted(daily):
            entry = daily[d]
            data_points.append({
                "date": d,
                "accuracy": round(sum(entry["accuracies"]) / len(entry["accuracies"]), 4),
                "avg_rt_ms": round(sum(entry["rts"]) / len(entry["rts"]), 1),
                "difficulty": round(sum(entry["difficulties"]) / len(entry["difficulties"])),
                "session_count": entry["count"],
            })

        response_data = {
            "task": task_slug,
            "data_points": data_points,
        }
        return Response(response_data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# Leaderboard
# ─────────────────────────────────────────────────────────────────────────────

class LeaderboardView(APIView):
    """
    GET /api/cognitive/profile/leaderboard/?task=stroop

    Returns the top users for a given task, ranked by best accuracy.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        task_slug = request.query_params.get("task")
        if not task_slug:
            return Response(
                {"detail": "Query parameter 'task' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate task exists
        if not CognitiveTask.objects.filter(slug=task_slug).exists():
            return Response(
                {"detail": f"Task '{task_slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            limit = int(request.query_params.get("limit", 20))
            limit = max(1, min(limit, 100))
        except (ValueError, TypeError):
            limit = 20

        # Aggregate per user: best accuracy, total sessions, max difficulty
        leaders = (
            CognitiveSession.objects
            .filter(task__slug=task_slug, ended_at__isnull=False)
            .values("user__username")
            .annotate(
                sessions_completed=Count("id"),
                best_accuracy=Max("accuracy"),
                current_difficulty=Max("difficulty"),
            )
            .filter(sessions_completed__gte=3)  # minimum 3 sessions to qualify
            .order_by("-best_accuracy", "-current_difficulty")[:limit]
        )

        entries = []
        for rank, row in enumerate(leaders, start=1):
            entries.append({
                "rank": rank,
                "username": row["user__username"],
                "sessions_completed": row["sessions_completed"],
                "best_accuracy": round(row["best_accuracy"], 4),
                "current_difficulty": row["current_difficulty"],
            })

        return Response(entries, status=status.HTTP_200_OK)
