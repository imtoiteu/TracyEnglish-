import { renderInline } from '@/lib/lesson-blocks';

import { cn } from '@tracy/ui';

/**
 * Teaching prose.
 *
 * Lesson and grammar text is authored with a deliberately tiny markdown subset — bold,
 * italic, inline code and blank-line paragraph breaks — so an administrator can emphasise
 * a form without being handed a rich-text editor that can inject arbitrary HTML.
 *
 * `renderInline` escapes first and then applies only those three transformations, which is
 * why setting the result as HTML here is safe.
 */
export function Prose({ text, compact = false }: { text: string; compact?: boolean }) {
  const paragraphs = text.split(/\n{2,}/).filter((block) => block.trim());
  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-4')}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={cn(
            'leading-relaxed text-ink-700',
            compact ? 'text-sm' : 'text-[1.0625rem] leading-[1.8]',
          )}
          dangerouslySetInnerHTML={{ __html: renderInline(paragraph).replace(/\n/g, '<br />') }}
        />
      ))}
    </div>
  );
}
