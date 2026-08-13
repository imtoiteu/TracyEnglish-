import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reading the ingested content.
 *
 * The pipeline in `scripts/ingest` writes normalised JSON into `content/` at the repository
 * root. The seed reads it from there rather than re-downloading anything, so seeding is
 * offline, deterministic and fast.
 */

export const CONTENT_DIR = join(process.cwd(), '..', '..', 'content');

export function loadContent<T>(relative: string, fallback?: T): T {
  try {
    return JSON.parse(readFileSync(join(CONTENT_DIR, relative), 'utf8')) as T;
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw new Error(
      `Missing content file ${relative}. Run \`npm run content:ingest\` first. (${String(error)})`,
    );
  }
}

// ---------------------------------------------------------------------------
// Shapes produced by the ingestion pipeline
// ---------------------------------------------------------------------------

export type SourceRecord = {
  id: string;
  name: string;
  publisher: string;
  url: string;
  licence: string;
  licenceUrl: string;
  attribution: string;
  usedFor: string;
};

export type VocabularyRecord = {
  word: string;
  cefr: string;
  partsOfSpeech: string[];
  ipaUk: string;
  ipaUs: string;
  audioPath: string;
  audioAccent: string;
  audioCredit: string;
  meaningVi: string;
  explanationVi: string;
  sensesEn: { pos: string; gloss: string; example: string }[];
  sensesVi: { pos: string; text: string }[];
  forms: string[];
  etymology: string;
  examples: {
    en: string;
    vi: string;
    cefr: string;
    sourceId: string;
    attribution: string;
  }[];
};

export type VocabularyListRecord = {
  slug: string;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  cefr: string;
  topic: string;
  accent: string;
  icon: string;
  words: string[];
};

export type GrammarExerciseRecord = {
  type: string;
  skill: string;
  promptEn: string;
  promptVi: string;
  answer: string;
  options?: string[];
  context: string;
  explanationVi: string;
  cefr: string;
  attribution: string;
  displayOrder: number;
};

export type GrammarTopicRecord = {
  slug: string;
  titleVi: string;
  titleEn: string;
  cefr: string;
  category: string;
  summaryVi: string;
  theoryVi: string;
  patterns: { form: string; example: string; vi: string }[];
  pitfallsVi: string[];
  tipsVi: string[];
  criterialFeatures: { code: string; item: string; sentenceType: string; cefr: string }[];
  examples: { en: string; vi: string; level: string; credit: string }[];
  voaArticleId: string;
  voaArticleTitle: string;
  exercises: GrammarExerciseRecord[];
};

export type VoaArticleRecord = {
  id: string;
  series: string;
  seriesName: string;
  title: string;
  summary: string;
  sourceUrl: string;
  published: string;
  level: string;
  sections: string[];
  audioUrl: string;
  image: string;
  paragraphs: string[];
  wordCount: number;
  readingMinutes: number;
  glossary: { word: string; pos: string; definition: string }[];
};

export type SentenceRecord = {
  id: string;
  en: string;
  vi: string;
  level: string;
  credit: string;
};

export const content = {
  sources: () => loadContent<SourceRecord[]>('sources.json', []),
  vocabulary: () =>
    loadContent<{ items: VocabularyRecord[]; count: number }>('vocabulary/entries.json'),
  vocabularyLists: () =>
    loadContent<{ lists: VocabularyListRecord[] }>('vocabulary/lists.json'),
  grammar: () => loadContent<{ topics: GrammarTopicRecord[] }>('grammar/topics.json'),
  voa: () =>
    loadContent<{ articles: VoaArticleRecord[]; series: { key: string; name: string; nameVi: string; level: string; blurbVi: string }[] }>(
      'voa/articles.json',
    ),
  sentences: () => loadContent<{ sentences: SentenceRecord[] }>('sentences/tatoeba.json'),
};
