/**
 * Prompt library for Aether Evo typing tests.
 * Contains difficulty-based prompt arrays with fallback support.
 */

export type Difficulty = "easy" | "medium" | "hard";

/** Local prompt arrays organized by difficulty level */
const prompts: Record<Difficulty, string[]> = {
  easy: [
    "The cat sat on the mat and looked at the dog. It was a sunny day and the birds were singing in the trees.",
    "I like to read books in the park. The weather is nice and the flowers are blooming everywhere around me.",
    "She went to the store to buy some milk and bread. The store was busy but she found what she needed quickly.",
    "The dog ran fast across the green field. It was happy to be outside playing with its favorite red ball.",
    "We had a great time at the beach today. The waves were calm and the sand was warm under our bare feet.",
    "My friend and I walked to school together this morning. We talked about our favorite games along the way.",
    "The sun was shining bright and the sky was clear blue. It was a perfect day to go for a walk outside.",
    "He made a cup of hot tea and sat by the window. The rain was falling gently and the garden looked fresh.",
    "The kids played in the yard until it got dark outside. They were tired but happy after a long fun day.",
    "She opened the book and started reading the first page. The story was about a brave little rabbit on a trip.",
    "We planted flowers in the garden and watered them every day. Soon the yard was full of bright colors.",
    "He woke up early and made breakfast for the whole family. The smell of toast and eggs filled the house.",
    "The little boat sailed across the lake as the sun rose above the hills. It was a calm and peaceful morning.",
    "She tied her shoes and stepped outside into the cool morning air. The birds were already up and singing.",
    "They built a snowman in the backyard and gave it a hat and scarf. It stood proudly until the sun came out.",
    "The library was quiet and warm. She found a seat by the window and began reading her new favorite book.",
    "After dinner the family sat on the porch and watched the stars come out one by one in the clear dark sky.",
    "He practiced piano every day after school. His teacher said he was getting better with every single session.",
    "The train pulled into the station right on time. Passengers gathered their bags and stepped onto the platform.",
    "She drew a map of the neighborhood from memory. Every house and tree was exactly where she remembered it.",
  ],
  medium: [
    "The quick brown fox jumps over the lazy dog near the riverbank while the sun sets behind the distant mountains casting long shadows across the valley.",
    "Programming requires patience and attention to detail. Every line of code should be written with purpose and clarity to ensure maintainability over time.",
    "The scientist carefully measured each chemical compound before mixing them together in the laboratory flask, noting every observation in her detailed research journal.",
    "Modern technology has transformed the way we communicate with each other across vast distances, making the world feel smaller and more interconnected than ever before.",
    "Learning a new language opens doors to different cultures and perspectives, allowing individuals to connect with people from diverse backgrounds and experiences worldwide.",
    "The architect presented her design to the committee with confidence, explaining how the new building would integrate sustainable materials and energy-efficient heating systems.",
    "Effective teamwork depends on clear communication, mutual respect, and a shared vision. Without these elements, even the most talented groups struggle to deliver results.",
    "The documentary explored the migration patterns of Arctic birds, revealing how they navigate thousands of miles using the Earth's magnetic field as a natural compass.",
    "Running a small business requires balancing financial management, customer relationships, and daily operations while staying adaptable to shifting market conditions and consumer trends.",
    "The orchestra rehearsed for weeks before the opening night performance, perfecting every transition and dynamic shift to deliver a captivating experience for the audience.",
    "She had always believed that the smallest acts of kindness could ripple outward in ways that were impossible to measure but deeply felt by everyone they touched.",
    "The city skyline glittered at dusk as commuters made their way home through crowded streets, each person carrying with them the invisible weight of their daily ambitions.",
    "Reading widely and consistently is one of the most reliable ways to expand your vocabulary, sharpen your thinking, and develop a more nuanced understanding of the world.",
    "The expedition team spent three weeks mapping uncharted terrain, relying on satellite imagery, hand-drawn notes, and sheer determination to push deeper into the wilderness each day.",
    "Great design is often invisible; it simply works so well that users never notice the dozens of deliberate decisions that went into making every interaction feel effortless.",
    "History has shown repeatedly that transformative ideas rarely emerge fully formed; they evolve through iteration, failure, collaboration, and the persistent courage to keep asking better questions.",
    "The bakery opened at five in the morning, and by seven the counter was lined with fresh loaves, pastries, and the kind of warm smells that made the whole block slow down.",
    "She revised her manuscript seventeen times before submitting it, convinced that one more careful pass might reveal the single sentence that would make the whole story click into place.",
    "The software team adopted a daily stand-up practice that transformed their communication, surfacing blockers early and giving everyone a shared sense of progress and collective momentum.",
    "Patience is not the ability to wait, but the capacity to maintain a positive and constructive attitude while waiting — a subtle but essential distinction that changes everything.",
  ],
  hard: [
    "Simultaneously synthesizing quantum mechanical principles with thermodynamic equilibrium equations requires extraordinary mathematical proficiency and an unwavering commitment to theoretical precision throughout the derivation process.",
    "The ephemeral juxtaposition of philosophical paradigms within contemporary epistemological frameworks necessitates a comprehensive understanding of both phenomenological and hermeneutical methodologies in academic discourse.",
    "Implementing sophisticated cryptographic algorithms utilizing elliptic curve mathematics demands meticulous attention to computational complexity, asymptotic analysis, and rigorous security vulnerability assessments across distributed systems.",
    "The unprecedented acceleration of biotechnological innovations, particularly in CRISPR-Cas9 gene editing and recombinant DNA technology, has fundamentally revolutionized pharmaceutical research and personalized therapeutic interventions.",
    "Architectural deconstruction of microservices orchestration patterns reveals intricate dependencies between containerized deployments, service mesh configurations, and distributed tracing mechanisms within cloud-native infrastructure paradigms.",
    "Interdisciplinary convergence of neurolinguistic programming methodologies with cognitive behavioral therapeutic frameworks has engendered transformative approaches to psychopathological assessment and longitudinal rehabilitative prognoses.",
    "The oscillatory perturbations inherent in magnetohydrodynamic plasma confinement underscore the necessity of advanced feedback stabilization algorithms; particularly within toroidal fusion reactor geometries operating at thermonuclear temperatures.",
    "Rigorous adherence to zero-knowledge proof constructions in decentralized identity verification protocols mitigates adversarial exploitation vectors while preserving cryptographic non-repudiation guarantees across heterogeneous blockchain networks.",
    "Paleoclimatological reconstructions derived from dendrochronological and isotopic proxies illuminate the quasi-periodic oscillations of Holocene temperature variability, challenging prevailing uniformitarian assumptions in contemporary geoscience.",
    "Notwithstanding the proliferation of polyglot persistence architectures, achieving deterministic consistency guarantees across geographically partitioned data stores remains an intractable challenge under the constraints of the CAP theorem.",
    "The stochastic resonance phenomenon — whereby the addition of noise paradoxically enhances signal detection in nonlinear systems — has profound implications for neurological signal processing and sensory augmentation technologies.",
    "Deconstructionist literary theory, as articulated by Derrida, postulates that any text inherently subverts its own claims to stable meaning through the infinite deferral of signification along an indeterminate chain of signifiers.",
    "Vehicular ad-hoc networks leverage opportunistic routing protocols and intermittent connectivity to propagate safety-critical telemetry across urban infrastructure, demanding sub-millisecond latency guarantees under adversarial channel conditions.",
    "The asymptotic equipartition property of information theory establishes that typical sequences dominate the probability space of an ergodic source, underpinning both lossless compression bounds and channel capacity calculations.",
    "Recursive self-improvement in artificial general intelligence systems introduces metastability concerns that are analytically intractable under standard game-theoretic frameworks, necessitating novel alignment verification methodologies.",
    "Synchrotron radiation facilities produce brilliance levels exceeding conventional X-ray tubes by twelve orders of magnitude, enabling crystallographic resolution of protein structures at sub-angstrom precision for pharmaceutical discovery.",
    "The epistemological tension between Bayesian and frequentist interpretations of probability propagates into divergent recommendations for experimental design, sample size determination, and the reporting of inferential uncertainty in empirical research.",
    "Post-quantum lattice-based cryptography exploits the computational intractability of the shortest vector problem to construct digital signatures and key encapsulation mechanisms resilient to Shor's algorithm on fault-tolerant quantum hardware.",
    "Catastrophic forgetting in continual learning architectures arises from the plasticity-stability dilemma inherent to gradient descent optimization; elastic weight consolidation and progressive neural networks represent competing mitigation strategies.",
    "The renormalization group technique, originally developed to tame ultraviolet divergences in quantum electrodynamics, found unexpected universality in condensed matter physics through Wilson's formulation of critical phenomena near second-order phase transitions.",
  ],
};

/**
 * Returns a random prompt for the given difficulty level, optionally
 * excluding a set of recently-used prompts to reduce repetition.
 * Falls back to the full pool if all prompts are excluded.
 *
 * @param difficulty - The difficulty level to select from.
 * @param excluded   - An array of prompt strings to skip (e.g. recently completed).
 *                     If all prompts would be excluded, the full pool is used as fallback.
 */
export function getPrompt(difficulty: Difficulty = "easy", excluded: string[] = []): string {
  const pool = prompts[difficulty] || prompts.easy;
  const available = excluded.length > 0 ? pool.filter((p) => !excluded.includes(p)) : pool;
  // Use full pool as fallback when all prompts are in the excluded list
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

/**
 * Returns all prompts for a given difficulty level.
 */
export function getPromptsByDifficulty(difficulty: Difficulty): string[] {
  return prompts[difficulty] || prompts.easy;
}

/**
 * Validates that a difficulty string is valid.
 */
export function isValidDifficulty(value: string): value is Difficulty {
  return ["easy", "medium", "hard"].includes(value);
}
