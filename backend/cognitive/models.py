"""
Cognitive Training — Django models.

Five tables:
  CognitiveTask       – static catalogue of the four task types
  CognitiveSession    – one training run (user × task × difficulty)
  CognitiveTrial      – individual stimulus→response events
  UserCognitiveProfile – aggregated per-user cognitive scores
  RLAgentState        – serialised PPO policy/value weights per user×task
"""

from django.conf import settings
from django.db import models


# ---------------------------------------------------------------------------
# 1. CognitiveTask – reference / catalogue
# ---------------------------------------------------------------------------

class CognitiveTask(models.Model):
    """Static reference row for each of the four cognitive tasks."""

    TASK_CHOICES = [
        ("stroop", "Stroop Task"),
        ("nback", "N-Back"),
        ("schulte", "Schulte Table"),
        ("kakuro", "Kakuro"),
    ]

    slug = models.CharField(
        max_length=20,
        unique=True,
        choices=TASK_CHOICES,
        db_index=True,
        help_text="Machine-readable task identifier.",
    )
    display_name = models.CharField(max_length=64)
    description = models.TextField(
        help_text="Multi-sentence explanation shown in the science panel.",
    )

    # Scientific metadata (structured JSON)
    brain_regions = models.JSONField(
        default=list,
        help_text='e.g. ["dorsolateral prefrontal cortex", "anterior cingulate cortex"]',
    )
    cognitive_domains = models.JSONField(
        default=list,
        help_text='e.g. ["selective attention", "inhibitory control"]',
    )
    research_refs = models.JSONField(
        default=list,
        help_text="List of {title, authors, year, doi, summary} dicts.",
    )

    icon_name = models.CharField(
        max_length=32,
        default="psychology",
        help_text="Material Symbols icon name for the UI.",
    )

    # Difficulty bounds consumed by the RL agent
    min_difficulty = models.IntegerField(default=1)
    max_difficulty = models.IntegerField(default=10)

    class Meta:
        ordering = ["slug"]
        verbose_name = "cognitive task"
        verbose_name_plural = "cognitive tasks"

    def __str__(self) -> str:
        return self.display_name


# ---------------------------------------------------------------------------
# 2. CognitiveSession – one training run
# ---------------------------------------------------------------------------

class CognitiveSession(models.Model):
    """A single training session: one user playing one task at one difficulty."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cognitive_sessions",
    )
    task = models.ForeignKey(
        CognitiveTask,
        on_delete=models.CASCADE,
        related_name="sessions",
    )

    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    # Difficulty set by the RL agent at session start
    difficulty = models.IntegerField(
        help_text="Integer difficulty level [1..10] chosen by the RL agent.",
    )
    task_params = models.JSONField(
        default=dict,
        help_text="Concrete game parameters derived from the difficulty level.",
    )

    # Aggregated metrics (computed at session completion)
    total_trials = models.IntegerField(default=0)
    correct_trials = models.IntegerField(default=0)
    accuracy = models.FloatField(default=0.0)
    avg_reaction_time_ms = models.FloatField(default=0.0)
    error_breakdown = models.JSONField(
        default=dict,
        help_text='e.g. {"interference": 3, "omission": 1, "commission": 0}',
    )

    # RL audit trail
    reward = models.FloatField(null=True, blank=True)
    rl_action = models.IntegerField(
        null=True,
        blank=True,
        help_text="Difficulty delta chosen by the agent (-2..+2).",
    )

    class Meta:
        ordering = ["-started_at"]
        indexes = [
            models.Index(
                fields=["user", "task", "-started_at"],
                name="idx_session_user_task_date",
            ),
        ]
        verbose_name = "cognitive session"
        verbose_name_plural = "cognitive sessions"

    def __str__(self) -> str:
        return (
            f"{self.user} – {self.task.slug} d{self.difficulty} "
            f"({self.accuracy:.0%})"
        )

    @property
    def duration_seconds(self) -> float | None:
        """Wall-clock duration; None if session is still open."""
        if self.ended_at is None:
            return None
        return (self.ended_at - self.started_at).total_seconds()


# ---------------------------------------------------------------------------
# 3. CognitiveTrial – individual stimulus→response events
# ---------------------------------------------------------------------------

class CognitiveTrial(models.Model):
    """One stimulus-response event within a session."""

    session = models.ForeignKey(
        CognitiveSession,
        on_delete=models.CASCADE,
        related_name="trials",
    )
    trial_index = models.IntegerField(
        help_text="0-based order within the session.",
    )

    # What was shown and what the user did (task-specific schemas)
    stimulus = models.JSONField(
        help_text="Task-specific stimulus description.",
    )
    response = models.JSONField(
        help_text="Task-specific user response.",
    )

    is_correct = models.BooleanField()
    reaction_time_ms = models.IntegerField(
        help_text="Milliseconds from stimulus onset to user response.",
    )
    error_type = models.CharField(
        max_length=32,
        blank=True,
        default="",
        help_text='One of: "interference", "omission", "commission", or "" if correct.',
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["session", "trial_index"]
        verbose_name = "cognitive trial"
        verbose_name_plural = "cognitive trials"

    def __str__(self) -> str:
        mark = "✓" if self.is_correct else "✗"
        return f"Trial {self.trial_index} {mark} ({self.reaction_time_ms}ms)"


# ---------------------------------------------------------------------------
# 4. UserCognitiveProfile – aggregated scores & per-task stats
# ---------------------------------------------------------------------------

class UserCognitiveProfile(models.Model):
    """
    Persisted cognitive profile for a user.

    Scores are on a 0-100 scale, updated via exponential moving average
    after each completed session.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cognitive_profile",
    )

    # Domain scores (0-100)
    attention_score = models.FloatField(default=50.0)
    working_memory_score = models.FloatField(default=50.0)
    processing_speed_score = models.FloatField(default=50.0)
    problem_solving_score = models.FloatField(default=50.0)

    # Per-task aggregate stats (JSON for flexibility)
    task_stats = models.JSONField(
        default=dict,
        help_text=(
            'Per-task aggregates: {"stroop": {"sessions_completed": 12, '
            '"current_difficulty": 5, "best_accuracy": 0.95, ...}, ...}'
        ),
    )

    total_training_minutes = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "user cognitive profile"
        verbose_name_plural = "user cognitive profiles"

    def __str__(self) -> str:
        return f"CognitiveProfile({self.user})"


# ---------------------------------------------------------------------------
# 5. RLAgentState – serialised PPO weights
# ---------------------------------------------------------------------------

class RLAgentState(models.Model):
    """
    Persisted PPO agent weights for one user×task pair.

    policy_weights and value_weights store PyTorch state_dict bytes.
    Total serialised size ≈ 10 KB.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rl_states",
    )
    task = models.ForeignKey(
        CognitiveTask,
        on_delete=models.CASCADE,
        related_name="rl_states",
    )

    policy_weights = models.BinaryField(
        help_text="Serialised PolicyNet state_dict.",
    )
    value_weights = models.BinaryField(
        help_text="Serialised ValueNet state_dict.",
    )
    optimizer_state = models.BinaryField(
        null=True,
        blank=True,
        help_text="Optional serialised Adam optimiser state.",
    )

    total_episodes = models.IntegerField(default=0)
    last_reward = models.FloatField(null=True, blank=True)
    last_loss = models.FloatField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "task")
        verbose_name = "RL agent state"
        verbose_name_plural = "RL agent states"

    def __str__(self) -> str:
        return f"RLAgent({self.user}, {self.task.slug}, ep={self.total_episodes})"
