"""
Data migration: seed the four CognitiveTask rows with full scientific
metadata (brain regions, cognitive domains, and research references).

Runs automatically on ``python manage.py migrate``.  Idempotent — uses
``update_or_create`` keyed on ``slug``.
"""

from django.db import migrations


TASKS = [
    {
        "slug": "stroop",
        "display_name": "Stroop Task",
        "description": (
            "The Stroop task measures selective attention and cognitive inhibition. "
            "You are presented with colour words (e.g. 'RED') displayed in a font "
            "colour that may or may not match the word itself. Your goal is to "
            "identify the font colour while ignoring the word meaning. This "
            "conflict between automatic reading and colour naming activates the "
            "anterior cingulate cortex and prefrontal regions responsible for "
            "executive control. First described by John Ridley Stroop in 1935, "
            "it remains one of the most widely used paradigms in cognitive "
            "psychology and clinical neuropsychology."
        ),
        "brain_regions": [
            "Dorsolateral prefrontal cortex (DLPFC)",
            "Anterior cingulate cortex (ACC)",
            "Inferior frontal gyrus",
            "Left inferior parietal lobule",
        ],
        "cognitive_domains": [
            "Selective attention",
            "Inhibitory control",
            "Cognitive flexibility",
            "Processing speed",
        ],
        "research_refs": [
            {
                "title": "Studies of interference in serial verbal reactions",
                "authors": "Stroop, J.R.",
                "year": 1935,
                "doi": "10.1037/h0054651",
                "summary": (
                    "The foundational study demonstrating that naming the ink "
                    "colour of incongruent colour words takes significantly "
                    "longer than reading the words themselves, establishing "
                    "the Stroop interference effect."
                ),
            },
            {
                "title": "Half a century of research on the Stroop effect: An integrative review",
                "authors": "MacLeod, C.M.",
                "year": 1991,
                "doi": "10.1037/0033-2909.109.2.163",
                "summary": (
                    "Comprehensive meta-analysis covering 50 years of Stroop "
                    "research, cataloguing 18 major empirical findings and "
                    "evaluating competing theoretical accounts."
                ),
            },
            {
                "title": "Investigations of the functional anatomy of attention using the Stroop test",
                "authors": "Bench, C.J., Frith, C.D., Grasby, P.M., et al.",
                "year": 1993,
                "doi": "10.1016/0028-3932(93)90147-R",
                "summary": (
                    "PET neuroimaging study identifying the anterior cingulate "
                    "cortex and dorsolateral prefrontal cortex as key regions "
                    "activated during Stroop interference resolution."
                ),
            },
        ],
        "icon_name": "palette",
        "min_difficulty": 1,
        "max_difficulty": 10,
    },
    {
        "slug": "nback",
        "display_name": "N-Back",
        "description": (
            "The N-Back task is a continuous performance task used to measure "
            "working memory capacity. You are presented with a sequence of "
            "stimuli and must indicate when the current stimulus matches the "
            "one from N steps earlier. As N increases, the task demands greater "
            "working memory maintenance and updating. The N-Back robustly "
            "activates the dorsolateral prefrontal cortex and posterior parietal "
            "cortex. Training on the N-Back has been shown to produce transfer "
            "effects to fluid intelligence (Jaeggi et al., 2008), though this "
            "finding remains debated."
        ),
        "brain_regions": [
            "Dorsolateral prefrontal cortex (DLPFC)",
            "Ventrolateral prefrontal cortex (VLPFC)",
            "Posterior parietal cortex",
            "Premotor cortex",
            "Basal ganglia (caudate nucleus)",
        ],
        "cognitive_domains": [
            "Working memory (maintenance & updating)",
            "Sustained attention",
            "Executive control",
            "Pattern recognition",
        ],
        "research_refs": [
            {
                "title": "Age differences in short-term retention of rapidly changing information",
                "authors": "Kirchner, W.K.",
                "year": 1958,
                "doi": "10.1037/h0043688",
                "summary": (
                    "The original paper introducing the N-Back paradigm, "
                    "demonstrating age-related differences in the ability to "
                    "maintain and update information in working memory."
                ),
            },
            {
                "title": "Improving fluid intelligence with training on working memory",
                "authors": "Jaeggi, S.M., Buschkuehl, M., Jonides, J., Perrig, W.J.",
                "year": 2008,
                "doi": "10.1073/pnas.0801268105",
                "summary": (
                    "Landmark study showing that dual N-Back training "
                    "transferred to improvements in fluid intelligence, "
                    "proportional to the amount of training."
                ),
            },
            {
                "title": "N-back working memory paradigm: A meta-analysis of normative functional neuroimaging studies",
                "authors": "Owen, A.M., McMillan, K.M., Laird, A.R., Bullmore, E.",
                "year": 2005,
                "doi": "10.1002/hbm.20131",
                "summary": (
                    "Meta-analysis of 24 neuroimaging studies identifying "
                    "consistent activation in lateral premotor cortex, DLPFC, "
                    "VLPFC, frontal pole, and medial posterior parietal cortex "
                    "during N-Back performance."
                ),
            },
        ],
        "icon_name": "grid_view",
        "min_difficulty": 1,
        "max_difficulty": 10,
    },
    {
        "slug": "schulte",
        "display_name": "Schulte Table",
        "description": (
            "The Schulte Table is a grid of randomly arranged numbers that "
            "you must find and click in sequential order as quickly as possible. "
            "It measures visual-spatial attention, processing speed, and the "
            "ability to maintain a mental set while rapidly scanning a visual "
            "field. Widely used in Russian and European neuropsychological "
            "assessment, it engages the posterior parietal cortex (spatial "
            "attention), frontal eye fields (saccadic planning), and sustained "
            "attention networks. Advanced variants use alternating sequences "
            "(numbers and letters) to add a task-switching component."
        ),
        "brain_regions": [
            "Posterior parietal cortex (PPC)",
            "Frontal eye fields (FEF)",
            "Superior colliculus",
            "Dorsal attention network",
            "Supplementary eye fields",
        ],
        "cognitive_domains": [
            "Visual search",
            "Processing speed",
            "Peripheral attention",
            "Sustained attention",
            "Saccadic efficiency",
        ],
        "research_refs": [
            {
                "title": "Der Schulte-Tisch: Testverfahren zur Messung der Aufmerksamkeit",
                "authors": "Schulte, W.",
                "year": 1967,
                "doi": "",
                "summary": (
                    "The original description of the Schulte Table as a "
                    "clinical instrument for measuring attention span "
                    "and visual scanning efficiency."
                ),
            },
            {
                "title": "A feature-integration theory of attention",
                "authors": "Treisman, A.M., Gelade, G.",
                "year": 1980,
                "doi": "10.1016/0010-0285(80)90005-5",
                "summary": (
                    "Foundational theory explaining how attention integrates "
                    "separable features (like colour and shape) into coherent "
                    "objects — directly relevant to visual search tasks "
                    "like the Schulte Table."
                ),
            },
            {
                "title": "Functional neuroanatomy of the saccadic system",
                "authors": "Pierrot-Deseilligny, C., Milea, D., Müri, R.M.",
                "year": 2004,
                "doi": "10.1016/j.neulet.2004.01.035",
                "summary": (
                    "Review of the neural circuitry underlying saccadic eye "
                    "movements, including the frontal eye fields and superior "
                    "colliculus that are heavily engaged during Schulte Table "
                    "performance."
                ),
            },
        ],
        "icon_name": "apps",
        "min_difficulty": 1,
        "max_difficulty": 10,
    },
    {
        "slug": "kakuro",
        "display_name": "Kakuro",
        "description": (
            "Kakuro is a logic-based number puzzle that combines elements of "
            "crosswords and Sudoku. You must fill empty cells with digits 1-9 "
            "so that each horizontal and vertical group sums to the given clue, "
            "with no digit repeated within a group. Solving Kakuro requires "
            "constraint satisfaction reasoning, arithmetic fluency, and "
            "systematic planning. It engages the prefrontal cortex (planning "
            "and strategy), intraparietal sulcus (numerical processing), and "
            "the angular gyrus (arithmetic fact retrieval). Regular practice "
            "strengthens deductive reasoning and mental arithmetic skills."
        ),
        "brain_regions": [
            "Prefrontal cortex (PFC)",
            "Intraparietal sulcus (IPS)",
            "Angular gyrus",
            "Basal ganglia",
            "Anterior insula",
        ],
        "cognitive_domains": [
            "Logical/deductive reasoning",
            "Arithmetic fluency",
            "Constraint satisfaction",
            "Planning and strategy",
            "Working memory",
        ],
        "research_refs": [
            {
                "title": "Mathematical cognition and the problem size effect",
                "authors": "Ashcraft, M.H., Guillaume, M.M.",
                "year": 2009,
                "doi": "10.1016/S0079-7421(09)51004-3",
                "summary": (
                    "Comprehensive review of how the brain processes "
                    "arithmetic operations, including the neural basis of "
                    "the problem-size effect relevant to Kakuro sum "
                    "calculations."
                ),
            },
            {
                "title": "The Number Sense: How the Mind Creates Mathematics",
                "authors": "Dehaene, S.",
                "year": 1997,
                "doi": "",
                "summary": (
                    "Seminal book on the cognitive neuroscience of number "
                    "processing, describing the brain's number systems and "
                    "how they support arithmetic reasoning used in puzzles "
                    "like Kakuro."
                ),
            },
            {
                "title": "Recognizing, defining, and representing problems",
                "authors": "Pretz, J.E., Naples, A.J., Sternberg, R.J.",
                "year": 2003,
                "doi": "10.1017/CBO9780511615771.003",
                "summary": (
                    "Theoretical framework for problem-solving cognition, "
                    "covering how humans recognize constraint structures "
                    "and develop solution strategies — directly applicable "
                    "to Kakuro puzzle solving."
                ),
            },
        ],
        "icon_name": "calculate",
        "min_difficulty": 1,
        "max_difficulty": 10,
    },
]


def seed_tasks(apps, schema_editor):
    """Create or update the four cognitive task rows."""
    CognitiveTask = apps.get_model("cognitive", "CognitiveTask")
    for task_data in TASKS:
        slug = task_data.pop("slug")
        CognitiveTask.objects.update_or_create(
            slug=slug,
            defaults=task_data,
        )
        # Restore slug for idempotency if migration is re-run
        task_data["slug"] = slug


def unseed_tasks(apps, schema_editor):
    """Remove seeded tasks (reversible migration)."""
    CognitiveTask = apps.get_model("cognitive", "CognitiveTask")
    CognitiveTask.objects.filter(
        slug__in=[t["slug"] for t in TASKS],
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("cognitive", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_tasks, unseed_tasks),
    ]
