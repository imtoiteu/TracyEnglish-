'use client';

import { useState } from 'react';
import { ArrowRight, Award, RotateCcw } from 'lucide-react';

import { Button, ButtonLink, Card, Input, LevelBadge, ProgressBar, cn } from '@tracy/ui';

import type { ClientExercise } from '@/components/learn/exercise-player';
import { useI18n } from '@/lib/i18n';

/**
 * The placement test.
 *
 * Runs the same questions the lessons use, but suppresses per-question feedback: telling a
 * candidate they got question three wrong changes how they answer question four, and the
 * point here is measurement rather than teaching.
 *
 * Grading still happens on the server, one question at a time — the client only ever learns
 * the aggregate at the end.
 */
export function PlacementTest({
  questions,
  perLevel,
}: {
  questions: ClientExercise[];
  perLevel: number;
}) {
  const { t, href } = useI18n();
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const question = questions[index];

  if (!questions.length) {
    return (
      <Card>
        <p className="text-sm text-ink-600">
          Ngân hàng câu hỏi chưa đủ để dựng bài kiểm tra. Hãy quay lại sau.
        </p>
      </Card>
    );
  }

  const submit = async () => {
    if (busy || !question) return;
    setBusy(true);
    try {
      const result = await fetch('/api/exercises/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseId: question.id, response }),
      });
      const data = result.ok ? ((await result.json()) as { correct: boolean }) : { correct: false };
      setScores((previous) => ({
        ...previous,
        [question.cefr]: (previous[question.cefr] ?? 0) + (data.correct ? 1 : 0),
      }));
    } catch {
      setScores((previous) => ({ ...previous, [question.cefr]: previous[question.cefr] ?? 0 }));
    } finally {
      setResponse('');
      if (index + 1 >= questions.length) {
        setFinished(true);
      } else {
        setIndex(index + 1);
      }
      setBusy(false);
    }
  };

  if (finished) {
    const levels = [...new Set(questions.map((row) => row.cefr))];
    // The result is the highest level where at least three of four were right.
    const threshold = Math.ceil(perLevel * 0.75);
    let result = 'A1';
    for (const level of levels) {
      if ((scores[level] ?? 0) >= threshold) result = level;
    }
    const totalCorrect = Object.values(scores).reduce((sum, value) => sum + value, 0);

    const save = async () => {
      setSaving(true);
      try {
        await fetch('/api/placement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cefr: result, score: totalCorrect, maxScore: questions.length, breakdown: scores }),
        });
      } finally {
        setSaving(false);
      }
    };

    const advice: Record<string, { textVi: string; href: string; labelVi: string }> = {
      A1: {
        textVi: 'Bắt đầu từ khoá Tiếng Anh cơ bản A1. Trọng tâm đầu tiên là động từ to be và thì hiện tại đơn.',
        href: '/courses/basic-english-a1',
        labelVi: 'Mở khoá A1',
      },
      A2: {
        textVi: 'Bạn đã có nền. Khoá Giao tiếp hằng ngày A2 sẽ giúp bạn kể được chuyện ở cả hiện tại và quá khứ.',
        href: '/courses/daily-communication-a2',
        labelVi: 'Mở khoá A2',
      },
      B1: {
        textVi: 'Trình độ đủ để bắt đầu luyện thi. Khoá IELTS Foundation xây phần ngữ pháp mà band 5.5 hay thiếu.',
        href: '/courses/ielts-foundation',
        labelVi: 'Mở khoá IELTS Foundation',
      },
      B2: {
        textVi: 'Bạn viết và đọc được ở mức khá. Bước tiếp theo là văn phong học thuật và độ chính xác.',
        href: '/courses/academic-english-b2',
        labelVi: 'Mở khoá học thuật',
      },
      C1: {
        textVi: 'Trình độ cao. Hãy tập trung vào sắc thái: đảo ngữ, câu chẻ và cách nói thận trọng trong văn học thuật.',
        href: '/courses/academic-english-b2',
        labelVi: 'Mở khoá học thuật',
      },
    };

    return (
      <Card className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <Award className="h-8 w-8" />
        </span>
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-ink-400">Kết quả</p>
        <p className="mt-2 font-display text-6xl font-extrabold text-brand-600">{result}</p>
        <p className="mt-2 text-ink-600">
          Bạn trả lời đúng {totalCorrect}/{questions.length} câu.
        </p>

        <div className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {levels.map((level) => (
            <div key={level} className="flex items-center gap-3">
              <LevelBadge level={level} />
              <div className="flex-1">
                <ProgressBar
                  value={((scores[level] ?? 0) / perLevel) * 100}
                  accent={(scores[level] ?? 0) >= threshold ? 'teal' : 'ink'}
                />
              </div>
              <span className="w-10 text-right text-xs font-bold text-ink-500">
                {scores[level] ?? 0}/{perLevel}
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-lg rounded-2xl bg-lavender px-4 py-3 text-sm leading-relaxed text-ink-700">
          {advice[result]?.textVi}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={href(advice[result]?.href ?? '/courses')}>
            {advice[result]?.labelVi ?? t('nav.courses')}
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <Button onClick={save} variant="outline" disabled={saving}>
            {saving ? '…' : 'Lưu kết quả vào tài khoản'}
          </Button>
          <ButtonLink href={href('/contact')} variant="ghost">
            {t('action.consult')}
          </ButtonLink>
        </div>
      </Card>
    );
  }

  const progress = Math.round((index / questions.length) * 100);

  return (
    <div>
      <div className="mb-5">
        <ProgressBar
          value={progress}
          accent="rose"
          label={`Câu ${index + 1} / ${questions.length}`}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <LevelBadge level={question.cefr} />
          <span className="text-xs font-semibold text-ink-400">
            Không hiện đáp án cho tới khi kết thúc
          </span>
        </div>

        {question.promptVi ? (
          <p className="mt-4 text-sm font-semibold text-ink-500">{question.promptVi}</p>
        ) : null}
        <p className="mt-1 text-lg font-bold leading-relaxed text-ink-900">{question.promptEn}</p>
        {question.context ? (
          <p className="mt-2 rounded-2xl bg-ink-50 px-4 py-2.5 text-sm text-ink-600">
            {question.context}
          </p>
        ) : null}

        <div className="mt-5">
          {question.options.length ? (
            <div className="grid gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setResponse(option)}
                  className={cn(
                    'rounded-2xl border-2 px-4 py-3 text-left text-[0.95rem] font-semibold transition-all',
                    response === option
                      ? 'border-brand-400 bg-brand-50 text-brand-900'
                      : 'border-ink-200 bg-white text-ink-800 hover:border-brand-300',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <Input
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Nhập câu trả lời…"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submit();
              }}
            />
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setScores({});
              setResponse('');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-brand-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Bắt đầu lại
          </button>
          <Button onClick={submit} disabled={busy || !response.trim()}>
            {index + 1 >= questions.length ? t('action.finish') : t('action.next')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
