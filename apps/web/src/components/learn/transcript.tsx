'use client';

import { useMemo, useState, type ReactElement } from 'react';
import { Eye, EyeOff, Type } from 'lucide-react';

import { Card, cn } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

/**
 * The transcript panel.
 *
 * Hidden by default, and that is the point: a learner who reads along on the first pass is
 * practising reading, not listening. Revealing it is a deliberate second step.
 *
 * Words from the publisher's own glossary are highlighted in the text so a learner can see
 * where the taught vocabulary actually occurs, rather than meeting it in a list divorced
 * from its context.
 */
export function Transcript({
  paragraphs,
  glossary = [],
  translations = [],
}: {
  paragraphs: string[];
  glossary?: string[];
  translations?: string[];
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [large, setLarge] = useState(false);

  const pattern = useMemo(() => {
    const words = glossary
      .filter((word) => word && !word.includes(' ') && word.length > 2)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return null;
    return new RegExp(`\\b(${words.join('|')})\\w{0,3}\\b`, 'gi');
  }, [glossary]);

  const render = (paragraph: string) => {
    if (!pattern) return paragraph;
    const parts: (string | ReactElement)[] = [];
    let lastIndex = 0;
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(paragraph)) !== null) {
      if (match.index > lastIndex) parts.push(paragraph.slice(lastIndex, match.index));
      parts.push(
        <mark key={`${match.index}-${match[0]}`} className="rounded bg-sky-100 px-0.5 font-semibold text-sky-900">
          {match[0]}
        </mark>,
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < paragraph.length) parts.push(paragraph.slice(lastIndex));
    return parts;
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">{t('listening.transcript')}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLarge((value) => !value)}
            aria-pressed={large}
            className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:border-brand-300"
          >
            <Type className="h-3.5 w-3.5" />
            {large ? 'Cỡ chữ thường' : 'Cỡ chữ lớn'}
          </button>
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-expanded={visible}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-600"
          >
            {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {visible ? t('listening.hideTranscript') : t('listening.showTranscript')}
          </button>
        </div>
      </div>

      {visible ? (
        <div className={cn('passage mt-5 animate-fade-up', large && 'text-xl leading-[2]')}>
          {paragraphs.map((paragraph, index) => (
            <div key={index}>
              <p>{render(paragraph)}</p>
              {translations[index] ? (
                <p className="mt-1 text-sm italic text-teal-800">{translations[index]}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-center text-sm text-ink-500">
          Lời thoại đang ẩn. Hãy nghe hết một lượt trước khi mở — đọc theo ngay từ đầu là luyện
          đọc chứ không phải luyện nghe.
        </p>
      )}
    </Card>
  );
}
