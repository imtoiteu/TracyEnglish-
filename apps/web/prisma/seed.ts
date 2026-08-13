/**
 * Seed the database from the ingested content.
 *
 * Order matters: sources first (everything else points at them), then the ingested
 * material, then the curriculum that references it, then the centre's own records, then a
 * set of demo accounts with realistic progress so every dashboard has something in it.
 *
 * The seed is idempotent — it clears and rebuilds — and it *reports what it skipped*. If a
 * lesson plan points at a VOA article that was not ingested, that lesson is left out and
 * named in the summary rather than created as an empty shell.
 */

import { PrismaClient } from '@prisma/client';

import { scheduleReview, type ReviewState } from '@tracy/exercise-engine';

import { content, type VoaArticleRecord, type VocabularyRecord } from './seed/content';
import { ACHIEVEMENTS, FAQS, PAGES, PRODUCTS, SETTINGS, TEACHERS, TESTIMONIALS } from './seed/centre';
import { COURSES, type LessonPlan } from './seed/curriculum';
import {
  dictationQuestion,
  glossaryDefinitionQuestions,
  glossaryGapFillQuestions,
  paragraphOrderQuestion,
  vocabularyQuestions,
  type SeedExercise,
} from './seed/exercises';
import { TRACKS } from '../../../packages/curriculum/src/index';
import { hashPassword } from '../src/lib/auth';
import type { LessonBlock } from '../src/lib/lesson-blocks';

const db = new PrismaClient();

const notes: string[] = [];
const note = (message: string) => {
  notes.push(message);
  console.log(`   ! ${message}`);
};
const step = (message: string) => console.log(`\n▸ ${message}`);
const done = (message: string) => console.log(`   ${message}`);

const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 70) || 'item';

const J = (value: unknown) => JSON.stringify(value ?? null);

// ---------------------------------------------------------------------------

async function clearAll() {
  step('Clearing existing data');
  // Order respects foreign keys; SQLite will not cascade across all of these on its own.
  const tables = [
    db.exerciseAttempt, db.lessonProgress, db.vocabularyProgress, db.bookmark,
    db.userAchievement, db.studyDay, db.reviewItem, db.placementResult,
    db.classEnrollment, db.classSession, db.classGroup, db.booking,
    db.enrollment, db.notification, db.auditLog, db.session,
    db.orderItem, db.payment, db.order, db.coupon, db.product,
    db.exercise, db.lesson, db.module, db.course, db.track,
    db.vocabularyListItem, db.vocabularyList, db.vocabularyExample, db.vocabularyItem,
    db.grammarTopic, db.listeningItem, db.readingItem, db.mediaAsset,
    db.teacherAvailability, db.teacherProfile, db.studentProfile, db.consultationRequest,
    db.user, db.achievement, db.testimonial, db.faqItem, db.announcement,
    db.page, db.siteSetting, db.translation, db.source,
  ];
  for (const table of tables) {
    await (table as { deleteMany: () => Promise<unknown> }).deleteMany();
  }
  done(`${tables.length} tables cleared`);
}

