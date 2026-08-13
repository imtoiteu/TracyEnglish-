import { describe, expect, it } from 'vitest';

import {
  editDistance,
  grade,
  gradeSet,
  isNearMiss,
  isMastered,
  nextDueDate,
  normalise,
  pickDistractors,
  scheduleReview,
  shuffleWithSeed,
  type GradedExercise,
  type ReviewState,
} from './index';

const exercise = (overrides: Partial<GradedExercise>): GradedExercise => ({
  id: 'x1',
  type: 'MULTIPLE_CHOICE',
  answer: 'goes',
  payload: {},
  points: 1,
  ...overrides,
});

describe('normalise', () => {
  it('ignores trailing punctuation, case and repeated spaces', () => {
    expect(normalise('  He   GOES to school. ')).toBe('he goes to school');
  });

  it('folds curly apostrophes so a phone keyboard does not fail a learner', () => {
    expect(normalise('don’t')).toBe(normalise("don't"));
  });
});

describe('grading multiple choice', () => {
  it('accepts the exact option', () => {
    expect(grade(exercise({}), 'goes').correct).toBe(true);
  });

  it('rejects a different option with no partial credit', () => {
    const result = grade(exercise({}), 'go');
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  it('reveals the model answer so the learner can see it', () => {
    expect(grade(exercise({}), 'go').expected).toBe('goes');
  });
});

describe('grading typed answers', () => {
  it('accepts any of several stored answers', () => {
    const item = exercise({ type: 'GAP_FILL', answer: "don't|do not" });
    expect(grade(item, 'do not').correct).toBe(true);
    expect(grade(item, "DON'T").correct).toBe(true);
  });

  it('gives partial credit for a spelling slip rather than a bare zero', () => {
    const item = exercise({ type: 'SHORT_ANSWER', answer: 'environment' });
    const result = grade(item, 'enviroment');
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0.5);
  });

  it('does not treat a different word as a near miss', () => {
    const item = exercise({ type: 'SHORT_ANSWER', answer: 'cat' });
    expect(grade(item, 'dog').score).toBe(0);
  });
});

describe('multiple select', () => {
  const item = exercise({
    type: 'MULTIPLE_SELECT',
    answer: 'a|b',
    payload: { options: ['a', 'b', 'c', 'd'] },
  });

  it('scores a complete correct selection', () => {
    expect(grade(item, 'a|b').correct).toBe(true);
  });

  it('penalises wrongly ticked options so selecting everything scores nothing', () => {
    expect(grade(item, 'a|b|c|d').score).toBe(0);
  });

  it('awards partial credit for a subset', () => {
    expect(grade(item, 'a').score).toBe(0.5);
  });
});

describe('reorder', () => {
  const item = exercise({ type: 'REORDER', answer: 'I am a student' });

  it('accepts the exact word order', () => {
    expect(grade(item, 'I am a student').correct).toBe(true);
  });

  it('awards partial credit by words in the right place', () => {
    const result = grade(item, 'I am student a');
    expect(result.correct).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });
});

describe('matching', () => {
  const item = exercise({ type: 'MATCHING', answer: 'one→1|two→2|three→3' });

  it('scores every pair matched', () => {
    expect(grade(item, 'one→1|two→2|three→3').correct).toBe(true);
  });

  it('gives proportional credit for two of three', () => {
    expect(grade(item, 'one→1|two→2|three→1').score).toBeCloseTo(2 / 3);
  });
});

describe('gradeSet', () => {
  it('reports a percentage weighted by points', () => {
    const items: GradedExercise[] = [
      exercise({ id: 'a', answer: 'yes', points: 1 }),
      exercise({ id: 'b', answer: 'no', points: 3 }),
    ];
    const result = gradeSet(items, { a: 'yes', b: 'wrong' });
    expect(result.maxScore).toBe(4);
    expect(result.score).toBe(1);
    expect(result.percent).toBe(25);
  });
});

describe('edit distance', () => {
  it('is zero for identical strings', () => {
    expect(editDistance('abc', 'abc')).toBe(0);
  });

  it('counts a single substitution', () => {
    expect(editDistance('abc', 'abd')).toBe(1);
  });

  it('is strict on short words where one letter changes the meaning', () => {
    expect(isNearMiss('cat', 'car')).toBe(false);
  });
});

describe('spaced repetition', () => {
  const fresh: ReviewState = { box: 0, ease: 2.5, intervalDays: 0, reviews: 0, correct: 0, lapses: 0 };

  it('advances a box on a good answer', () => {
    expect(scheduleReview(fresh, 'good').box).toBe(1);
  });

  it('jumps two boxes when the learner found it easy', () => {
    expect(scheduleReview(fresh, 'easy').box).toBe(2);
  });

  it('resets to box zero and records a lapse when forgotten', () => {
    const learned = scheduleReview(scheduleReview(fresh, 'good'), 'good');
    const forgotten = scheduleReview(learned, 'again');
    expect(forgotten.box).toBe(0);
    expect(forgotten.lapses).toBe(1);
  });

  it('lowers ease after a lapse so the word comes back sooner', () => {
    expect(scheduleReview(fresh, 'again').ease).toBeLessThan(fresh.ease);
  });

  it('never lets ease fall below the floor', () => {
    let state = fresh;
    for (let index = 0; index < 20; index += 1) state = scheduleReview(state, 'again');
    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('schedules a forgotten word minutes away, not days', () => {
    const from = new Date('2026-01-01T09:00:00Z');
    const due = nextDueDate(scheduleReview(fresh, 'again'), from);
    expect(due.getTime() - from.getTime()).toBeLessThan(60 * 60 * 1000);
  });

  it('schedules a remembered word at least a day away', () => {
    const from = new Date('2026-01-01T09:00:00Z');
    const due = nextDueDate(scheduleReview(fresh, 'good'), from);
    expect(due.getTime()).toBeGreaterThan(from.getTime() + 20 * 60 * 60 * 1000);
  });

  it('marks a word mastered only at box five', () => {
    expect(isMastered({ box: 4 })).toBe(false);
    expect(isMastered({ box: 5 })).toBe(true);
  });
});

describe('distractors', () => {
  const pool = [
    { word: 'cat', meaningVi: 'con mèo', cefr: 'A1' },
    { word: 'dog', meaningVi: 'con chó', cefr: 'A1' },
    { word: 'bird', meaningVi: 'con chim', cefr: 'A1' },
    { word: 'horse', meaningVi: 'con ngựa', cefr: 'A1' },
    { word: 'mitigate', meaningVi: 'giảm nhẹ', cefr: 'C1' },
  ];

  it('never offers the target word as its own distractor', () => {
    const picked = pickDistractors(pool[0], pool, 3);
    expect(picked.some((row) => row.word === 'cat')).toBe(false);
  });

  it('prefers words at the same level so the choice is plausible', () => {
    const picked = pickDistractors(pool[0], pool, 3);
    expect(picked.every((row) => row.cefr === 'A1')).toBe(true);
  });

  it('is deterministic for the same word', () => {
    expect(pickDistractors(pool[0], pool, 3)).toEqual(pickDistractors(pool[0], pool, 3));
  });
});

describe('shuffleWithSeed', () => {
  it('keeps every element', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect([...shuffleWithSeed(items, 'seed')].sort()).toEqual([...items].sort());
  });

  it('returns the same order for the same seed', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffleWithSeed(items, 'x')).toEqual(shuffleWithSeed(items, 'x'));
  });
});
