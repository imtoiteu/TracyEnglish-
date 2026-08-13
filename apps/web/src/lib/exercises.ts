import type { Exercise } from '@prisma/client';

import type { ClientExercise } from '@/components/learn/exercise-player';

import { parseJson } from './json';

/**
 * Strip an exercise down to what the browser is allowed to see.
 *
 * Crucially this drops `answer` and `explanationVi`: both are returned by the grading
 * endpoint only after the learner has submitted. Serialising the whole row to the client
 * would put the answer key in the page source.
 */
export function toClientExercise(exercise: Exercise): ClientExercise {
  const payload = parseJson<{
    options?: string[];
    pairs?: { left: string; right: string }[];
    tokens?: string[];
    audioUrl?: string;
  }>(exercise.payload, {});

  // REORDER questions store the shuffled words in the prompt, separated by slashes.
  const tokens =
    payload.tokens ??
    (exercise.type === 'REORDER'
      ? exercise.promptEn.split('/').map((token) => token.trim()).filter(Boolean)
      : []);

  return {
    id: exercise.id,
    type: exercise.type,
    skill: exercise.skill,
    cefr: exercise.cefr,
    promptVi: exercise.promptVi,
    // For REORDER the prompt is the token bank, which is rendered separately.
    promptEn: exercise.type === 'REORDER' ? '' : exercise.promptEn,
    context: exercise.context,
    hintVi: exercise.hintVi,
    points: exercise.points,
    options: payload.options ?? [],
    pairs: payload.pairs ?? [],
    tokens,
    audioUrl: payload.audioUrl ?? '',
    attribution: exercise.attribution,
  };
}

export function toClientExercises(exercises: Exercise[]): ClientExercise[] {
  return exercises.map(toClientExercise);
}
