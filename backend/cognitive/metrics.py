"""
Cognitive Training — Metric Computation & Profile Updates.

Pure functions for:
  - Computing session-level metrics from raw trials
  - Updating UserCognitiveProfile domain scores via EMA
  - Building per-task stat blocks

No side effects — persistence happens in the view layer.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any

import numpy as np

from .rl_engine import MAX_REASONABLE_RT_MS, SessionMetrics


# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

# EMA smoothing factor (0 = ignore new data, 1 = only new data)
EMA_ALPHA = 0.15

# How each task contributes to the four cognitive domain scores.
# Rows: tasks.  Columns: [attention, working_memory, processing_speed, problem_solving]
TASK_DOMAIN_WEIGHTS: dict[str, list[float]] = {
    "stroop":  [0.60, 0.10, 0.20, 0.10],
    "nback":   [0.15, 0.60, 0.15, 0.10],
    "schulte": [0.40, 0.10, 0.40, 0.10],
    "kakuro":  [0.05, 0.20, 0.10, 0.65],
}


# ─────────────────────────────────────────────────────────────────────────────
# Session Metric Computation
# ─────────────────────────────────────────────────────────────────────────────

def compute_session_metrics(trials: list[dict]) -> dict:
    """
    Aggregate raw trial dicts into session-level metrics.

    Parameters
    ----------
    trials : list[dict]
        Each dict must contain at least ``is_correct``, ``reaction_time_ms``,
        and ``error_type``.

    Returns
    -------
    dict with keys:
        total_trials, correct_trials, accuracy, avg_reaction_time_ms,
        error_breakdown
    """
    total = len(trials)
    if total == 0:
        return {
            "total_trials": 0,
            "correct_trials": 0,
            "accuracy": 0.0,
            "avg_reaction_time_ms": 0.0,
            "error_breakdown": {},
        }

    correct = sum(1 for t in trials if t["is_correct"])
    rt_values = [t["reaction_time_ms"] for t in trials]

    # Error breakdown
    error_counts: dict[str, int] = {}
    for t in trials:
        et = t.get("error_type", "")
        if et:
            error_counts[et] = error_counts.get(et, 0) + 1

    return {
        "total_trials": total,
        "correct_trials": correct,
        "accuracy": correct / total,
        "avg_reaction_time_ms": float(np.mean(rt_values)),
        "error_breakdown": error_counts,
    }


def build_session_metrics_for_rl(
    session_accuracy: float,
    session_avg_rt_ms: float,
    error_breakdown: dict[str, int],
    total_trials: int,
    current_difficulty: int,
    total_sessions_for_task: int,
    recent_accuracies: list[float],
    hours_since_last: float,
    difficulty_min: int = 1,
    difficulty_max: int = 10,
) -> SessionMetrics:
    """
    Build the ``SessionMetrics`` dataclass consumed by ``rl_engine.build_state_vector``.
    """
    total_errors = sum(error_breakdown.values()) if error_breakdown else 0
    interference = error_breakdown.get("interference", 0)
    omission = error_breakdown.get("omission", 0)

    return SessionMetrics(
        accuracy=session_accuracy,
        avg_reaction_time_ms=session_avg_rt_ms,
        interference_error_rate=(interference / total_errors) if total_errors > 0 else 0.0,
        omission_error_rate=(omission / total_trials) if total_trials > 0 else 0.0,
        current_difficulty=current_difficulty,
        total_sessions_for_task=total_sessions_for_task,
        recent_accuracies=recent_accuracies,
        hours_since_last_session=hours_since_last,
        difficulty_min=difficulty_min,
        difficulty_max=difficulty_max,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Profile Update
# ─────────────────────────────────────────────────────────────────────────────

def _scale_performance(accuracy: float, avg_rt_ms: float) -> float:
    """
    Map session performance into a 0-100 score for the EMA update.

    Combines accuracy (70%) and speed (30%).  A "perfect" score of 100
    requires both high accuracy and fast responses.
    """
    speed_score = max(0.0, 1.0 - (avg_rt_ms / MAX_REASONABLE_RT_MS))
    raw = 0.90 * accuracy + 0.10 * speed_score
    return float(np.clip(raw * 100.0, 0.0, 100.0))


def compute_profile_updates(
    task_slug: str,
    session_accuracy: float,
    session_avg_rt_ms: float,
    current_scores: dict[str, float],
) -> dict[str, float]:
    """
    Compute new domain scores after a completed session via EMA.

    Parameters
    ----------
    task_slug : str
    session_accuracy : float  (0..1)
    session_avg_rt_ms : float
    current_scores : dict
        Must have keys: ``attention_score``, ``working_memory_score``,
        ``processing_speed_score``, ``problem_solving_score``.

    Returns
    -------
    dict with the same four keys, updated via weighted EMA.
    """
    weights = TASK_DOMAIN_WEIGHTS.get(task_slug)
    if weights is None:
        return dict(current_scores)

    performance = _scale_performance(session_accuracy, session_avg_rt_ms)

    domain_keys = [
        "attention_score",
        "working_memory_score",
        "processing_speed_score",
        "problem_solving_score",
    ]

    updated: dict[str, float] = {}
    for key, w in zip(domain_keys, weights):
        old_val = current_scores.get(key, 50.0)
        # Weighted EMA: only apply alpha proportional to this task's contribution
        effective_alpha = EMA_ALPHA * w
        new_val = effective_alpha * performance + (1.0 - effective_alpha) * old_val
        updated[key] = round(float(np.clip(new_val, 0.0, 100.0)), 2)

    return updated


def build_task_stats_entry(
    existing_entry: dict | None,
    session_accuracy: float,
    session_avg_rt_ms: float,
    new_difficulty: int,
    ended_at: datetime | None = None,
) -> dict:
    """
    Create or update a single task_stats entry within UserCognitiveProfile.task_stats.

    Parameters
    ----------
    existing_entry : dict or None
        The previous stats for this task, or None if first session.
    session_accuracy : float
    session_avg_rt_ms : float
    new_difficulty : int  — difficulty for the *next* session
    ended_at : datetime or None — when this session finished

    Returns
    -------
    dict  — updated task stats entry
    """
    if existing_entry is None:
        existing_entry = {
            "sessions_completed": 0,
            "current_difficulty": new_difficulty,
            "best_accuracy": 0.0,
            "avg_reaction_time_ms": 0.0,
            "last_played": None,
        }

    n = existing_entry["sessions_completed"]
    old_avg_rt = existing_entry.get("avg_reaction_time_ms", 0.0)

    new_n = n + 1
    # Running average for RT
    new_avg_rt = (old_avg_rt * n + session_avg_rt_ms) / new_n

    return {
        "sessions_completed": new_n,
        "current_difficulty": new_difficulty,
        "best_accuracy": max(existing_entry.get("best_accuracy", 0.0), session_accuracy),
        "avg_reaction_time_ms": round(new_avg_rt, 1),
        "last_played": (
            ended_at.isoformat() if ended_at else
            datetime.now(timezone.utc).isoformat()
        ),
    }


def compute_hours_since(
    last_ended_at: datetime | None,
    now: datetime | None = None,
) -> float:
    """Hours elapsed since the last session ended.  Returns 0 for first session."""
    if last_ended_at is None:
        return 0.0
    if now is None:
        now = datetime.now(timezone.utc)
    # Ensure both are timezone-aware
    if last_ended_at.tzinfo is None:
        last_ended_at = last_ended_at.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    delta = (now - last_ended_at).total_seconds() / 3600.0
    return max(delta, 0.0)
