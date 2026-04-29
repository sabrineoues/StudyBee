/* ── Game Info Page ─────────────────────────────────────────────────────── */
/* Displays scientific background for each cognitive training game:
   description, cognitive abilities, brain regions (with illustration),
   and supporting research papers. Driven by the :slug route param. */

import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { StudyBeeShell } from "../components/StudyBeeShell";

/* ── Static game data (mirrors backend seed) ───────────────────────────── */

interface ResearchRef {
  title: string;
  authors: string;
  year: number;
  doi: string;
  summary: string;
}

interface GameData {
  displayName: string;
  tagline: string;
  icon: string;
  color: string;
  brainImage: string;
  description: string;
  brainRegions: string[];
  cognitiveDomains: string[];
  researchRefs: ResearchRef[];
}

const GAMES: Record<string, GameData> = {
  stroop: {
    displayName: "Stroop Task",
    tagline: "Master selective attention & cognitive inhibition",
    icon: "palette",
    color: "#8b5cf6",
    brainImage: "/images/brain/stroop_brain.png",
    description:
      "The Stroop task measures selective attention and cognitive inhibition. " +
      "You are presented with colour words (e.g. 'RED') displayed in a font " +
      "colour that may or may not match the word itself. Your goal is to " +
      "identify the font colour while ignoring the word meaning. This " +
      "conflict between automatic reading and colour naming activates the " +
      "anterior cingulate cortex and prefrontal regions responsible for " +
      "executive control. First described by John Ridley Stroop in 1935, " +
      "it remains one of the most widely used paradigms in cognitive " +
      "psychology and clinical neuropsychology.",
    brainRegions: [
      "Dorsolateral prefrontal cortex (DLPFC)",
      "Anterior cingulate cortex (ACC)",
      "Inferior frontal gyrus",
      "Left inferior parietal lobule",
    ],
    cognitiveDomains: [
      "Selective attention",
      "Inhibitory control",
      "Cognitive flexibility",
      "Processing speed",
    ],
    researchRefs: [
      {
        title: "Studies of interference in serial verbal reactions",
        authors: "Stroop, J.R.",
        year: 1935,
        doi: "10.1037/h0054651",
        summary:
          "The foundational study demonstrating that naming the ink " +
          "colour of incongruent colour words takes significantly " +
          "longer than reading the words themselves, establishing " +
          "the Stroop interference effect.",
      },
      {
        title:
          "Half a century of research on the Stroop effect: An integrative review",
        authors: "MacLeod, C.M.",
        year: 1991,
        doi: "10.1037/0033-2909.109.2.163",
        summary:
          "Comprehensive meta-analysis covering 50 years of Stroop " +
          "research, cataloguing 18 major empirical findings and " +
          "evaluating competing theoretical accounts.",
      },
      {
        title:
          "Investigations of the functional anatomy of attention using the Stroop test",
        authors: "Bench, C.J., Frith, C.D., Grasby, P.M., et al.",
        year: 1993,
        doi: "10.1016/0028-3932(93)90147-R",
        summary:
          "PET neuroimaging study identifying the anterior cingulate " +
          "cortex and dorsolateral prefrontal cortex as key regions " +
          "activated during Stroop interference resolution.",
      },
    ],
  },

  nback: {
    displayName: "N-Back",
    tagline: "Strengthen working memory & executive control",
    icon: "grid_view",
    color: "#3b82f6",
    brainImage: "/images/brain/nback_brain.png",
    description:
      "The N-Back task is a continuous performance task used to measure " +
      "working memory capacity. You are presented with a sequence of " +
      "stimuli and must indicate when the current stimulus matches the " +
      "one from N steps earlier. As N increases, the task demands greater " +
      "working memory maintenance and updating. The N-Back robustly " +
      "activates the dorsolateral prefrontal cortex and posterior parietal " +
      "cortex. Training on the N-Back has been shown to produce transfer " +
      "effects to fluid intelligence (Jaeggi et al., 2008), though this " +
      "finding remains debated.",
    brainRegions: [
      "Dorsolateral prefrontal cortex (DLPFC)",
      "Ventrolateral prefrontal cortex (VLPFC)",
      "Posterior parietal cortex",
      "Premotor cortex",
      "Basal ganglia (caudate nucleus)",
    ],
    cognitiveDomains: [
      "Working memory (maintenance & updating)",
      "Sustained attention",
      "Executive control",
      "Pattern recognition",
    ],
    researchRefs: [
      {
        title:
          "Age differences in short-term retention of rapidly changing information",
        authors: "Kirchner, W.K.",
        year: 1958,
        doi: "10.1037/h0043688",
        summary:
          "The original paper introducing the N-Back paradigm, " +
          "demonstrating age-related differences in the ability to " +
          "maintain and update information in working memory.",
      },
      {
        title:
          "Improving fluid intelligence with training on working memory",
        authors:
          "Jaeggi, S.M., Buschkuehl, M., Jonides, J., Perrig, W.J.",
        year: 2008,
        doi: "10.1073/pnas.0801268105",
        summary:
          "Landmark study showing that dual N-Back training " +
          "transferred to improvements in fluid intelligence, " +
          "proportional to the amount of training.",
      },
      {
        title:
          "N-back working memory paradigm: A meta-analysis of normative functional neuroimaging studies",
        authors:
          "Owen, A.M., McMillan, K.M., Laird, A.R., Bullmore, E.",
        year: 2005,
        doi: "10.1002/hbm.20131",
        summary:
          "Meta-analysis of 24 neuroimaging studies identifying " +
          "consistent activation in lateral premotor cortex, DLPFC, " +
          "VLPFC, frontal pole, and medial posterior parietal cortex " +
          "during N-Back performance.",
      },
    ],
  },

  schulte: {
    displayName: "Schulte Table",
    tagline: "Boost visual search & processing speed",
    icon: "apps",
    color: "#22c55e",
    brainImage: "/images/brain/schulte_brain.png",
    description:
      "The Schulte Table is a grid of randomly arranged numbers that " +
      "you must find and click in sequential order as quickly as possible. " +
      "It measures visual-spatial attention, processing speed, and the " +
      "ability to maintain a mental set while rapidly scanning a visual " +
      "field. Widely used in Russian and European neuropsychological " +
      "assessment, it engages the posterior parietal cortex (spatial " +
      "attention), frontal eye fields (saccadic planning), and sustained " +
      "attention networks. Advanced variants use alternating sequences " +
      "(numbers and letters) to add a task-switching component.",
    brainRegions: [
      "Posterior parietal cortex (PPC)",
      "Frontal eye fields (FEF)",
      "Superior colliculus",
      "Dorsal attention network",
      "Supplementary eye fields",
    ],
    cognitiveDomains: [
      "Visual search",
      "Processing speed",
      "Peripheral attention",
      "Sustained attention",
      "Saccadic efficiency",
    ],
    researchRefs: [
      {
        title:
          "Der Schulte-Tisch: Testverfahren zur Messung der Aufmerksamkeit",
        authors: "Schulte, W.",
        year: 1967,
        doi: "",
        summary:
          "The original description of the Schulte Table as a " +
          "clinical instrument for measuring attention span " +
          "and visual scanning efficiency.",
      },
      {
        title: "A feature-integration theory of attention",
        authors: "Treisman, A.M., Gelade, G.",
        year: 1980,
        doi: "10.1016/0010-0285(80)90005-5",
        summary:
          "Foundational theory explaining how attention integrates " +
          "separable features (like colour and shape) into coherent " +
          "objects — directly relevant to visual search tasks " +
          "like the Schulte Table.",
      },
      {
        title: "Functional neuroanatomy of the saccadic system",
        authors: "Pierrot-Deseilligny, C., Milea, D., Müri, R.M.",
        year: 2004,
        doi: "10.1016/j.neulet.2004.01.035",
        summary:
          "Review of the neural circuitry underlying saccadic eye " +
          "movements, including the frontal eye fields and superior " +
          "colliculus that are heavily engaged during Schulte Table " +
          "performance.",
      },
    ],
  },

  kakuro: {
    displayName: "Kakuro",
    tagline: "Sharpen logical reasoning & arithmetic fluency",
    icon: "calculate",
    color: "#f59e0b",
    brainImage: "/images/brain/kakuro_brain.png",
    description:
      "Kakuro is a logic-based number puzzle that combines elements of " +
      "crosswords and Sudoku. You must fill empty cells with digits 1-9 " +
      "so that each horizontal and vertical group sums to the given clue, " +
      "with no digit repeated within a group. Solving Kakuro requires " +
      "constraint satisfaction reasoning, arithmetic fluency, and " +
      "systematic planning. It engages the prefrontal cortex (planning " +
      "and strategy), intraparietal sulcus (numerical processing), and " +
      "the angular gyrus (arithmetic fact retrieval). Regular practice " +
      "strengthens deductive reasoning and mental arithmetic skills.",
    brainRegions: [
      "Prefrontal cortex (PFC)",
      "Intraparietal sulcus (IPS)",
      "Angular gyrus",
      "Basal ganglia",
      "Anterior insula",
    ],
    cognitiveDomains: [
      "Logical/deductive reasoning",
      "Arithmetic fluency",
      "Constraint satisfaction",
      "Planning and strategy",
      "Working memory",
    ],
    researchRefs: [
      {
        title: "Mathematical cognition and the problem size effect",
        authors: "Ashcraft, M.H., Guillaume, M.M.",
        year: 2009,
        doi: "10.1016/S0079-7421(09)51004-3",
        summary:
          "Comprehensive review of how the brain processes " +
          "arithmetic operations, including the neural basis of " +
          "the problem-size effect relevant to Kakuro sum " +
          "calculations.",
      },
      {
        title:
          "The Number Sense: How the Mind Creates Mathematics",
        authors: "Dehaene, S.",
        year: 1997,
        doi: "",
        summary:
          "Seminal book on the cognitive neuroscience of number " +
          "processing, describing the brain's number systems and " +
          "how they support arithmetic reasoning used in puzzles " +
          "like Kakuro.",
      },
      {
        title:
          "Recognizing, defining, and representing problems",
        authors: "Pretz, J.E., Naples, A.J., Sternberg, R.J.",
        year: 2003,
        doi: "10.1017/CBO9780511615771.003",
        summary:
          "Theoretical framework for problem-solving cognition, " +
          "covering how humans recognize constraint structures " +
          "and develop solution strategies — directly applicable " +
          "to Kakuro puzzle solving.",
      },
    ],
  },
};