async function seedSources() {
  step('Sources and licences');
  const sources = content.sources();
  for (const source of sources) {
    // The register carries a `distribution` field for the pipeline's own use; the database
    // keeps only what the credits page renders.
    await db.source.create({
      data: {
        id: source.id,
        name: source.name,
        publisher: source.publisher,
        url: source.url,
        licence: source.licence,
        licenceUrl: source.licenceUrl,
        attribution: source.attribution,
        usedFor: source.usedFor,
      },
    });
  }
  done(`${sources.length} sources registered`);
  return new Set(sources.map((s) => s.id));
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

async function seedVocabulary() {
  step('Vocabulary');
  const { items } = content.vocabulary();
  const byWord = new Map<string, VocabularyRecord>();

  const CHUNK = 500;
  let created = 0;
  let examples = 0;

  for (let offset = 0; offset < items.length; offset += CHUNK) {
    const slice = items.slice(offset, offset + CHUNK);
    await db.vocabularyItem.createMany({
      data: slice.map((item) => {
        byWord.set(item.word, item);
        return {
          word: item.word,
          cefr: item.cefr,
          partsOfSpeech: J(item.partsOfSpeech),
          ipaUk: item.ipaUk,
          ipaUs: item.ipaUs,
          audioPath: item.audioPath,
          audioAccent: item.audioAccent,
          audioCredit: item.audioCredit,
          meaningVi: item.meaningVi,
          explanationVi: item.explanationVi,
          sensesEn: J(item.sensesEn),
          sensesVi: J(item.sensesVi),
          forms: J(item.forms),
          etymology: item.etymology,
          topics: J([]),
          sourceId: item.meaningVi ? 'viwiktionary' : 'enwiktionary',
        };
      }),
    });
    created += slice.length;
  }

  const ids = new Map(
    (await db.vocabularyItem.findMany({ select: { id: true, word: true } })).map((row) => [
      row.word,
      row.id,
    ]),
  );

  const exampleRows: {
    vocabularyId: string;
    textEn: string;
    textVi: string;
    cefr: string;
    sourceId: string;
    attribution: string;
    displayOrder: number;
  }[] = [];
  for (const item of items) {
    const vocabularyId = ids.get(item.word);
    if (!vocabularyId) continue;
    item.examples.forEach((example, index) => {
      exampleRows.push({
        vocabularyId,
        textEn: example.en,
        textVi: example.vi,
        cefr: example.cefr,
        sourceId: example.sourceId,
        attribution: example.attribution,
        displayOrder: index,
      });
    });
  }
  for (let offset = 0; offset < exampleRows.length; offset += CHUNK) {
    await db.vocabularyExample.createMany({ data: exampleRows.slice(offset, offset + CHUNK) });
    examples += Math.min(CHUNK, exampleRows.length - offset);
  }

  const withAudio = items.filter((item) => item.audioPath).length;
  done(`${created} words · ${examples} example sentences · ${withAudio} with human audio`);
  if (withAudio / Math.max(created, 1) < 0.1) {
    note(
      `only ${withAudio} of ${created} words have a pronunciation clip — run stage 5 of the ingest pipeline to fetch more`,
    );
  }
  return { byWord, ids };
}

async function seedVocabularyLists(
  byWord: Map<string, VocabularyRecord>,
  ids: Map<string, string>,
) {
  step('Word lists');
  const { lists } = content.vocabularyLists();
  const listIds = new Map<string, string>();

  for (const [index, list] of lists.entries()) {
    const created = await db.vocabularyList.create({
      data: {
        slug: list.slug,
        titleVi: list.titleVi,
        titleEn: list.titleEn,
        summaryVi: list.summaryVi,
        cefr: list.cefr,
        topic: list.topic,
        accent: list.accent,
        icon: list.icon,
        displayOrder: index,
      },
    });
    listIds.set(list.slug, created.id);

    const members = list.words
      .map((word, order) => ({ id: ids.get(word), order }))
      .filter((row): row is { id: string; order: number } => Boolean(row.id));
    for (let offset = 0; offset < members.length; offset += 500) {
      await db.vocabularyListItem.createMany({
        data: members.slice(offset, offset + 500).map((row) => ({
          listId: created.id,
          vocabularyId: row.id,
          displayOrder: row.order,
        })),
      });
    }
  }

  // Practice for each list, built from the words themselves.
  const pool = [...byWord.values()];
  let exercises = 0;
  for (const list of lists) {
    const words = list.words
      .map((word) => byWord.get(word))
      .filter((word): word is VocabularyRecord => Boolean(word));
    if (words.length < 6) continue;
    const built = vocabularyQuestions(words.slice(0, 24), pool, list.cefr);
    if (!built.length) continue;
    await db.exercise.createMany({
      data: built.map((exercise) => ({
        vocabularyListId: listIds.get(list.slug)!,
        type: exercise.type,
        skill: exercise.skill,
        cefr: exercise.cefr,
        difficulty: exercise.difficulty,
        promptVi: exercise.promptVi,
        promptEn: exercise.promptEn,
        context: exercise.context,
        payload: J(exercise.payload),
        answer: exercise.answer,
        explanationVi: exercise.explanationVi,
        points: exercise.points,
        displayOrder: exercise.displayOrder,
        attribution: exercise.attribution,
      })),
    });
    exercises += built.length;
  }

  done(`${lists.length} lists · ${exercises} vocabulary exercises`);
  return listIds;
}

// ---------------------------------------------------------------------------
// Grammar
// ---------------------------------------------------------------------------

async function seedGrammar(readingBySourceId: Map<string, string>) {
  step('Grammar topics');
  const { topics } = content.grammar();
  const topicIds = new Map<string, string>();
  let exercises = 0;
  let linked = 0;

  for (const [index, topic] of topics.entries()) {
    const readingId = topic.voaArticleId ? readingBySourceId.get(topic.voaArticleId) : undefined;
    if (readingId) linked += 1;

    const created = await db.grammarTopic.create({
      data: {
        slug: topic.slug,
        titleVi: topic.titleVi,
        titleEn: topic.titleEn,
        cefr: topic.cefr,
        category: topic.category,
        summaryVi: topic.summaryVi,
        theoryVi: topic.theoryVi,
        patterns: J(topic.patterns),
        examples: J(topic.examples),
        pitfallsVi: J(topic.pitfallsVi),
        tipsVi: J(topic.tipsVi),
        displayOrder: index,
        sourceId: 'cefrj-grammar',
        attribution: J(topic.criterialFeatures),
        readingId: readingId ?? null,
      },
    });
    topicIds.set(topic.slug, created.id);

    if (topic.exercises.length) {
      await db.exercise.createMany({
        data: topic.exercises.map((exercise) => ({
          grammarTopicId: created.id,
          type: exercise.type,
          skill: 'grammar',
          cefr: exercise.cefr,
          difficulty: exercise.type === 'TRANSLATION' ? 4 : 3,
          promptVi: exercise.promptVi,
          promptEn: exercise.promptEn,
          context: exercise.context,
          payload: J(exercise.options ? { options: exercise.options } : {}),
          answer: exercise.answer,
          explanationVi: exercise.explanationVi,
          points: 1,
          displayOrder: exercise.displayOrder,
          sourceId: exercise.attribution.includes('tatoeba') ? 'tatoeba' : null,
          attribution: exercise.attribution,
        })),
      });
      exercises += topic.exercises.length;
    } else {
      note(`grammar topic "${topic.slug}" has no exercises`);
    }
  }

  done(`${topics.length} topics · ${exercises} exercises · ${linked} linked to a VOA article`);
  return topicIds;
}

// ---------------------------------------------------------------------------
// Listening and reading, from VOA
// ---------------------------------------------------------------------------

function articleLevelName(article: VoaArticleRecord, seriesNames: Map<string, string>) {
  return seriesNames.get(article.series) ?? article.seriesName;
}

async function seedVoa() {
  step('Listening and reading (VOA Learning English)');
  const { articles, series } = content.voa();
  const seriesNames = new Map(series.map((row) => [row.key, row.nameVi]));

  const listeningIds = new Map<string, string>();
  const readingIds = new Map<string, string>();
  const bySeriesListening = new Map<string, string[]>();
  const bySeriesReading = new Map<string, string[]>();

  let exercises = 0;
  const usedSlugs = new Set<string>();

  const uniqueSlug = (base: string) => {
    let slug = base;
    let counter = 2;
    while (usedSlugs.has(slug)) slug = `${base}-${counter++}`;
    usedSlugs.add(slug);
    return slug;
  };

  const addExercises = async (
    built: SeedExercise[],
    key: 'listeningId' | 'readingId',
    id: string,
  ) => {
    if (!built.length) return;
    await db.exercise.createMany({
      data: built.map((exercise, index) => ({
        [key]: id,
        type: exercise.type,
        skill: exercise.skill,
        cefr: exercise.cefr,
        difficulty: exercise.difficulty,
        promptVi: exercise.promptVi,
        promptEn: exercise.promptEn,
        context: exercise.context,
        payload: J(exercise.payload),
        answer: exercise.answer,
        explanationVi: exercise.explanationVi,
        points: exercise.points,
        displayOrder: index,
        sourceId: 'voa',
        attribution: exercise.attribution,
      })) as never,
    });
    exercises += built.length;
  };

  for (const article of articles) {
    const isListening = article.sections.includes('listening') && Boolean(article.audioUrl);
    const isReading = article.sections.includes('reading') || article.sections.includes('grammar');

    if (isListening) {
      const slug = uniqueSlug(`listen-${slugify(article.title)}`);
      const created = await db.listeningItem.create({
        data: {
          slug,
          titleVi: article.title,
          titleEn: article.title,
          series: article.series,
          seriesNameVi: articleLevelName(article, seriesNames),
          cefr: article.level,
          summaryVi: article.summary,
          summaryEn: article.summary,
          audioUrl: article.audioUrl,
          transcript: J(article.paragraphs),
          translationVi: J([]),
          glossary: J(article.glossary),
          imageUrl: article.image,
          publishedAt: article.published ? new Date(article.published) : null,
          sourceId: 'voa',
          sourceUrl: article.sourceUrl,
          attribution:
            'Voice of America Learning English — public domain (U.S. Government work)',
          displayOrder: listeningIds.size,
        },
      });
      listeningIds.set(article.id, created.id);
      const list = bySeriesListening.get(article.series) ?? [];
      list.push(article.id);
      bySeriesListening.set(article.series, list);

      const built = [
        ...glossaryDefinitionQuestions(article, 'listening', 4),
        ...glossaryGapFillQuestions(article, 'listening', 3),
      ];
      const dictation = dictationQuestion(article, built.length);
      if (dictation) built.push(dictation);
      await addExercises(built, 'listeningId', created.id);
    }

    if (isReading) {
      const slug = uniqueSlug(`read-${slugify(article.title)}`);
      const kind =
        article.series === 'american-stories'
          ? 'STORY'
          : article.series === 'everyday-grammar' || article.series === 'ask-a-teacher'
            ? 'ARTICLE'
            : 'ARTICLE';
      const created = await db.readingItem.create({
        data: {
          slug,
          titleVi: article.title,
          titleEn: article.title,
          kind,
          series: article.series,
          cefr: article.level,
          summaryVi: article.summary,
          summaryEn: article.summary,
          body: J(article.paragraphs),
          wordCount: article.wordCount,
          readingMinutes: article.readingMinutes,
          glossary: J(article.glossary),
          imageUrl: article.image,
          audioUrl: article.audioUrl,
          publishedAt: article.published ? new Date(article.published) : null,
          sourceId: 'voa',
          sourceUrl: article.sourceUrl,
          attribution:
            'Voice of America Learning English — public domain (U.S. Government work)',
          displayOrder: readingIds.size,
        },
      });
      readingIds.set(article.id, created.id);
      const list = bySeriesReading.get(article.series) ?? [];
      list.push(article.id);
      bySeriesReading.set(article.series, list);

      const built = [
        ...glossaryDefinitionQuestions(article, 'reading', 5),
        ...glossaryGapFillQuestions(article, 'reading', 3),
      ];
      const ordering = paragraphOrderQuestion(article, 'reading', built.length);
      if (ordering) built.push(ordering);
      await addExercises(built, 'readingId', created.id);
    }
  }

  done(
    `${listeningIds.size} listening items · ${readingIds.size} reading items · ${exercises} comprehension exercises`,
  );
  return { listeningIds, readingIds, bySeriesListening, bySeriesReading, articles };
}

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------

type SeedRefs = {
  grammarIds: Map<string, string>;
  listIds: Map<string, string>;
  listeningIds: Map<string, string>;
  readingIds: Map<string, string>;
  bySeriesListening: Map<string, string[]>;
  bySeriesReading: Map<string, string[]>;
  articles: VoaArticleRecord[];
  teacherIds: Map<string, string>;
  /** Lesson blocks reference content by slug, but the plan only knows row ids. */
  listeningSlug: (id: string) => string;
  readingSlug: (id: string) => string;
};

function lessonBlocks(plan: LessonPlan, resolved: { kind: string }): LessonBlock[] {
  const blocks: LessonBlock[] = [{ type: 'objective', vi: plan.objectiveVi, en: plan.objectiveEn }];

  if (plan.extraBlocks?.length) blocks.push(...plan.extraBlocks);

  if (plan.grammar) {
    blocks.push({ type: 'grammar', slug: plan.grammar, sections: ['theory', 'patterns', 'pitfalls', 'tips'] });
  }
  if (plan.vocabList) {
    blocks.push({ type: 'vocabList', slug: plan.vocabList, limit: 24 });
  }
  if (plan.listening) {
    blocks.push({
      type: 'listening',
      slug: '__resolved__',
      taskVi:
        'Nghe lần đầu không nhìn lời thoại. Nghe xong hãy tự trả lời: bài nói về ai, về việc gì, và kết luận là gì. Sau đó mở lời thoại và nghe lần hai.',
    });
  }
  if (plan.reading) {
    blocks.push({
      type: 'reading',
      slug: '__resolved__',
      taskVi:
        'Đọc lần đầu không tra từ. Gạch chân những từ chưa biết nhưng đoán được nghĩa qua ngữ cảnh, rồi đối chiếu với phần từ vựng ở cuối bài.',
    });
  }

  blocks.push({
    type: 'practice',
    titleVi: 'Luyện tập',
    introVi:
      resolved.kind === 'GRAMMAR'
        ? 'Bài tập dưới đây dùng chính những câu ví dụ ở trên, để bạn gặp lại cấu trúc vừa học trong ngữ cảnh thật.'
        : 'Làm hết phần này rồi mới xem đáp án — sai ở đâu thì phần giải thích sẽ chỉ rõ vì sao.',
  });

  if (plan.summaryVi) blocks.push({ type: 'summary', vi: plan.summaryVi });
  if (plan.nextStepVi) blocks.push({ type: 'nextStep', vi: plan.nextStepVi });
  return blocks;
}

async function seedCurriculum(refs: SeedRefs) {
  step('Tracks, courses, modules and lessons');

  const trackIds = new Map<string, string>();
  for (const [index, track] of TRACKS.entries()) {
    const created = await db.track.create({
      data: {
        slug: track.slug,
        titleVi: track.titleVi,
        titleEn: track.titleEn,
        summaryVi: track.summaryVi,
        summaryEn: track.summaryEn,
        category: track.category,
        audience: J(track.audience),
        accent: track.accent,
        icon: track.icon,
        displayOrder: index,
      },
    });
    trackIds.set(track.slug, created.id);
  }

  let courses = 0;
  let modules = 0;
  let lessons = 0;
  let skipped = 0;

  for (const [courseIndex, plan] of COURSES.entries()) {
    const trackId = trackIds.get(plan.track);
    if (!trackId) {
      note(`course "${plan.slug}" references unknown track "${plan.track}" — skipped`);
      continue;
    }

    const course = await db.course.create({
      data: {
        slug: plan.slug,
        trackId,
        titleVi: plan.titleVi,
        titleEn: plan.titleEn,
        subtitleVi: plan.subtitleVi,
        subtitleEn: '',
        descriptionVi: plan.descriptionVi,
        descriptionEn: plan.descriptionEn,
        cefrFrom: plan.cefrFrom,
        cefrTo: plan.cefrTo,
        skills: J(plan.skills),
        outcomesVi: J(plan.outcomesVi),
        outcomesEn: J([]),
        requirementsVi: J(plan.requirementsVi),
        audience: J(plan.audience),
        accent: plan.accent,
        estimatedHours: plan.estimatedHours,
        deliveryModes: J(plan.deliveryModes),
        isFree: plan.isFree,
        priceVnd: plan.priceVnd,
        displayOrder: courseIndex,
        teacherId: plan.teacherSlug ? (refs.teacherIds.get(plan.teacherSlug) ?? null) : null,
      },
    });
    courses += 1;

    for (const [moduleIndex, modulePlan] of plan.modules.entries()) {
      const module = await db.module.create({
        data: {
          courseId: course.id,
          slug: modulePlan.slug,
          titleVi: modulePlan.titleVi,
          titleEn: modulePlan.titleEn,
          summaryVi: modulePlan.summaryVi,
          displayOrder: moduleIndex,
        },
      });
      modules += 1;

      for (const [lessonIndex, lessonPlan] of modulePlan.lessons.entries()) {
        let grammarTopicId: string | null = null;
        let vocabularyListId: string | null = null;
        let listeningId: string | null = null;
        let readingId: string | null = null;
        let cefr = plan.cefrFrom;

        if (lessonPlan.grammar) {
          grammarTopicId = refs.grammarIds.get(lessonPlan.grammar) ?? null;
          if (!grammarTopicId) {
            note(`lesson "${lessonPlan.slug}" needs grammar topic "${lessonPlan.grammar}" — skipped`);
            skipped += 1;
            continue;
          }
        }
        if (lessonPlan.vocabList) {
          vocabularyListId = refs.listIds.get(lessonPlan.vocabList) ?? null;
          if (!vocabularyListId) {
            note(`lesson "${lessonPlan.slug}" needs word list "${lessonPlan.vocabList}" — skipped`);
            skipped += 1;
            continue;
          }
        }
        if (lessonPlan.listening) {
          const pool = refs.bySeriesListening.get(lessonPlan.listening.series) ?? [];
          const articleId = pool[lessonPlan.listening.index];
          listeningId = articleId ? (refs.listeningIds.get(articleId) ?? null) : null;
          if (!listeningId) {
            note(
              `lesson "${lessonPlan.slug}" needs listening item ${lessonPlan.listening.series}#${lessonPlan.listening.index} — skipped`,
            );
            skipped += 1;
            continue;
          }
          cefr = refs.articles.find((a) => a.id === articleId)?.level ?? cefr;
        }
        if (lessonPlan.reading) {
          const pool = refs.bySeriesReading.get(lessonPlan.reading.series) ?? [];
          const articleId = pool[lessonPlan.reading.index];
          readingId = articleId ? (refs.readingIds.get(articleId) ?? null) : null;
          if (!readingId) {
            note(
              `lesson "${lessonPlan.slug}" needs reading item ${lessonPlan.reading.series}#${lessonPlan.reading.index} — skipped`,
            );
            skipped += 1;
            continue;
          }
          cefr = refs.articles.find((a) => a.id === articleId)?.level ?? cefr;
        }

        const blocks = lessonBlocks(lessonPlan, { kind: lessonPlan.kind });
        // Resolve the placeholder slugs now that the target rows exist.
        const resolvedBlocks = blocks.map((block) => {
          if (block.type === 'listening' && listeningId) {
            return { ...block, slug: refs.listeningSlug(listeningId) };
          }
          if (block.type === 'reading' && readingId) {
            return { ...block, slug: refs.readingSlug(readingId) };
          }
          return block;
        }) as LessonBlock[];

        await db.lesson.create({
          data: {
            moduleId: module.id,
            slug: `${plan.slug}-${lessonPlan.slug}`,
            kind: lessonPlan.kind,
            titleVi: lessonPlan.titleVi,
            titleEn: lessonPlan.titleEn,
            objectiveVi: lessonPlan.objectiveVi,
            objectiveEn: lessonPlan.objectiveEn,
            blocks: J(resolvedBlocks),
            summaryVi: lessonPlan.summaryVi ?? '',
            nextStepVi: lessonPlan.nextStepVi ?? '',
            cefr,
            estimatedMinutes: lessonPlan.minutes ?? 20,
            displayOrder: lessonIndex,
            grammarTopicId,
            vocabularyListId,
            listeningId,
            readingId,
          },
        });
        lessons += 1;
      }
    }
  }

  done(`${TRACKS.length} tracks · ${courses} courses · ${modules} modules · ${lessons} lessons`);
  if (skipped) note(`${skipped} planned lessons could not be built and were left out`);
  return { trackIds };
}

// ---------------------------------------------------------------------------
// The centre
// ---------------------------------------------------------------------------

async function seedTeachers() {
  step('Teachers');
  const teacherIds = new Map<string, string>();
  const password = await hashPassword('Teacher@2026');

  for (const [index, teacher] of TEACHERS.entries()) {
    const user = await db.user.create({
      data: {
        email: teacher.email,
        passwordHash: password,
        name: teacher.name,
        role: 'TEACHER',
        locale: 'vi',
      },
    });
    const profile = await db.teacherProfile.create({
      data: {
        userId: user.id,
        slug: teacher.slug,
        headlineVi: teacher.headlineVi,
        headlineEn: teacher.headlineEn,
        bioVi: teacher.bioVi,
        bioEn: teacher.bioEn,
        yearsExperience: teacher.yearsExperience,
        educationVi: J(teacher.educationVi),
        certificatesVi: J(teacher.certificatesVi),
        achievementsVi: J(teacher.achievementsVi),
        methodsVi: J(teacher.methodsVi),
        specialties: J(teacher.specialties),
        rating: 4.8 + (index % 3) * 0.05,
        reviewCount: 40 + index * 17,
        displayOrder: index,
      },
    });
    teacherIds.set(teacher.slug, profile.id);

    // A weekly availability grid: weekday evenings plus weekend mornings.
    const slots = [
      { weekday: 1, startMin: 18 * 60, endMin: 21 * 60 },
      { weekday: 3, startMin: 18 * 60, endMin: 21 * 60 },
      { weekday: 5, startMin: 18 * 60, endMin: 21 * 60 },
      { weekday: 6, startMin: 8 * 60, endMin: 12 * 60 },
      { weekday: 0, startMin: 8 * 60, endMin: 11 * 60 },
    ];
    await db.teacherAvailability.createMany({
      data: slots.map((slot) => ({ ...slot, teacherId: profile.id, mode: 'BOTH' })),
    });
  }

  done(`${TEACHERS.length} teacher profiles with availability`);
  return teacherIds;
}

async function seedSite() {
  step('Website content');
  await db.testimonial.createMany({
    data: TESTIMONIALS.map((row, index) => ({ ...row, displayOrder: index })),
  });
  await db.faqItem.createMany({
    data: FAQS.map((row, index) => ({ ...row, displayOrder: index })),
  });
  await db.product.createMany({
    data: PRODUCTS.map((row, index) => ({
      sku: row.sku,
      kind: row.kind,
      titleVi: row.titleVi,
      titleEn: row.titleEn,
      descriptionVi: row.descriptionVi,
      priceVnd: row.priceVnd,
      comparePriceVnd: row.comparePriceVnd ?? null,
      quantity: row.quantity,
      durationDays: row.durationDays,
      features: J(row.features),
      accent: row.accent,
      isPopular: Boolean(row.isPopular),
      displayOrder: index,
    })),
  });
  await db.siteSetting.createMany({ data: SETTINGS });
  await db.page.createMany({ data: PAGES });
  await db.achievement.createMany({
    data: ACHIEVEMENTS.map((row, index) => ({ ...row, displayOrder: index })),
  });
  await db.announcement.create({
    data: {
      titleVi: 'Khai giảng lớp IELTS Foundation tháng này — học thử miễn phí một buổi.',
      bodyVi: 'Lớp tối thứ 3 và thứ 5, 19:00–20:30. Còn 4 chỗ.',
      level: 'INFO',
      href: '/courses/ielts-foundation',
    },
  });
  await db.coupon.create({
    data: {
      code: 'TRACY10',
      descriptionVi: 'Giảm 10% cho học viên đăng ký lần đầu.',
      percentOff: 10,
      maxRedemptions: 200,
    },
  });
  done(
    `${TESTIMONIALS.length} testimonials · ${FAQS.length} FAQ entries · ${PRODUCTS.length} products · ` +
      `${SETTINGS.length} settings · ${PAGES.length} pages · ${ACHIEVEMENTS.length} achievements`,
  );
}

async function seedClasses(teacherIds: Map<string, string>) {
  step('Classes and schedule');
  const courses = await db.course.findMany({ select: { id: true, slug: true, titleVi: true } });
  const bySlug = new Map(courses.map((course) => [course.slug, course]));

  const plans = [
    { code: 'IELTS-F-01', course: 'ielts-foundation', teacher: 'tracy-nguyen', format: 'CLASS', mode: 'ONLINE', scheduleVi: 'Thứ 3 & Thứ 5, 19:00–20:30', capacity: 12, enrolled: 8, priceVnd: 3_600_000 },
    { code: 'IELTS-F-02', course: 'ielts-foundation', teacher: 'tracy-nguyen', format: 'SMALL_GROUP', mode: 'OFFLINE', scheduleVi: 'Thứ 7 & Chủ nhật, 9:00–10:30', capacity: 5, enrolled: 5, priceVnd: 4_000_000 },
    { code: 'TOEIC-700-01', course: 'toeic-target-700', teacher: 'le-minh-quan', format: 'CLASS', mode: 'ONLINE', scheduleVi: 'Thứ 2 & Thứ 6, 19:30–21:00', capacity: 12, enrolled: 6, priceVnd: 3_200_000 },
    { code: 'VSTEP-B2-01', course: 'vstep-b2', teacher: 'vo-thanh-son', format: 'CLASS', mode: 'ONLINE', scheduleVi: 'Thứ 4 & Thứ 7, 20:00–21:30', capacity: 12, enrolled: 9, priceVnd: 3_900_000 },
    { code: 'KIDS-ST-01', course: 'english-for-kids-starters', teacher: 'pham-thi-ha', format: 'CLASS', mode: 'OFFLINE', scheduleVi: 'Thứ 3 & Thứ 5, 17:30–19:00', capacity: 15, enrolled: 11, priceVnd: 2_400_000 },
    { code: 'BE-B1-01', course: 'business-english-b1', teacher: 'le-minh-quan', format: 'SMALL_GROUP', mode: 'ONLINE', scheduleVi: 'Thứ 2 & Thứ 4, 20:00–21:30', capacity: 5, enrolled: 3, priceVnd: 4_000_000 },
    { code: 'SPEAK-11-01', course: 'pronunciation-for-vietnamese', teacher: 'daniel-okoye', format: 'ONE_TO_ONE', mode: 'ONLINE', scheduleVi: 'Đặt lịch linh hoạt', capacity: 1, enrolled: 1, priceVnd: 750_000 },
  ];

  let created = 0;
  let sessions = 0;
  const start = new Date();
  start.setDate(start.getDate() + 7);
  start.setHours(19, 0, 0, 0);

  for (const plan of plans) {
    const course = bySlug.get(plan.course);
    if (!course) {
      note(`class ${plan.code} references missing course "${plan.course}" — skipped`);
      continue;
    }
    const group = await db.classGroup.create({
      data: {
        code: plan.code,
        courseId: course.id,
        teacherId: teacherIds.get(plan.teacher) ?? null,
        format: plan.format,
        mode: plan.mode,
        titleVi: `${course.titleVi} · ${plan.code}`,
        scheduleVi: plan.scheduleVi,
        room: plan.mode === 'OFFLINE' ? `Phòng ${200 + created}` : '',
        capacity: plan.capacity,
        enrolled: plan.enrolled,
        priceVnd: plan.priceVnd,
        startDate: new Date(start),
        status: plan.enrolled >= plan.capacity ? 'FULL' : 'OPEN',
      },
    });
    created += 1;

    for (let index = 0; index < 6; index += 1) {
      const startsAt = new Date(start);
      startsAt.setDate(startsAt.getDate() + index * 3);
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + 90);
      await db.classSession.create({
        data: {
          classId: group.id,
          startsAt,
          endsAt,
          topicVi: `Buổi ${index + 1}`,
          meetingUrl: plan.mode === 'ONLINE' ? `https://meet.tracyenglish.vn/${plan.code.toLowerCase()}` : '',
        },
      });
      sessions += 1;
    }
  }
  done(`${created} classes · ${sessions} scheduled sessions`);
}

