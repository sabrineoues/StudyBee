"""
Cognitive Training — Difficulty-to-Parameter Mapping.

Pure function: ``get_task_params(slug, difficulty) → dict``

Each task defines a 10-level difficulty ladder.  The returned dict is stored
in ``CognitiveSession.task_params`` and sent to the frontend so it can
configure the game engine.
"""

from __future__ import annotations


def _lerp(a: float, b: float, t: float) -> float:
    """Linear interpolation: a at t=0, b at t=1."""
    return a + (b - a) * t


def _level_t(difficulty: int) -> float:
    """Normalise difficulty 1..10 to 0.0..1.0."""
    return (difficulty - 1) / 9.0


# ─────────────────────────────────────────────────────────────────────────────
# Stroop Task
# ─────────────────────────────────────────────────────────────────────────────

_STROOP_TABLE: dict[int, dict] = {
    1:  {"congruent_ratio": 0.80, "trial_count": 10, "time_limit_ms": 5000,
         "variations": ["color"],                "distractors": "none"},
    2:  {"congruent_ratio": 0.70, "trial_count": 12, "time_limit_ms": 4500,
         "variations": ["color"],                "distractors": "none"},
    3:  {"congruent_ratio": 0.60, "trial_count": 15, "time_limit_ms": 4000,
         "variations": ["color"],                "distractors": "none"},
    4:  {"congruent_ratio": 0.55, "trial_count": 18, "time_limit_ms": 3500,
         "variations": ["color", "size"],        "distractors": "none"},
    5:  {"congruent_ratio": 0.50, "trial_count": 20, "time_limit_ms": 3000,
         "variations": ["color", "size"],        "distractors": "none"},
    6:  {"congruent_ratio": 0.45, "trial_count": 22, "time_limit_ms": 2800,
         "variations": ["color", "size"],        "distractors": "border"},
    7:  {"congruent_ratio": 0.40, "trial_count": 25, "time_limit_ms": 2500,
         "variations": ["color", "size", "direction"], "distractors": "border"},
    8:  {"congruent_ratio": 0.35, "trial_count": 27, "time_limit_ms": 2200,
         "variations": ["color", "size", "direction"], "distractors": "border"},
    9:  {"congruent_ratio": 0.25, "trial_count": 28, "time_limit_ms": 2000,
         "variations": ["color", "size", "direction"], "distractors": "animated_border"},
    10: {"congruent_ratio": 0.20, "trial_count": 30, "time_limit_ms": 1500,
         "variations": ["color", "size", "direction"], "distractors": "animated_border"},
}


def _stroop_params(difficulty: int) -> dict:
    return dict(_STROOP_TABLE[difficulty])


# ─────────────────────────────────────────────────────────────────────────────
# N-Back
# ─────────────────────────────────────────────────────────────────────────────

_NBACK_TABLE: dict[int, dict] = {
    1:  {"n_level": 1, "sequence_length": 15, "stimulus_type": "letter",
         "target_ratio": 0.30, "isi_ms": 3000},
    2:  {"n_level": 1, "sequence_length": 18, "stimulus_type": "letter",
         "target_ratio": 0.30, "isi_ms": 2500},
    3:  {"n_level": 1, "sequence_length": 20, "stimulus_type": "letter_position",
         "target_ratio": 0.30, "isi_ms": 2500},
    4:  {"n_level": 2, "sequence_length": 20, "stimulus_type": "letter",
         "target_ratio": 0.30, "isi_ms": 3000},
    5:  {"n_level": 2, "sequence_length": 25, "stimulus_type": "letter_position",
         "target_ratio": 0.30, "isi_ms": 2500},
    6:  {"n_level": 2, "sequence_length": 25, "stimulus_type": "dual",
         "target_ratio": 0.33, "isi_ms": 2500},
    7:  {"n_level": 3, "sequence_length": 25, "stimulus_type": "letter",
         "target_ratio": 0.30, "isi_ms": 3000},
    8:  {"n_level": 3, "sequence_length": 30, "stimulus_type": "letter_position",
         "target_ratio": 0.33, "isi_ms": 2500},
    9:  {"n_level": 3, "sequence_length": 35, "stimulus_type": "dual",
         "target_ratio": 0.35, "isi_ms": 2000},
    10: {"n_level": 4, "sequence_length": 40, "stimulus_type": "dual_audio",
         "target_ratio": 0.35, "isi_ms": 2000},
}


def _nback_params(difficulty: int) -> dict:
    return dict(_NBACK_TABLE[difficulty])


# ─────────────────────────────────────────────────────────────────────────────
# Schulte Table
# ─────────────────────────────────────────────────────────────────────────────

