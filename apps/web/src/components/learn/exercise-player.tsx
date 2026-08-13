'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw, XCircle } from 'lucide-react';

import { Alert, Badge, Button, Card, Input, ProgressBar, cn } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

/**
 * The practice runner.
 *
 * Answers are graded on the server, one question at a time. That is a deliberate cost: it
 * means the correct answer is never present in the page the learner is looking at, which
 * matters as soon as anything on this platform is used for assessment.
 *
 * Feedback appears immediately after each question rather than at the end, because a
 * learner who finds out on question twelve that they misunderstood question one has wasted
 * eleven questions.
 */

export type ClientExercise = {
  id: string;
  type: string;
  skill: string;
  cefr: string;
  promptVi: string;
  promptEn: string;
  context: string;
  hintVi: string;
  points: number;
  options: string[];
  pairs: { left: string; right: string }[];
  tokens: string[];
  audioUrl: string;
  attribution: string;
};

type Feedback = {
  correct: boolean;
  score: number;
  expected: string;
  explanationVi: string;
};

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'ex.chooseOne',
  MULTIPLE_SELECT: 'ex.chooseMany',
  GAP_FILL: 'ex.fillGap',
  REORDER: 'ex.reorder',
  MATCHING: 'ex.matching',
  TRUE_FALSE: 'ex.trueFalse',
  SHORT_ANSWER: 'ex.shortAnswer',
  TRANSLATION: 'ex.translation',
  DICTATION: 'ex.dictation',
};