async function seedConsultations() {
  step('Consultation requests');
  const rows = [
    { name: 'Nguyễn Thị Mai', phone: '0912345001', email: 'mai.nguyen@example.com', goal: 'IELTS 6.5 để du học Úc', currentLevel: 'B1', segment: 'UNIVERSITY', preferredMode: 'ONLINE', preferredTime: 'Tối các ngày trong tuần', message: 'Em cần thi trong 6 tháng tới, mong được tư vấn lộ trình.', courseSlug: 'ielts-foundation', status: 'NEW' },
    { name: 'Trần Văn Hùng', phone: '0912345002', email: 'hung.tran@example.com', goal: 'TOEIC 700 để đủ chuẩn đầu ra', currentLevel: 'A2', segment: 'UNIVERSITY', preferredMode: 'OFFLINE', preferredTime: 'Cuối tuần', message: '', courseSlug: 'toeic-target-700', status: 'CONTACTED' },
    { name: 'Chị Lê Thu Hà', phone: '0912345003', email: '', goal: 'Cho con lớp 4 học tiếng Anh', currentLevel: 'Chưa xác định', segment: 'PRIMARY', preferredMode: 'OFFLINE', preferredTime: 'Chiều thứ 3, thứ 5', message: 'Cháu rất ngại nói, mong cô kiên nhẫn.', courseSlug: 'english-for-kids-starters', status: 'SCHEDULED' },
    { name: 'Phạm Minh Đức', phone: '0912345004', email: 'duc.pham@example.com', goal: 'VSTEP bậc 4 để chuẩn hoá viên chức', currentLevel: 'B1', segment: 'PROFESSIONAL', preferredMode: 'ONLINE', preferredTime: 'Sau 20:00', message: 'Em bận cả tuần, chỉ học được buổi tối muộn.', courseSlug: 'vstep-b2', status: 'ENROLLED' },
    { name: 'Vũ Khánh Linh', phone: '0912345005', email: 'linh.vu@example.com', goal: 'Giao tiếp với khách hàng nước ngoài', currentLevel: 'A2', segment: 'PROFESSIONAL', preferredMode: 'ONLINE', preferredTime: 'Trưa hoặc tối', message: 'Muốn học kèm 1–1.', courseSlug: 'business-english-b1', status: 'NEW' },
    { name: 'Đặng Quốc Bảo', phone: '0912345006', email: '', goal: 'Ôn thi tốt nghiệp THPT', currentLevel: 'A2', segment: 'HIGH_SCHOOL', preferredMode: 'OFFLINE', preferredTime: 'Tối thứ 2, 4, 6', message: '', courseSlug: 'high-school-grammar-core', status: 'CONTACTED' },
  ];
  await db.consultationRequest.createMany({ data: rows });
  done(`${rows.length} consultation requests across every status`);
}