_SCHULTE_TABLE: dict[int, dict] = {
    1:  {"grid_size": 3, "mode": "sequential", "time_limit_s": 90,
         "highlight_previous": True},
    2:  {"grid_size": 3, "mode": "sequential", "time_limit_s": 60,
         "highlight_previous": True},
    3:  {"grid_size": 4, "mode": "sequential", "time_limit_s": 90,
         "highlight_previous": False},
    4:  {"grid_size": 4, "mode": "sequential", "time_limit_s": 60,
         "highlight_previous": False},
    5:  {"grid_size": 5, "mode": "sequential", "time_limit_s": 60,
         "highlight_previous": False},
    6:  {"grid_size": 5, "mode": "sequential", "time_limit_s": 45,
         "highlight_previous": False},
    7:  {"grid_size": 5, "mode": "alternating", "time_limit_s": 60,
         "highlight_previous": False},
    8:  {"grid_size": 6, "mode": "sequential", "time_limit_s": 45,
         "highlight_previous": False},
    9:  {"grid_size": 6, "mode": "alternating", "time_limit_s": 40,
         "highlight_previous": False},
    10: {"grid_size": 7, "mode": "alternating", "time_limit_s": 30,
         "highlight_previous": False},
}


def _schulte_params(difficulty: int) -> dict:
    return dict(_SCHULTE_TABLE[difficulty])


# ─────────────────────────────────────────────────────────────────────────────
# Kakuro
# ─────────────────────────────────────────────────────────────────────────────

_KAKURO_TABLE: dict[int, dict] = {
    1:  {"grid_size": 4, "max_clue_sum": 10, "empty_cells_range": [4, 5],
         "hints_available": 3, "max_cells_per_clue": 2},
    2:  {"grid_size": 4, "max_clue_sum": 15, "empty_cells_range": [5, 6],
         "hints_available": 2, "max_cells_per_clue": 2},
    3:  {"grid_size": 5, "max_clue_sum": 17, "empty_cells_range": [7, 8],
         "hints_available": 2, "max_cells_per_clue": 3},
    4:  {"grid_size": 5, "max_clue_sum": 20, "empty_cells_range": [8, 10],
         "hints_available": 1, "max_cells_per_clue": 3},
    5:  {"grid_size": 6, "max_clue_sum": 24, "empty_cells_range": [10, 12],
         "hints_available": 1, "max_cells_per_clue": 4},
    6:  {"grid_size": 6, "max_clue_sum": 28, "empty_cells_range": [12, 14],
         "hints_available": 1, "max_cells_per_clue": 4},
    7:  {"grid_size": 7, "max_clue_sum": 30, "empty_cells_range": [14, 16],
         "hints_available": 0, "max_cells_per_clue": 5},
    8:  {"grid_size": 7, "max_clue_sum": 35, "empty_cells_range": [16, 18],
         "hints_available": 0, "max_cells_per_clue": 5},
    9:  {"grid_size": 8, "max_clue_sum": 40, "empty_cells_range": [20, 22],
         "hints_available": 0, "max_cells_per_clue": 6},
    10: {"grid_size": 9, "max_clue_sum": 45, "empty_cells_range": [24, 28],
         "hints_available": 0, "max_cells_per_clue": 7},
}


def _kakuro_params(difficulty: int) -> dict:
    return dict(_KAKURO_TABLE[difficulty])


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

_TASK_PARAM_FUNCTIONS: dict[str, callable] = {
    "stroop":  _stroop_params,
    "nback":   _nback_params,
    "schulte": _schulte_params,
    "kakuro":  _kakuro_params,
}


def get_task_params(task_slug: str, difficulty: int) -> dict:
    """
    Map a task slug and integer difficulty to concrete game parameters.

    Parameters
    ----------
    task_slug : str
        One of ``"stroop"``, ``"nback"``, ``"schulte"``, ``"kakuro"``.
    difficulty : int
        Integer in ``[1, 10]``.

    Returns
    -------
    dict
        Game configuration sent to the frontend.

    Raises
    ------
    ValueError
        If *task_slug* is unknown or *difficulty* is out of range.
    """
    fn = _TASK_PARAM_FUNCTIONS.get(task_slug)
    if fn is None:
        raise ValueError(
            f"Unknown task slug {task_slug!r}. "
            f"Valid slugs: {sorted(_TASK_PARAM_FUNCTIONS)}"
        )
    if not (1 <= difficulty <= 10):
        raise ValueError(
            f"Difficulty must be 1..10, got {difficulty}."
        )
    return fn(difficulty)
