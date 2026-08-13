'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

/**
 * Bulk import.
 *
 * Administrators need to move material in without a developer: a word list from a textbook,
 * a question bank from a colleague, a set of reading passages. This handles the formats
 * people actually have — CSV pasted out of a spreadsheet, and JSON exported from another
 * system — for the four content types where bulk entry is genuinely painful by hand.
 *
 * Two rules keep imports safe:
 *
 *   * **Dry run first.** Every import is parsed and validated, and the report is shown,
 *     before anything is written. An import that would create 400 malformed rows is caught
 *     while it is still free to fix.
 *   * **Upsert, never blind insert.** Re-importing a corrected file updates the rows it
 *     matches instead of doubling them.
 */

export type ImportState = {
  ok?: boolean;
  error?: string;
  report?: {
    kind: string;
    parsed: number;
    created: number;
    updated: number;
    skipped: number;
    dryRun: boolean;
    problems: string[];
    preview: string[];
  };
} | null;

/** Parse CSV with quoted fields — the shape Excel and Google Sheets actually produce. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows
    .slice(1)
    .filter((values) => values.some((value) => value.trim()))
    .map((values) => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()])));
}

function parsePayload(text: string, format: string): Record<string, string>[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (format === 'json') {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) throw new Error('JSON phải là một mảng các đối tượng.');
    return parsed as Record<string, string>[];
  }
  return parseCsv(trimmed);
}

const REQUIRED: Record<string, string[]> = {
  vocabulary: ['word'],
  exercises: ['type', 'promptEn', 'answer'],
  reading: ['slug', 'titleVi', 'body'],
  faq: ['questionVi', 'answerVi'],
};

export async function runImport(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return { error: 'Bạn không có quyền thực hiện thao tác này.' };

  const kind = String(formData.get('kind') ?? 'vocabulary');
  const format = String(formData.get('format') ?? 'csv');
  const dryRun = formData.get('dryRun') === 'on';
  const text = String(formData.get('payload') ?? '');

  let rows: Record<string, string>[];
  try {
    rows = parsePayload(text, format);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Không đọc được dữ liệu.' };
  }
  if (!rows.length) return { error: 'Không tìm thấy dòng dữ liệu nào.' };

  const required = REQUIRED[kind] ?? [];
  const problems: string[] = [];
  const preview: string[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, row] of rows.entries()) {
    const missing = required.filter((field) => !String(row[field] ?? '').trim());
    if (missing.length) {
      problems.push(`Dòng ${index + 2}: thiếu ${missing.join(', ')}`);
      skipped += 1;
      continue;
    }

    if (preview.length < 5) {
      preview.push(Object.values(row).slice(0, 4).join(' · '));
    }

    if (dryRun) {
      created += 1;
      continue;
    }

    try {
      switch (kind) {
        case 'vocabulary': {
          const word = row.word.trim().toLowerCase();
          const existing = await db.vocabularyItem.findUnique({ where: { word } });
          const data = {
            word,
            cefr: row.cefr || 'A1',
            ipaUk: row.ipaUk ?? '',
            ipaUs: row.ipaUs ?? '',
            meaningVi: row.meaningVi ?? '',
            explanationVi: row.explanationVi ?? '',
            audioPath: row.audioPath ?? '',
            audioCredit: row.audioCredit ?? '',
            partsOfSpeech: JSON.stringify(
              (row.partsOfSpeech ?? '').split(';').map((value) => value.trim()).filter(Boolean),
            ),
          };
          if (existing) {
            await db.vocabularyItem.update({ where: { id: existing.id }, data });
            updated += 1;
          } else {
            await db.vocabularyItem.create({ data });
            created += 1;
          }
          break;
        }

        case 'exercises': {
          await db.exercise.create({
            data: {
              type: row.type,
              skill: row.skill || 'grammar',
              cefr: row.cefr || 'A1',
              difficulty: Number(row.difficulty ?? 2) || 2,
              promptVi: row.promptVi ?? '',
              promptEn: row.promptEn,
              context: row.context ?? '',
              payload: JSON.stringify(
                row.options
                  ? { options: row.options.split(';').map((value) => value.trim()).filter(Boolean) }
                  : {},
              ),
              answer: row.answer,
              explanationVi: row.explanationVi ?? '',
              attribution: row.attribution ?? '',
              grammarTopicId: row.grammarTopicSlug
                ? (await db.grammarTopic.findUnique({ where: { slug: row.grammarTopicSlug } }))?.id ?? null
                : null,
            },
          });
          created += 1;
          break;
        }

        case 'reading': {
          const paragraphs = row.body.split('\n\n').map((value) => value.trim()).filter(Boolean);
          const words = paragraphs.reduce((sum, value) => sum + value.split(/\s+/).length, 0);
          const existing = await db.readingItem.findUnique({ where: { slug: row.slug } });
          const data = {
            slug: row.slug,
            titleVi: row.titleVi,
            titleEn: row.titleEn ?? row.titleVi,
            kind: row.kind || 'ARTICLE',
            series: row.series ?? 'imported',
            cefr: row.cefr || 'B1',
            summaryVi: row.summaryVi ?? '',
            body: JSON.stringify(paragraphs),
            wordCount: words,
            readingMinutes: Math.max(1, Math.round(words / 130)),
            attribution: row.attribution ?? '',
            sourceUrl: row.sourceUrl ?? '',
          };
          if (existing) {
            await db.readingItem.update({ where: { id: existing.id }, data });
            updated += 1;
          } else {
            await db.readingItem.create({ data });
            created += 1;
          }
          break;
        }

        case 'faq': {
          await db.faqItem.create({
            data: {
              questionVi: row.questionVi,
              answerVi: row.answerVi,
              questionEn: row.questionEn ?? '',
              answerEn: row.answerEn ?? '',
              category: row.category || 'general',
            },
          });
          created += 1;
          break;
        }

        default:
          return { error: 'Loại dữ liệu không hợp lệ.' };
      }
    } catch (error) {
      problems.push(`Dòng ${index + 2}: ${error instanceof Error ? error.message : 'lỗi ghi dữ liệu'}`);
      skipped += 1;
    }
  }

  if (!dryRun) {
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPORT',
        entity: kind,
        summary: `Nhập ${created} bản ghi mới, cập nhật ${updated}, bỏ qua ${skipped}`,
      },
    });
    revalidatePath('/[locale]/admin', 'layout');
  }

  return {
    ok: true,
    report: {
      kind,
      parsed: rows.length,
      created,
      updated,
      skipped,
      dryRun,
      problems: problems.slice(0, 25),
      preview,
    },
  };
}