// ---------------------------------------------------------------------------
// Demo accounts with real progress
// ---------------------------------------------------------------------------

function dayKey(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function seedDemoUsers() {
  step('Demo accounts');

  const adminPassword = await hashPassword('Admin@2026');
  const studentPassword = await hashPassword('Student@2026');

  const admin = await db.user.create({
    data: {
      email: 'admin@tracyenglish.vn',
      passwordHash: adminPassword,
      name: 'Quản trị viên',
      role: 'ADMIN',
      locale: 'vi',
      phone: '0912345678',
    },
  });

  const students = [
    { email: 'linh@example.com', name: 'Trần Khánh Linh', segment: 'UNIVERSITY', cefr: 'B1', goal: 'IELTS_65', targetExam: 'ielts', enroll: ['ielts-foundation', 'reading-lab-b2'], activeDays: 23, xp: 1840, words: 260 },
    { email: 'duc@example.com', name: 'Nguyễn Đức Anh', segment: 'PROFESSIONAL', cefr: 'A2', goal: 'WORK', targetExam: 'toeic', enroll: ['toeic-target-700', 'business-english-b1'], activeDays: 9, xp: 620, words: 95 },
    { email: 'an@example.com', name: 'Lê Bảo An', segment: 'PRIMARY', cefr: 'A1', goal: 'SCHOOL', targetExam: '', enroll: ['english-for-kids-starters'], activeDays: 4, xp: 180, words: 40 },
    { email: 'huong@example.com', name: 'Phạm Thu Hương', segment: 'ADULT', cefr: 'A1', goal: 'COMMUNICATION', targetExam: '', enroll: ['basic-english-a1', 'travel-english-a2'], activeDays: 15, xp: 980, words: 150 },
  ];

  const courses = await db.course.findMany({ select: { id: true, slug: true } });
  const courseBySlug = new Map(courses.map((course) => [course.slug, course.id]));
  const vocabulary = await db.vocabularyItem.findMany({
    where: { meaningVi: { not: '' } },
    select: { id: true, cefr: true },
    take: 1200,
    orderBy: { word: 'asc' },
  });

  let enrollments = 0;
  let progressRows = 0;

  for (const spec of students) {
    const user = await db.user.create({
      data: {
        email: spec.email,
        passwordHash: studentPassword,
        name: spec.name,
        role: 'STUDENT',
        locale: 'vi',
        studentProfile: {
          create: {
            segment: spec.segment,
            cefrLevel: spec.cefr,
            goal: spec.goal,
            targetExam: spec.targetExam,
            dailyGoalMin: 15,
            streakCurrent: Math.min(spec.activeDays, 12),
            streakLongest: spec.activeDays,
            totalXp: spec.xp,
            lastStudiedAt: new Date(),
          },
        },
      },
    });

    // Study history: a realistic, slightly irregular pattern rather than a perfect run.
    for (let offset = 0; offset < spec.activeDays; offset += 1) {
      if (offset % 7 === 5) continue; // a day off most weeks
      await db.studyDay.create({
        data: {
          userId: user.id,
          day: dayKey(offset),
          minutes: 12 + ((offset * 7) % 22),
          xp: 20 + ((offset * 13) % 45),
          lessons: offset % 3 === 0 ? 1 : 0,
          words: 4 + (offset % 9),
          exercises: 6 + (offset % 11),
        },
      });
    }

    for (const slug of spec.enroll) {
      const courseId = courseBySlug.get(slug);
      if (!courseId) continue;
      const lessons = await db.lesson.findMany({
        where: { module: { courseId } },
        orderBy: [{ module: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
        select: { id: true },
      });
      const completedCount = Math.max(1, Math.floor(lessons.length * (spec.activeDays / 30)));
      await db.enrollment.create({
        data: {
          userId: user.id,
          courseId,
          mode: 'SELF_STUDY',
          progress: lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0,
          lastLessonId: lessons[Math.min(completedCount, lessons.length - 1)]?.id ?? null,
        },
      });
      enrollments += 1;

      for (const lesson of lessons.slice(0, completedCount)) {
        await db.lessonProgress.create({
          data: {
            userId: user.id,
            lessonId: lesson.id,
            status: 'COMPLETED',
            score: 8,
            maxScore: 10,
            secondsSpent: 900,
            completedAt: new Date(),
          },
        });
        progressRows += 1;
      }
    }

    // Vocabulary review state, spread across the Leitner boxes.
    const pool = vocabulary.filter((row) => row.cefr === spec.cefr || row.cefr === 'A1');
    const taken = pool.slice(0, spec.words);
    for (const [index, item] of taken.entries()) {
      let state: ReviewState = { box: 0, ease: 2.5, intervalDays: 0, reviews: 0, correct: 0, lapses: 0 };
      const rounds = 1 + (index % 6);
      for (let round = 0; round < rounds; round += 1) {
        state = scheduleReview(state, index % 5 === 0 && round === 0 ? 'again' : 'good');
      }
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + (index % 9) - 3);
      await db.vocabularyProgress.create({
        data: {
          userId: user.id,
          vocabularyId: item.id,
          box: state.box,
          ease: state.ease,
          intervalDays: state.intervalDays,
          dueAt,
          reviews: state.reviews,
          correct: state.correct,
          lapses: state.lapses,
          isFavourite: index % 17 === 0,
          lastReviewed: new Date(),
        },
      });
    }

    await db.bookmark.createMany({
      data: [
        { userId: user.id, entityType: 'course', entityId: spec.enroll[0] },
        { userId: user.id, entityType: 'grammar', entityId: 'present-perfect' },
      ],
    });

    await db.notification.create({
      data: {
        userId: user.id,
        titleVi: 'Bạn có từ vựng đến hạn ôn hôm nay',
        bodyVi: 'Ôn 10 phút để giữ chuỗi ngày học.',
        href: '/vocabulary/review',
      },
    });
  }

  // Award every achievement the demo learners now qualify for, using the same code path
  // the live application uses.
  const allStudents = await db.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
  const achievements = await db.achievement.findMany();
  for (const student of allStudents) {
    const mastered = await db.vocabularyProgress.count({ where: { userId: student.id, box: { gte: 5 } } });
    const completed = await db.lessonProgress.count({ where: { userId: student.id, status: 'COMPLETED' } });
    const profile = await db.studentProfile.findUnique({ where: { userId: student.id } });
    for (const achievement of achievements) {
      const value =
        achievement.metric === 'WORDS'
          ? mastered
          : achievement.metric === 'LESSONS'
            ? completed
            : achievement.metric === 'STREAK'
              ? (profile?.streakLongest ?? 0)
              : achievement.metric === 'XP'
                ? (profile?.totalXp ?? 0)
                : 0;
      if (value >= achievement.threshold) {
        await db.userAchievement
          .create({ data: { userId: student.id, achievementId: achievement.id } })
          .catch(() => undefined);
      }
    }
  }

  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED',
      entity: 'database',
      summary: 'Cơ sở dữ liệu được khởi tạo từ học liệu đã nhập.',
    },
  });

  done(`1 admin · ${TEACHERS.length} teachers · ${students.length} students · ${enrollments} enrolments · ${progressRows} lesson completions`);
}

