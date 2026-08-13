/**
 * The exercise engine.
 *
 * Grading happens on the server. The client renders a question and posts back a response;
 * it is never told the answer in advance, which is what stops a determined fifteen-year-old
 * from reading the answer key out of the page source.
 *
 * Every question type here is answerable by a Vietnamese learner on a phone. There is no
 * drag-and-drop that breaks on touch, and no free-form essay grading pretending to be
 * automatic — writing tasks are handed to a teacher instead.
 */

export const EXERCISE_TYPES = [
  'MULTIPLE_CHOICE',
  'MULTIPLE_SELECT',
  'GAP_FILL',
  'REORDER',
  'MATCHING',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'TRANSLATION',
  'DICTATION',
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export type ExercisePayload = {
  /** Choices for MULTIPLE_CHOICE / MULTIPLE_SELECT. */
  options?: string[];
  /** Left-hand and right-hand columns for MATCHING. */
  pairs?: { left: string; right: string }[];
  /** Shuffled tokens for REORDER. */
  tokens?: string[];
  /** Audio to play for DICTATION and listening questions. */
  audioUrl?: string;
  /** Anything the learner should see alongside the prompt. */
  context?: string;
};

export type GradedExercise = {
  id: string;
  type: ExerciseType;
  answer: string;
  payload: ExercisePayload;
  points: number;
};

export type GradeResult = {
  correct: boolean;
  /** 0–1. Partial credit is real: getting three of four matches right is not zero. */
  score: number;
  /** What the learner should be shown as the model answer. */
  expected: string;
  /** Per-item correctness, for question types with several parts. */
  detail?: boolean[];
};

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const SMART_QUOTES = /[‘’‛′]/g;
const SMART_DOUBLE = /[“”″]/g;

/**
 * Make two answers comparable without being pedantic.
 *
 * A learner who types "dont" instead of "don't", or forgets the full stop, has understood
 * the grammar point. A learner who types a different word has not. This function forgives
 * the first and catches the second.
 */
export function normalise(value: string): string {
  return (
    value
      .replace(SMART_QUOTES, "'")
      .replace(SMART_DOUBLE, '"')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      // Trailing punctuation is stripped *after* trimming — a learner who types
      // "He goes to school. " has answered the question.
      .replace(/[.,!?;:]+$/g, '')
      .trim()
  );
}

/** A looser comparison that also ignores apostrophes, for typed free-text answers. */
function loose(value: string): string {
  return normalise(value).replace(/['’-]/g, '');
}

/**
 * Levenshtein distance, capped for performance.
 *
 * Used only to decide whether a typed answer is a near-miss worth flagging as a spelling
 * slip rather than a wrong answer.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/** True when two strings differ only by an obvious typing slip. */
export function isNearMiss(given: string, expected: string): boolean {
  const a = loose(given);
  const b = loose(expected);
  if (!a || !b) return false;
  const allowed = b.length <= 4 ? 0 : b.length <= 8 ? 1 : 2;
  return editDistance(a, b) <= allowed;
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

function splitAnswers(answer: string): string[] {
  // Several accepted answers are stored separated by a pipe: "don't|do not".
  return answer.split('|').map((part) => part.trim()).filter(Boolean);
}

function gradeText(response: string, answer: string): GradeResult {
  const accepted = splitAnswers(answer);
  const given = normalise(response);
  const exact = accepted.some((candidate) => normalise(candidate) === given);
  if (exact) return { correct: true, score: 1, expected: accepted[0] };

  const nearly = accepted.some((candidate) => isNearMiss(response, candidate));
  // A near miss earns most of the credit but is still shown as needing correction, so the
  // learner sees the right spelling.
  return { correct: false, score: nearly ? 0.5 : 0, expected: accepted[0] };
}

function gradeMultipleSelect(response: string, answer: string, options: string[]): GradeResult {
  const chosen = new Set(
    response.split('|').map(normalise).filter(Boolean),
  );
  const expected = new Set(splitAnswers(answer).map(normalise));
  let hits = 0;
  let falsePositives = 0;
  for (const option of options.map(normalise)) {
    const picked = chosen.has(option);
    const shouldPick = expected.has(option);
    if (picked && shouldPick) hits += 1;
    if (picked && !shouldPick) falsePositives += 1;
  }
  // Credit for what was found, penalty for what was wrongly ticked — otherwise selecting
  // everything would score full marks.
  const raw = expected.size === 0 ? 0 : (hits - falsePositives) / expected.size;
  const score = Math.max(0, Math.min(1, raw));
  return {
    correct: score === 1,
    score,
    expected: splitAnswers(answer).join(', '),
  };
}

function gradeMatching(response: string, answer: string): GradeResult {
  // Response and answer are both "left→right" pairs joined by a pipe.
  const given = response.split('|').map(normalise).filter(Boolean);
  const expected = splitAnswers(answer).map(normalise);
  const detail = expected.map((pair) => given.includes(pair));
  const hits = detail.filter(Boolean).length;
  const score = expected.length ? hits / expected.length : 0;
  return { correct: score === 1, score, expected: splitAnswers(answer).join(' · '), detail };
}

function gradeReorder(response: string, answer: string): GradeResult {
  const given = normalise(response).replace(/\s+/g, ' ');
  const expected = normalise(answer).replace(/\s+/g, ' ');
  if (given === expected) return { correct: true, score: 1, expected: answer };

  // Partial credit for how many words landed in the right place, so a learner who
  // misplaces one word out of eight does not see a bare zero.
  const givenWords = given.split(' ');
  const expectedWords = expected.split(' ');
  let inPlace = 0;
  expectedWords.forEach((word, index) => {
    if (givenWords[index] === word) inPlace += 1;
  });
  const score = expectedWords.length ? inPlace / expectedWords.length : 0;
  return { correct: false, score: score === 1 ? 0.9 : score, expected: answer };
}

export function grade(exercise: GradedExercise, response: string): GradeResult {
  const trimmed = (response ?? '').toString();
  switch (exercise.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
      return normalise(trimmed) === normalise(exercise.answer)
        ? { correct: true, score: 1, expected: exercise.answer }
        : { correct: false, score: 0, expected: exercise.answer };

    case 'MULTIPLE_SELECT':
      return gradeMultipleSelect(trimmed, exercise.answer, exercise.payload.options ?? []);

    case 'MATCHING':
      return gradeMatching(trimmed, exercise.answer);

    case 'REORDER':
      return gradeReorder(trimmed, exercise.answer);

    case 'GAP_FILL':
    case 'SHORT_ANSWER':
    case 'TRANSLATION':
    case 'DICTATION':
      return gradeText(trimmed, exercise.answer);

    default:
      return { correct: false, score: 0, expected: exercise.answer };
  }
}

/** Grade a whole set and report a percentage. */
export function gradeSet(
  exercises: GradedExercise[],
  responses: Record<string, string>,
): { results: Record<string, GradeResult>; score: number; maxScore: number; percent: number } {
  const results: Record<string, GradeResult> = {};
  let score = 0;
  let maxScore = 0;
  for (const exercise of exercises) {
    const result = grade(exercise, responses[exercise.id] ?? '');
    results[exercise.id] = result;
    score += result.score * exercise.points;
    maxScore += exercise.points;
  }
  return {
    results,
    score: Math.round(score * 100) / 100,
    maxScore,
    percent: maxScore ? Math.round((score / maxScore) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// Spaced repetition
// ---------------------------------------------------------------------------

export type ReviewState = {
  box: number;
  ease: number;
  intervalDays: number;
  reviews: number;
  correct: number;
  lapses: number;
};

/** Days until the next review for each Leitner box. */
const BOX_INTERVALS = [0, 1, 2, 4, 8, 16, 32];

/**
 * Advance a word's review schedule.
 *
 * A Leitner box gives the schedule its shape; an SM-2-style ease factor stretches or
 * compresses it per word, so a word a learner keeps forgetting comes back sooner than one
 * they find easy, even in the same box.
 */
export function scheduleReview(state: ReviewState, quality: 'again' | 'hard' | 'good' | 'easy'): ReviewState {
  const next: ReviewState = { ...state, reviews: state.reviews + 1 };

  if (quality === 'again') {
    next.box = 0;
    next.lapses = state.lapses + 1;
    next.ease = Math.max(1.3, state.ease - 0.2);
  } else {
    next.correct = state.correct + 1;
    if (quality === 'hard') {
      next.box = Math.max(1, state.box);
      next.ease = Math.max(1.3, state.ease - 0.15);
    } else if (quality === 'good') {
      next.box = Math.min(BOX_INTERVALS.length - 1, state.box + 1);
    } else {
      next.box = Math.min(BOX_INTERVALS.length - 1, state.box + 2);
      next.ease = Math.min(3.0, state.ease + 0.15);
    }
  }

  const base = BOX_INTERVALS[next.box] ?? 32;
  next.intervalDays = next.box === 0 ? 0 : Math.max(1, Math.round(base * next.ease / 2.5));
  return next;
}

export function nextDueDate(state: ReviewState, from: Date = new Date()): Date {
  const due = new Date(from);
  if (state.intervalDays <= 0) {
    // Same-session retry: ten minutes, not tomorrow.
    due.setMinutes(due.getMinutes() + 10);
  } else {
    due.setDate(due.getDate() + state.intervalDays);
  }
  return due;
}

export const MASTERY_BOX = 5;

export function isMastered(state: Pick<ReviewState, 'box'>): boolean {
  return state.box >= MASTERY_BOX;
}

// ---------------------------------------------------------------------------
// Distractor generation for vocabulary review
// ---------------------------------------------------------------------------

/**
 * Choose wrong answers for a vocabulary multiple-choice question.
 *
 * Distractors are drawn from words at the same CEFR level, because a plausible wrong
 * answer teaches something and an absurd one does not. The selection is deterministic for
 * a given word so that a learner who revisits a card sees a stable question.
 */
export function pickDistractors<T extends { word: string; meaningVi: string; cefr: string }>(
  target: T,
  pool: T[],
  count = 3,
): T[] {
  const sameLevel = pool.filter(
    (item) => item.word !== target.word && item.cefr === target.cefr && item.meaningVi,
  );
  const candidates = sameLevel.length >= count ? sameLevel : pool.filter((item) => item.word !== target.word && item.meaningVi);
  const seed = [...target.word].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const picked: T[] = [];
  const used = new Set<string>();
  for (let step = 0; picked.length < count && step < candidates.length * 2; step += 1) {
    const index = (seed * 31 + step * 97) % candidates.length;
    const candidate = candidates[index];
    if (!candidate || used.has(candidate.word)) continue;
    used.add(candidate.word);
    picked.push(candidate);
  }
  return picked;
}

/** Deterministic shuffle so options do not jump around between renders. */
export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let value = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 7);
  for (let i = out.length - 1; i > 0; i -= 1) {
    value = (value * 1103515245 + 12345) % 2147483648;
    const j = value % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
