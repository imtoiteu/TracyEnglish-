/**
 * Lesson content blocks.
 *
 * A lesson's body is an ordered list of typed blocks rather than a slab of HTML. That gives
 * three things at once: an administrator can reorder and edit teaching material without
 * touching code, the renderer can style each kind of block properly (an example pair does
 * not look like a paragraph), and a block can *reference* ingested content by slug instead
 * of copying it — so when a vocabulary list gains a word, every lesson using it gains it too.
 *
 * Every lesson on the platform is built from the same seven stages: objective, explanation,
 * examples, practice, feedback, summary, next step.
 */

export type LessonBlock =
  | { type: 'objective'; vi: string; en?: string }
  /** A paragraph of teaching prose. Light markdown: **bold**, *italic*, `code`. */
  | { type: 'prose'; vi: string; en?: string }
  /** A callout — a tip, a warning about a common error, a cultural note. */
  | { type: 'tip'; tone?: 'tip' | 'warning' | 'note'; vi: string; titleVi?: string }
  /** Bilingual model sentences. */
  | { type: 'examples'; titleVi?: string; items: { en: string; vi: string; note?: string }[] }
  /** A form table: patterns, conjugations, comparisons. */
  | { type: 'table'; titleVi?: string; headers: string[]; rows: string[][] }
  /** Pull in a whole vocabulary list by slug. */
  | { type: 'vocabList'; slug: string; titleVi?: string; limit?: number }
  /** Pull in a grammar topic's theory and patterns. */
  | { type: 'grammar'; slug: string; sections?: ('theory' | 'patterns' | 'pitfalls' | 'tips')[] }
  /** An audio lesson with transcript. */
  | { type: 'listening'; slug: string; taskVi?: string }
  /** A reading passage. */
  | { type: 'reading'; slug: string; taskVi?: string }
  /** The lesson's exercises, rendered as an interactive set. */
  | { type: 'practice'; titleVi?: string; introVi?: string }
  /** What the learner should take away. */
  | { type: 'summary'; vi: string; points?: string[] }
  /** Where to go next, with a real link. */
  | { type: 'nextStep'; vi: string; href?: string; labelVi?: string };

export type LessonBlockType = LessonBlock['type'];

export const BLOCK_LABELS: Record<LessonBlockType, string> = {
  objective: 'Mục tiêu',
  prose: 'Đoạn giảng',
  tip: 'Ghi chú',
  examples: 'Ví dụ',
  table: 'Bảng',
  vocabList: 'Danh sách từ vựng',
  grammar: 'Chủ điểm ngữ pháp',
  listening: 'Bài nghe',
  reading: 'Bài đọc',
  practice: 'Bài tập',
  summary: 'Tóm tắt',
  nextStep: 'Bước tiếp theo',
};

/** A blank block of each type, used by the admin authoring UI's "add block" menu. */
export function emptyBlock(type: LessonBlockType): LessonBlock {
  switch (type) {
    case 'objective':
      return { type, vi: '' };
    case 'prose':
      return { type, vi: '' };
    case 'tip':
      return { type, tone: 'tip', vi: '' };
    case 'examples':
      return { type, items: [{ en: '', vi: '' }] };
    case 'table':
      return { type, headers: ['', ''], rows: [['', '']] };
    case 'vocabList':
      return { type, slug: '' };
    case 'grammar':
      return { type, slug: '' };
    case 'listening':
      return { type, slug: '' };
    case 'reading':
      return { type, slug: '' };
    case 'practice':
      return { type };
    case 'summary':
      return { type, vi: '', points: [] };
    case 'nextStep':
      return { type, vi: '' };
    default:
      return { type: 'prose', vi: '' };
  }
}

/**
 * Validate blocks coming from the admin editor.
 *
 * Anything unrecognised is dropped rather than rendered, so a malformed paste cannot break
 * a lesson page for learners.
 */
export function sanitiseBlocks(input: unknown): LessonBlock[] {
  if (!Array.isArray(input)) return [];
  const out: LessonBlock[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const block = raw as Record<string, unknown>;
    const type = block.type;
    if (typeof type !== 'string' || !(type in BLOCK_LABELS)) continue;
    out.push(block as LessonBlock);
  }
  return out;
}

/**
 * Very small markdown subset for lesson prose.
 *
 * Deliberately not a full markdown parser: teaching text needs bold, italic, inline code
 * and paragraph breaks, and nothing else. Everything is escaped first, so administrator
 * input cannot inject markup.
 */
export function renderInline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-ink-100 px-1 py-0.5 text-[0.9em]">$1</code>');
}