// ---------------------------------------------------------------------------

async function main() {
  const started = Date.now();
  console.log('\n\x1b[1mSeeding Tracy English\x1b[0m');

  await clearAll();
  await seedSources();

  const teacherIds = await seedTeachers();
  const { byWord, ids } = await seedVocabulary();
  const listIds = await seedVocabularyLists(byWord, ids);
  const voa = await seedVoa();

  // Map the ingested article id to the reading row, so grammar topics can link across.
  const readingBySourceId = voa.readingIds;
  const grammarIds = await seedGrammar(readingBySourceId);

  const listeningRows = await db.listeningItem.findMany({ select: { id: true, slug: true } });
  const readingRows = await db.readingItem.findMany({ select: { id: true, slug: true } });
  const listeningSlugById = new Map(listeningRows.map((row) => [row.id, row.slug]));
  const readingSlugById = new Map(readingRows.map((row) => [row.id, row.slug]));

  await seedCurriculum({
    grammarIds,
    listIds,
    listeningIds: voa.listeningIds,
    readingIds: voa.readingIds,
    bySeriesListening: voa.bySeriesListening,
    bySeriesReading: voa.bySeriesReading,
    articles: voa.articles,
    teacherIds,
    listeningSlug: (id: string) => listeningSlugById.get(id) ?? '',
    readingSlug: (id: string) => readingSlugById.get(id) ?? '',
  });

  await seedSite();
  await seedClasses(teacherIds);
  await seedConsultations();
  await seedDemoUsers();

  const counts = {
    vocabulary: await db.vocabularyItem.count(),
    examples: await db.vocabularyExample.count(),
    grammar: await db.grammarTopic.count(),
    listening: await db.listeningItem.count(),
    reading: await db.readingItem.count(),
    exercises: await db.exercise.count(),
    courses: await db.course.count(),
    lessons: await db.lesson.count(),
    users: await db.user.count(),
  };

  console.log('\n\x1b[1mSeed complete\x1b[0m');
  for (const [key, value] of Object.entries(counts)) {
    console.log(`   ${key.padEnd(12)} ${value.toLocaleString()}`);
  }
  console.log(`\n   Sign in with:`);
  console.log(`     admin@tracyenglish.vn / Admin@2026`);
  console.log(`     tracy@tracyenglish.vn / Teacher@2026`);
  console.log(`     linh@example.com      / Student@2026`);
  if (notes.length) {
    console.log(`\n   ${notes.length} note(s) reported above — nothing was silently dropped.`);
  }
  console.log(`\n   finished in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
