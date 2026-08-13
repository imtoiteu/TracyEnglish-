import type { VoaArticleRecord, VocabularyRecord } from './content';

/**
 * Building practice from real material.
 *
 * Every question below is derived from something a person wrote: the editor-written
 * glossary that ends each VOA article, the article's own sentences, or a bilingual sentence
 * pair from Tatoeba. Nothing is invented, and nothing is disconnected from the lesson —
 * a question about a listening piece asks about that listening piece.
 *
 * Where a construction would produce a bad question (a gap that leaves no evidence, a
 * distractor that is accidentally also correct) the builder returns nothing rather than
 * emitting a weak item.
 */

export type SeedExercise = {
  type: string;
  skill: string;
  cefr: string;
  difficulty: number;
  promptVi: string;
  promptEn: string;
  context: string;
  payload: Record<string, unknown>;
  answer: string;
  explanationVi: string;
  hintVi: string;
  points: number;
  displayOrder: number;
  attribution: string;
};

function base(order: number): Pick<SeedExercise, 'points' | 'displayOrder' | 'hintVi'> {
  return { points: 1, displayOrder: order, hintVi: '' };
}

/** Deterministic shuffle so a learner returning to a question sees the same order. */
function shuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let value = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 11);
  for (let i = out.length - 1; i > 0; i -= 1) {
    value = (value * 1103515245 + 12345) % 2147483648;
    const j = value % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------
// Glossary-based vocabulary questions
// ---------------------------------------------------------------------------

/**
 * "What does this word mean in this story?"
 *
 * The correct answer is VOA's own definition; the distractors are definitions of other
 * words from the *same* article, which keeps them plausible and on-topic without any
 * invention at all.
 */
export function glossaryDefinitionQuestions(
  article: VoaArticleRecord,
  skill: string,
  limit = 5,
): SeedExercise[] {
  const glossary = article.glossary.filter((g) => g.definition.length > 15);
  if (glossary.length < 4) return [];

  const out: SeedExercise[] = [];
  for (const entry of glossary.slice(0, limit)) {
    const others = glossary
      .filter((g) => g.word !== entry.word)
      .map((g) => g.definition)
      .slice(0, 6);
    const distractors = shuffle(others, entry.word).slice(0, 3);
    if (distractors.length < 2) continue;
    const options = shuffle([entry.definition, ...distractors], entry.word + article.id);

    out.push({
      ...base(out.length),
      type: 'MULTIPLE_CHOICE',
      skill,
      cefr: article.level,
      difficulty: 2,
      promptVi: `Trong bài này, “${entry.word}” nghĩa là gì?`,
      promptEn: `In this story, what does “${entry.word}” mean?`,
      context: '',
      payload: { options },
      answer: entry.definition,
      explanationVi:
        `Ban biên tập VOA giải thích “${entry.word}”${entry.pos ? ` (${entry.pos})` : ''} là: ` +
        `“${entry.definition}”.`,
      attribution: 'VOA Learning English — Words in This Story (public domain)',
    });
  }
  return out;
}

/**
 * "Complete the sentence from the story."
 *
 * The blanked word is one from the glossary, and the sentence is one the article really
 * contains — so the learner meets the word in the context it was taught in.
 */
export function glossaryGapFillQuestions(
  article: VoaArticleRecord,
  skill: string,
  limit = 4,
): SeedExercise[] {
  const out: SeedExercise[] = [];
  const sentences = article.paragraphs
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40 && sentence.length < 190);

  const used = new Set<string>();
  for (const entry of article.glossary) {
    if (out.length >= limit) break;
    const word = entry.word.trim();
    if (!word || word.includes(' ') || used.has(word)) continue;

    const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
    const sentence = sentences.find((candidate) => pattern.test(candidate));
    if (!sentence) continue;

    // Blank only the first occurrence; leaving later ones visible would give it away.
    const match = pattern.exec(sentence);
    if (!match) continue;
    const surface = match[0];
    const prompt =
      sentence.slice(0, match.index) + '_____' + sentence.slice(match.index + surface.length);
    if (pattern.test(prompt)) continue;

    used.add(word);
    out.push({
      ...base(out.length),
      type: 'GAP_FILL',
      skill,
      cefr: article.level,
      difficulty: 3,
      promptVi: 'Điền từ còn thiếu vào chỗ trống (dùng từ trong bài).',
      promptEn: prompt,
      context: entry.definition ? `Gợi ý: ${entry.definition}` : '',
      payload: {},
      answer: surface,
      explanationVi: `Từ đúng là “${surface}” — ${entry.definition}`,
      attribution: 'VOA Learning English (public domain)',
    });
  }
  return out;
}

/**
 * "Put the events in the order the article tells them."
 *
 * Ordering the opening sentences of consecutive paragraphs is a genuine comprehension task:
 * it can only be done by having followed the argument, and it needs no invented content.
 */
export function paragraphOrderQuestion(
  article: VoaArticleRecord,
  skill: string,
  order: number,
): SeedExercise | null {
  const openers = article.paragraphs
    .slice(0, 8)
    .map((paragraph) => paragraph.split(/(?<=[.!?])\s+/)[0]?.trim() ?? '')
    .filter((sentence) => sentence.length > 25 && sentence.length < 140);

  if (openers.length < 4) return null;
  const chosen = openers.slice(0, 4);
  const shuffled = shuffle(chosen, article.id);
  if (shuffled.join('|') === chosen.join('|')) shuffled.reverse();

  return {
    ...base(order),
    type: 'MATCHING',
    skill,
    cefr: article.level,
    difficulty: 3,
    promptVi: 'Nối mỗi câu với thứ tự xuất hiện của nó trong bài.',
    promptEn: 'Match each sentence to the order in which it appears.',
    context: '',
    payload: {
      pairs: chosen.map((sentence, index) => ({ left: sentence, right: `${index + 1}` })),
      options: shuffled,
    },
    answer: chosen.map((sentence, index) => `${sentence}→${index + 1}`).join('|'),
    explanationVi: 'Đọc lại bốn đoạn đầu của bài để kiểm tra thứ tự.',
    points: 2,
    attribution: 'VOA Learning English (public domain)',
  };
}

