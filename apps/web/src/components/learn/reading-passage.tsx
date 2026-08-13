'use client';

import { useMemo, useState, type ReactElement } from 'react';
import { Type } from 'lucide-react';

import { Card, cn } from '@tracy/ui';

/**
 * A reading passage with in-place glossary lookups.
 *
 * Glossary words are underlined in the text; tapping one shows the publisher's definition
 * without leaving the page. That matters on a phone — a learner who has to open a new tab
 * for every unknown word stops reading after two paragraphs.
 */
export function ReadingPassage({
  paragraphs,
  glossary,
}: {
  paragraphs: string[];
  glossary: { word: string; pos: string; definition: string }[];
}) {
  const [large, setLarge] = useState(false);
  const [active, setActive] = useState<{ word: string; pos: string; definition: string } | null>(null);

  const lookup = useMemo(() => {
    const map = new Map<string, { word: string; pos: string; definition: string }>();
    for (const entry of glossary) map.set(entry.word.toLowerCase(), entry);
    return map;
  }, [glossary]);

  const pattern = useMemo(() => {
    const words = glossary
      .map((entry) => entry.word)
      .filter((word) => word && !word.includes(' ') && word.length > 2)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return null;
    return new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  }, [glossary]);

  const render = (paragraph: string, key: number) => {
    if (!pattern) return <p key={key}>{paragraph}</p>;
    const parts: (string | ReactElement)[] = [];
    let lastIndex = 0;
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(paragraph)) !== null) {
      if (match.index > lastIndex) parts.push(paragraph.slice(lastIndex, match.index));
      const entry = lookup.get(match[0].toLowerCase());
      const surface = match[0];
      parts.push(
        <button
          key={`${key}-${match.index}`}
          type="button"
          onClick={() => entry && setActive(entry)}
          className="rounded border-b-2 border-dotted border-teal-500 font-semibold text-teal-900 transition-colors hover:bg-teal-100"
        >
          {surface}
        </button>,
      );
      lastIndex = match.index + surface.length;
    }
    if (lastIndex < paragraph.length) parts.push(paragraph.slice(lastIndex));
    return <p key={key}>{parts}</p>;
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl">Bài đọc</h2>
        <button
          type="button"
          onClick={() => setLarge((value) => !value)}
          aria-pressed={large}
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 hover:border-teal-300"
        >
          <Type className="h-3.5 w-3.5" />
          {large ? 'Cỡ chữ thường' : 'Cỡ chữ lớn'}
        </button>
      </div>

      {active ? (
        <div className="mb-4 rounded-2xl border-2 border-teal-200 bg-teal-50 p-4" role="status">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-extrabold text-teal-900">
                {active.word}
                {active.pos ? (
                  <span className="ml-2 text-xs font-semibold uppercase text-teal-600">{active.pos}</span>
                ) : null}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-teal-800">{active.definition}</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="shrink-0 rounded-xl px-2 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
            >
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-xs text-ink-500">
          Những từ gạch chân là từ khoá của bài — chạm vào để xem nghĩa mà không rời trang.
        </p>
      )}

      <div className={cn('passage', large && 'text-xl leading-[2]')}>
        {paragraphs.map((paragraph, index) => render(paragraph, index))}
      </div>
    </Card>
  );
}
