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
  ],
  medium: [
    "The quick brown fox jumps over the lazy dog near the riverbank while the sun sets behind the distant mountains casting long shadows across the valley.",
    "Programming requires patience and attention to detail. Every line of code should be written with purpose and clarity to ensure maintainability over time.",
    "The scientist carefully measured each chemical compound before mixing them together in the laboratory flask, noting every observation in her detailed research journal.",
    "Modern technology has transformed the way we communicate with each other across vast distances, making the world feel smaller and more interconnected than ever before.",
    "Learning a new language opens doors to different cultures and perspectives, allowing individuals to connect with people from diverse backgrounds and experiences worldwide.",
  ],
  hard: [
    "Simultaneously synthesizing quantum mechanical principles with thermodynamic equilibrium equations requires extraordinary mathematical proficiency and an unwavering commitment to theoretical precision throughout the derivation process.",
    "The ephemeral juxtaposition of philosophical paradigms within contemporary epistemological frameworks necessitates a comprehensive understanding of both phenomenological and hermeneutical methodologies in academic discourse.",
    "Implementing sophisticated cryptographic algorithms utilizing elliptic curve mathematics demands meticulous attention to computational complexity, asymptotic analysis, and rigorous security vulnerability assessments across distributed systems.",
    "The unprecedented acceleration of biotechnological innovations, particularly in CRISPR-Cas9 gene editing and recombinant DNA technology, has fundamentally revolutionized pharmaceutical research and personalized therapeutic interventions.",
    "Architectural deconstruction of microservices orchestration patterns reveals intricate dependencies between containerized deployments, service mesh configurations, and distributed tracing mechanisms within cloud-native infrastructure paradigms.",
  ],
};

/**
 * Returns a random prompt for the given difficulty level.
 * Falls back to easy prompts if the difficulty is invalid.
 */
export function getPrompt(difficulty: Difficulty = "easy"): string {
  const pool = prompts[difficulty] || prompts.easy;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
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