/**
 * A dictation item: listen to the clip and type a sentence from it.
 *
 * Only built when the article has audio, because dictation without audio is just copying.
 */
export function dictationQuestion(
  article: VoaArticleRecord,
  order: number,
): SeedExercise | null {
  if (!article.audioUrl) return null;
  const sentence = article.paragraphs
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
    .map((value) => value.trim())
    .find((value) => value.length > 35 && value.length < 110 && !value.includes('"'));
  if (!sentence) return null;

  return {
    ...base(order),
    type: 'DICTATION',
    skill: 'listening',
    cefr: article.level,
    difficulty: 4,
    promptVi: 'Nghe lại bài và chép chính xác câu mở đầu của đoạn được nhắc tới.',
    promptEn: 'Listen again and write the sentence you hear.',
    context: `${sentence.split(' ').length} từ`,
    payload: { audioUrl: article.audioUrl },
    answer: sentence,
    explanationVi: `Câu đầy đủ là: “${sentence}”`,
    points: 2,
    attribution: 'VOA Learning English (public domain)',
  };
}

// ---------------------------------------------------------------------------
// Vocabulary review questions
// ---------------------------------------------------------------------------

/**
 * Vocabulary practice for a word list.
 *
 * Three shapes, all drawn from the entry itself: English word → Vietnamese meaning,
 * Vietnamese meaning → English word, and a gap-fill using one of the word's real example
 * sentences.
 */
export function vocabularyQuestions(
  words: VocabularyRecord[],
  pool: VocabularyRecord[],
  cefr: string,
): SeedExercise[] {
  const out: SeedExercise[] = [];
  const usable = words.filter((word) => word.meaningVi);

  usable.slice(0, 8).forEach((word, index) => {
    const distractors = shuffle(
      pool.filter((other) => other.word !== word.word && other.cefr === word.cefr && other.meaningVi),
      word.word,
    )
      .slice(0, 3)
      .map((other) => other.meaningVi);
    if (distractors.length < 2) return;

    out.push({
      ...base(out.length),
      type: 'MULTIPLE_CHOICE',
      skill: 'vocabulary',
      cefr: word.cefr || cefr,
      difficulty: 2,
      promptVi: `“${word.word}” nghĩa là gì?`,
      promptEn: `What does “${word.word}” mean?`,
      context: word.ipaUk || word.ipaUs,
      payload: { options: shuffle([word.meaningVi, ...distractors], word.word + index) },
      answer: word.meaningVi,
      explanationVi: word.explanationVi
        ? `${word.word}: ${word.explanationVi}`
        : `${word.word} — ${word.meaningVi}`,
      attribution: 'Wiktionary tiếng Việt (CC BY-SA 4.0)',
    });
  });

  usable.slice(8, 14).forEach((word) => {
    const distractors = shuffle(
      pool.filter((other) => other.word !== word.word && other.cefr === word.cefr),
      word.word + 'r',
    )
      .slice(0, 3)
      .map((other) => other.word);
    if (distractors.length < 2) return;

    out.push({
      ...base(out.length),
      type: 'MULTIPLE_CHOICE',
      skill: 'vocabulary',
      cefr: word.cefr || cefr,
      difficulty: 3,
      promptVi: `Từ tiếng Anh nào có nghĩa “${word.meaningVi}”?`,
      promptEn: `Which English word means “${word.meaningVi}”?`,
      context: '',
      payload: { options: shuffle([word.word, ...distractors], word.word + 'rev') },
      answer: word.word,
      explanationVi: `“${word.meaningVi}” là nghĩa của **${word.word}**${word.ipaUk ? ` ${word.ipaUk}` : ''}.`,
      attribution: 'Wiktionary tiếng Việt (CC BY-SA 4.0)',
    });
  });

  // Gap-fill from a real example sentence: the strongest evidence that a learner can use
  // the word rather than merely recognise it.
  usable.forEach((word) => {
    if (out.length >= 22) return;
    const example = word.examples.find(
      (candidate) =>
        new RegExp(`\\b${escapeRegExp(word.word)}\\b`, 'i').test(candidate.en) &&
        candidate.en.length < 140,
    );
    if (!example) return;
    const pattern = new RegExp(`\\b${escapeRegExp(word.word)}\\b`, 'i');
    const match = pattern.exec(example.en);
    if (!match) return;
    const prompt =
      example.en.slice(0, match.index) + '_____' + example.en.slice(match.index + match[0].length);

    out.push({
      ...base(out.length),
      type: 'GAP_FILL',
      skill: 'vocabulary',
      cefr: example.cefr || word.cefr,
      difficulty: 3,
      promptVi: 'Điền từ thích hợp vào chỗ trống.',
      promptEn: prompt,
      context: example.vi,
      payload: {},
      answer: match[0],
      explanationVi: `Câu đầy đủ: “${example.en}” — ${example.vi}`,
      attribution: example.attribution,
    });
  });

  return out.map((exercise, index) => ({ ...exercise, displayOrder: index }));
}