export function ExercisePlayer({
  exercises,
  contextLabel,
  onFinishHref,
}: {
  exercises: ClientExercise[];
  contextLabel?: string;
  onFinishHref?: string;
}) {
  const { t, href } = useI18n();
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; score: number }[]>([]);
  const [finished, setFinished] = useState(false);

  const exercise = exercises[index];

  const reset = () => {
    setResponse('');
    setSelected([]);
    setOrder([]);
    setMatches({});
    setFeedback(null);
  };

  const answerValue = useMemo(() => {
    if (!exercise) return '';
    switch (exercise.type) {
      case 'MULTIPLE_SELECT':
        return selected.join('|');
      case 'REORDER':
        return order.join(' ');
      case 'MATCHING':
        return Object.entries(matches)
          .map(([left, right]) => `${left}→${right}`)
          .join('|');
      default:
        return response;
    }
  }, [exercise, response, selected, order, matches]);

  if (!exercises.length) {
    return (
      <Alert tone="info">Chưa có bài tập cho phần này. Hãy quay lại sau khi nội dung được bổ sung.</Alert>
    );
  }

  const check = async () => {
    if (!exercise || checking || feedback) return;
    setChecking(true);
    try {
      const result = await fetch('/api/exercises/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: exercise.id, response: answerValue }),
      });
      if (!result.ok) throw new Error('grade failed');
      const data = (await result.json()) as Feedback;
      setFeedback(data);
      setResults((previous) => [...previous, { correct: data.correct, score: data.score }]);
    } catch {
      setFeedback({
        correct: false,
        score: 0,
        expected: '',
        explanationVi: t('common.error'),
      });
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    if (index + 1 >= exercises.length) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    reset();
  };

  const restart = () => {
    setIndex(0);
    setResults([]);
    setFinished(false);
    reset();
  };

  if (finished) {
    const correct = results.filter((row) => row.correct).length;
    const percent = Math.round(
      (results.reduce((sum, row) => sum + row.score, 0) / Math.max(results.length, 1)) * 100,
    );
    const good = percent >= 70;
    return (
      <Card className="text-center">
        <span
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full',
            good ? 'bg-teal-100 text-teal-600' : 'bg-sun-100 text-sun-700',
          )}
        >
          {good ? <CheckCircle2 className="h-8 w-8" /> : <RotateCcw className="h-8 w-8" />}
        </span>
        <h3 className="mt-4 text-2xl">{good ? t('ex.wellDone') : t('ex.keepGoing')}</h3>
        <p className="mt-2 text-ink-600">
          {t('ex.summary', { correct, total: exercises.length })}
        </p>
        <div className="mx-auto mt-4 max-w-xs">
          <ProgressBar value={percent} accent={good ? 'teal' : 'sun'} label={t('ex.score')} />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={restart} variant="outline">
            <RotateCcw className="h-4 w-4" />
            {t('action.retry')}
          </Button>
          {onFinishHref ? (
            <a href={href(onFinishHref)} className="inline-flex">
              <Button>
                {t('action.next')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-ink-600">
          <span>
            {index + 1} / {exercises.length}
          </span>
          {contextLabel ? <span className="text-ink-400">· {contextLabel}</span> : null}
        </div>
        <div className="flex items-center gap-1.5">
          {results.map((row, i) => (
            <span
              key={i}
              className={cn('h-2 w-2 rounded-full', row.correct ? 'bg-teal-500' : 'bg-rose-400')}
              aria-hidden="true"
            />
          ))}
          {Array.from({ length: exercises.length - results.length }).map((_, i) => (
            <span key={`todo-${i}`} className="h-2 w-2 rounded-full bg-ink-200" aria-hidden="true" />
          ))}
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge accent="brand">{t(TYPE_LABEL[exercise.type] ?? 'nav.practice')}</Badge>
          <Badge accent="ink">{exercise.cefr}</Badge>
          {exercise.points > 1 ? <Badge accent="sun">{exercise.points} điểm</Badge> : null}
        </div>

        {exercise.promptVi ? (
          <p className="text-sm font-semibold text-ink-500">{exercise.promptVi}</p>
        ) : null}

        {exercise.audioUrl ? (
          <audio controls src={exercise.audioUrl} className="mt-3 w-full">
            <track kind="captions" />
          </audio>
        ) : null}

        <p className="mt-2 text-lg font-bold leading-relaxed text-ink-900">
          {renderPrompt(exercise.promptEn)}
        </p>

        {exercise.context ? (
          <p className="mt-2 rounded-2xl bg-ink-50 px-4 py-2.5 text-sm text-ink-600">
            {exercise.context}
          </p>
        ) : null}

        <div className="mt-5">
          {exercise.type === 'MULTIPLE_CHOICE' || exercise.type === 'TRUE_FALSE' ? (
            <div className="grid gap-2">
              {(exercise.type === 'TRUE_FALSE'
                ? [t('ex.true'), t('ex.false')]
                : exercise.options
              ).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={Boolean(feedback)}
                  onClick={() => setResponse(option)}
                  className={cn(
                    'rounded-2xl border-2 px-4 py-3 text-left text-[0.95rem] font-semibold transition-all',
                    response === option
                      ? 'border-brand-400 bg-brand-50 text-brand-900'
                      : 'border-ink-200 bg-white text-ink-800 hover:border-brand-300',
                    feedback && option === feedback.expected && 'border-teal-400 bg-teal-50 text-teal-900',
                    feedback &&
                      response === option &&
                      !feedback.correct &&
                      'border-rose-400 bg-rose-50 text-rose-900',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {exercise.type === 'MULTIPLE_SELECT' ? (
            <div className="grid gap-2">
              {exercise.options.map((option) => {
                const active = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={Boolean(feedback)}
                    onClick={() =>
                      setSelected((previous) =>
                        active ? previous.filter((value) => value !== option) : [...previous, option],
                      )
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[0.95rem] font-semibold transition-all',
                      active ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2',
                        active ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300',
                      )}
                    >
                      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          ) : null}

          {exercise.type === 'REORDER' ? (
            <div>
              <div className="min-h-[3.5rem] rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-3">
                <div className="flex flex-wrap gap-2">
                  {order.map((token, position) => (
                    <button
                      key={`${token}-${position}`}
                      type="button"
                      disabled={Boolean(feedback)}
                      onClick={() => setOrder(order.filter((_, i) => i !== position))}
                      className="rounded-xl bg-brand-500 px-3 py-1.5 text-sm font-bold text-white"
                    >
                      {token}
                    </button>
                  ))}
                  {!order.length ? (
                    <span className="px-1 py-1.5 text-sm text-ink-400">Chạm vào từ bên dưới để xếp câu</span>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {exercise.tokens.map((token, position) => {
                  const used = order.filter((value) => value === token).length;
                  const available = exercise.tokens.filter((value) => value === token).length;
                  const disabled = Boolean(feedback) || used >= available;
                  return (
                    <button
                      key={`${token}-${position}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => setOrder([...order, token])}
                      className={cn(
                        'rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition-colors',
                        disabled
                          ? 'border-ink-100 bg-ink-50 text-ink-300'
                          : 'border-ink-200 bg-white text-ink-800 hover:border-brand-300',
                      )}
                    >
                      {token}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {exercise.type === 'MATCHING' ? (
            <div className="space-y-2">
              {exercise.pairs.map((pair) => (
                <div key={pair.left} className="flex flex-col gap-2 rounded-2xl border-2 border-ink-200 bg-white p-3 sm:flex-row sm:items-center">
                  <span className="flex-1 text-sm text-ink-800">{pair.left}</span>
                  <select
                    disabled={Boolean(feedback)}
                    value={matches[pair.left] ?? ''}
                    onChange={(event) =>
                      setMatches((previous) => ({ ...previous, [pair.left]: event.target.value }))
                    }
                    className="rounded-xl border-2 border-ink-200 px-3 py-1.5 text-sm font-semibold"
                    aria-label={pair.left}
                  >
                    <option value="">—</option>
                    {exercise.pairs.map((option) => (
                      <option key={option.right} value={option.right}>
                        {option.right}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : null}

          {['GAP_FILL', 'SHORT_ANSWER', 'TRANSLATION', 'DICTATION'].includes(exercise.type) ? (
            <Input
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              disabled={Boolean(feedback)}
              placeholder="Nhập câu trả lời…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void check();
              }}
            />
          ) : null}
        </div>

        {exercise.hintVi && !feedback ? (
          <details className="mt-4">
            <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-sun-700">
              <Lightbulb className="h-4 w-4" />
              Gợi ý
            </summary>
            <p className="mt-2 text-sm text-ink-600">{exercise.hintVi}</p>
          </details>
        ) : null}

        {feedback ? (
          <div
            className={cn(
              'mt-5 rounded-2xl border-2 p-4',
              feedback.correct
                ? 'border-teal-200 bg-teal-50'
                : feedback.score > 0
                  ? 'border-sun-200 bg-sun-50'
                  : 'border-rose-200 bg-rose-50',
            )}
          >
            <p
              className={cn(
                'flex items-center gap-2 font-display text-base font-extrabold',
                feedback.correct ? 'text-teal-800' : feedback.score > 0 ? 'text-sun-800' : 'text-rose-800',
              )}
            >
              {feedback.correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {feedback.correct
                ? t('common.correct')
                : feedback.score > 0
                  ? 'Gần đúng — kiểm tra lại chính tả'
                  : t('common.incorrect')}
            </p>
            {!feedback.correct && feedback.expected ? (
              <p className="mt-2 text-sm text-ink-700">
                <span className="font-semibold">{t('common.correctAnswer')}:</span>{' '}
                <span className="font-bold">{feedback.expected}</span>
              </p>
            ) : null}
            {feedback.explanationVi ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{feedback.explanationVi}</p>
            ) : null}
            {exercise.attribution ? (
              <p className="mt-3 text-xs text-ink-400">{exercise.attribution}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          {feedback ? (
            <Button onClick={next}>
              {index + 1 >= exercises.length ? t('action.finish') : t('action.next')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={check} disabled={checking || !answerValue.trim()}>
              {checking ? '…' : t('action.check')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/** Render a gap as a visible blank rather than five underscores in the middle of a sentence. */
function renderPrompt(prompt: string) {
  const parts = prompt.split(/(_{3,})/g);
  return parts.map((part, index) =>
    /^_{3,}$/.test(part) ? (
      <span
        key={index}
        className="mx-1 inline-block min-w-[5rem] border-b-[3px] border-brand-400 align-bottom"
        aria-label="chỗ trống"
      >
        &nbsp;
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