/* ── Animation presets ──────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const chipVariant = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
};

/* ── Component ─────────────────────────────────────────────────────────── */

export function GameInfoPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const game = slug ? GAMES[slug] : undefined;

  if (!game) {
    return (
      <StudyBeeShell>
        <main className="mx-auto max-w-3xl px-6 pb-24 pt-28 md:px-12">
          <div className="rounded-2xl bg-surface-container-low p-12 text-center shadow-lg">
            <span className="material-symbols-outlined mb-4 block text-5xl text-error">
              error
            </span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Game not found
            </h1>
            <p className="mt-2 text-on-surface-variant">
              The game "{slug}" does not exist.
            </p>
            <button
              onClick={() => navigate("/cognitive")}
              className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              Back to Training
            </button>
          </div>
        </main>
      </StudyBeeShell>
    );
  }

  return (
    <StudyBeeShell>
      {/* Background gradients */}
      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div
          className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full blur-[140px]"
          style={{ backgroundColor: game.color, opacity: 0.07 }}
        />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-tertiary-container/10 blur-[120px]" />
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-28 md:px-12 md:pb-12">
        {/* ── Back button ──────────────────────────────────────────────── */}
        <motion.button
          onClick={() => navigate("/cognitive")}
          className="mb-8 flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant shadow-sm ring-1 ring-outline-variant/10 transition-all hover:scale-105 hover:bg-surface-container hover:text-on-surface active:scale-95"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Back to Training
        </motion.button>

        {/* ── Hero Header ──────────────────────────────────────────────── */}
        <motion.header className="mb-10" {...fadeUp}>
          <div className="flex items-center gap-4 mb-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
              style={{ backgroundColor: game.color + "22" }}
            >
              <span
                className="material-symbols-outlined text-3xl"
                style={{ color: game.color }}
              >
                {game.icon}
              </span>
            </div>
            <div>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                {game.displayName}
              </h1>
              <p className="mt-0.5 text-on-surface-variant font-body text-base">
                {game.tagline}
              </p>
            </div>
          </div>
        </motion.header>

        {/* ── Description ──────────────────────────────────────────────── */}
        <motion.section
          className="mb-10"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
        >
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-sm md:p-8">
            <h2 className="mb-3 flex items-center gap-2 font-headline text-lg font-bold text-on-surface">
              <span className="material-symbols-outlined text-xl text-primary">
                menu_book
              </span>
              About This Task
            </h2>
            <p className="font-body leading-relaxed text-on-surface-variant text-[15px]">
              {game.description}
            </p>
          </div>
        </motion.section>

        {/* ── Cognitive Abilities ───────────────────────────────────────── */}
        <motion.section
          className="mb-10"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.16 }}
        >
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-sm md:p-8">
            <h2 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold text-on-surface">
              <span className="material-symbols-outlined text-xl text-primary">
                psychology
              </span>
              Cognitive Abilities Trained
            </h2>
            <motion.div
              className="flex flex-wrap gap-3"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {game.cognitiveDomains.map((domain) => (
                <motion.div
                  key={domain}
                  variants={chipVariant}
                  className="group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:scale-105"
                  style={{
                    backgroundColor: game.color + "14",
                    color: game.color,
                    boxShadow: `0 0 0 1px ${game.color}20`,
                  }}
                >
                  <span className="material-symbols-outlined text-base">
                    check_circle
                  </span>
                  {domain}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* ── Brain Regions ─────────────────────────────────────────────── */}
        <motion.section
          className="mb-10"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.24 }}
        >
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-sm md:p-8">
            <h2 className="mb-5 flex items-center gap-2 font-headline text-lg font-bold text-on-surface">
              <span className="material-symbols-outlined text-xl text-primary">
                neurology
              </span>
              Brain Regions Involved
            </h2>

            <div className="grid gap-6 md:grid-cols-2 items-start">
              {/* Brain illustration */}
              <motion.div
                className="relative overflow-hidden rounded-xl bg-[#0f172a] p-4 shadow-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <img
                  src={game.brainImage}
                  alt={`Brain regions activated during ${game.displayName}`}
                  className="w-full rounded-lg"
                />
                {/* Subtle animated glow border */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-30"
                  style={{
                    boxShadow: `inset 0 0 40px ${game.color}40`,
                  }}
                />
              </motion.div>

              {/* Region list */}
              <div className="space-y-3">
                {game.brainRegions.map((region, i) => (
                  <motion.div
                    key={region}
                    className="flex items-start gap-3 rounded-xl bg-surface p-4 shadow-sm transition-all hover:bg-surface-container"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                  >
                    <div
                      className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: game.color }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-on-surface leading-snug">
                      {region}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Research Papers ───────────────────────────────────────────── */}
        <motion.section
          className="mb-10"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.32 }}
        >
          <div className="rounded-2xl bg-surface-container-low p-6 shadow-sm md:p-8">
            <h2 className="mb-5 flex items-center gap-2 font-headline text-lg font-bold text-on-surface">
              <span className="material-symbols-outlined text-xl text-primary">
                science
              </span>
              Supporting Research
            </h2>

            <div className="space-y-4">
              {game.researchRefs.map((ref, i) => (
                <motion.article
                  key={ref.title}
                  className="group rounded-xl bg-surface p-5 shadow-sm ring-1 ring-outline-variant/10 transition-all hover:ring-primary/20 hover:shadow-md"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.1 }}
                >
                  {/* Paper title */}
                  <h3 className="font-headline text-sm font-bold text-on-surface leading-snug mb-2">
                    {ref.title}
                  </h3>

                  {/* Authors & year */}
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        person
                      </span>
                      {ref.authors}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        calendar_today
                      </span>
                      {ref.year}
                    </span>
                    {ref.doi && (
                      <a
                        href={`https://doi.org/${ref.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
                      >
                        <span className="material-symbols-outlined text-xs">
                          link
                        </span>
                        DOI
                      </a>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {ref.summary}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
        >
          <button
            onClick={() => navigate("/cognitive")}
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">
              play_arrow
            </span>
            Start Training
          </button>
          <button
            onClick={() => navigate("/cognitive")}
            className="flex items-center gap-2 rounded-full bg-surface-container-highest px-8 py-3 font-bold text-on-surface shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
            Dashboard
          </button>
        </motion.div>
      </main>
    </StudyBeeShell>
  );
}
