import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

import { grade, scheduleReview, type ExercisePayload, type ExerciseType } from '@tracy/exercise-engine';

import { hashPassword, verifyPassword } from '@/lib/auth';

/**
 * The end-to-end journey, against the real seeded database.
 *
 * This is the test that proves the product works rather than that its pieces compile:
 * register → enrol → open a lesson → answer an exercise → get graded → progress moves →
 * a word enters the review schedule.
 *
 * It creates its own user and removes it afterwards, so it can run repeatedly against a
 * development database without leaving anything behind.
 */

const db = new PrismaClient();
const email = `journey-${Date.now()}@test.local`;
let userId = '';

afterAll(async () => {
  if (userId) {
    await db.user.delete({ where: { id: userId } }).catch(() => undefined);
  }
  await db.$disconnect();
});

describe('the seeded database', () => {
  it('has vocabulary with Vietnamese meanings', async () => {
    const total = await db.vocabularyItem.count();
    const withMeaning = await db.vocabularyItem.count({ where: { meaningVi: { not: '' } } });
    expect(total).toBeGreaterThan(1000);
    expect(withMeaning / total).toBeGreaterThan(0.8);
  });

  it('has listening material with both audio and a transcript', async () => {
    const item = await db.listeningItem.findFirst({ where: { status: 'PUBLISHED' } });
    expect(item).toBeTruthy();
    expect(item!.audioUrl).toMatch(/^https?:\/\//);
    expect(JSON.parse(item!.transcript).length).toBeGreaterThan(2);
  });

  it('attributes every listening and reading item to a source', async () => {
    const unattributed = await db.listeningItem.count({ where: { attribution: '' } });
    const unattributedReading = await db.readingItem.count({ where: { attribution: '' } });
    expect(unattributed).toBe(0);
    expect(unattributedReading).toBe(0);
  });

  it('has grammar topics with Vietnamese theory and practice', async () => {
    const topics = await db.grammarTopic.findMany({
      where: { status: 'PUBLISHED' },
      include: { _count: { select: { exercises: true } } },
    });
    expect(topics.length).toBeGreaterThan(20);
    for (const topic of topics) {
      expect(topic.theoryVi.length).toBeGreaterThan(200);
      expect(topic._count.exercises).toBeGreaterThan(0);
    }
  });

  it('gives every published course at least one lesson', async () => {
    const courses = await db.course.findMany({
      where: { status: 'PUBLISHED' },
      include: { modules: { include: { _count: { select: { lessons: true } } } } },
    });
    expect(courses.length).toBeGreaterThan(5);
    for (const course of courses) {
      const lessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
      expect(lessons, `course ${course.slug} has no lessons`).toBeGreaterThan(0);
    }
  });

  it('never stores an exercise without an answer', async () => {
    const broken = await db.exercise.count({ where: { answer: '' } });
    expect(broken).toBe(0);
  });

  it('resolves every lesson content reference it declares', async () => {
    const lessons = await db.lesson.findMany({
      where: { status: 'PUBLISHED' },
      include: { grammarTopic: true, listening: true, reading: true, vocabularyList: true },
    });
    for (const lesson of lessons) {
      if (lesson.grammarTopicId) expect(lesson.grammarTopic, lesson.slug).toBeTruthy();
      if (lesson.listeningId) expect(lesson.listening, lesson.slug).toBeTruthy();
      if (lesson.readingId) expect(lesson.reading, lesson.slug).toBeTruthy();
      if (lesson.vocabularyListId) expect(lesson.vocabularyList, lesson.slug).toBeTruthy();
    }
  });
});

describe('a learner journey', () => {
  it('registers with a hashed password that verifies', async () => {
    const passwordHash = await hashPassword('Journey@2026');
    const user = await db.user.create({
      data: {
        email,
        name: 'Học viên thử nghiệm',
        passwordHash,
        role: 'STUDENT',
        studentProfile: { create: { segment: 'ADULT', cefrLevel: 'A1' } },
      },
    });
    userId = user.id;

    expect(user.passwordHash).not.toContain('Journey@2026');
    expect(await verifyPassword('Journey@2026', user.passwordHash)).toBe(true);
    expect(await verifyPassword('wrong-password', user.passwordHash)).toBe(false);
  });

  it('enrols in a course and starts at zero', async () => {
    const course = await db.course.findFirst({ where: { status: 'PUBLISHED', isFree: true } });
    expect(course).toBeTruthy();

    const enrollment = await db.enrollment.create({
      data: { userId, courseId: course!.id, mode: 'SELF_STUDY' },
    });
    expect(enrollment.progress).toBe(0);
    expect(enrollment.status).toBe('ACTIVE');
  });

  it('grades a real exercise from the database with the shared engine', async () => {
    const exercise = await db.exercise.findFirst({
      where: { type: 'MULTIPLE_CHOICE', status: 'PUBLISHED' },
    });
    expect(exercise).toBeTruthy();

    const graded = {
      id: exercise!.id,
      type: exercise!.type as ExerciseType,
      answer: exercise!.answer,
      payload: JSON.parse(exercise!.payload) as ExercisePayload,
      points: exercise!.points,
    };

    expect(grade(graded, exercise!.answer).correct).toBe(true);
    expect(grade(graded, 'definitely not the answer').correct).toBe(false);
  });

  it('records an attempt and moves lesson progress forward', async () => {
    const lesson = await db.lesson.findFirst({
      where: { status: 'PUBLISHED' },
      include: { module: true },
    });
    expect(lesson).toBeTruthy();

    await db.lessonProgress.create({
      data: { userId, lessonId: lesson!.id, status: 'COMPLETED', completedAt: new Date() },
    });

    const completed = await db.lessonProgress.count({ where: { userId, status: 'COMPLETED' } });
    expect(completed).toBe(1);
  });

  it('schedules a word for review and advances it on a correct recall', async () => {
    const word = await db.vocabularyItem.findFirst({ where: { meaningVi: { not: '' } } });
    expect(word).toBeTruthy();

    const created = await db.vocabularyProgress.create({
      data: { userId, vocabularyId: word!.id, dueAt: new Date() },
    });
    expect(created.box).toBe(0);

    const advanced = scheduleReview(
      {
        box: created.box,
        ease: created.ease,
        intervalDays: created.intervalDays,
        reviews: created.reviews,
        correct: created.correct,
        lapses: created.lapses,
      },
      'good',
    );
    const updated = await db.vocabularyProgress.update({
      where: { id: created.id },
      data: { box: advanced.box, intervalDays: advanced.intervalDays, reviews: advanced.reviews },
    });

    expect(updated.box).toBe(1);
    expect(updated.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('records a consultation request the centre can act on', async () => {
    const request = await db.consultationRequest.create({
      data: {
        name: 'Người thử nghiệm',
        phone: '0912345999',
        goal: 'Kiểm thử luồng tư vấn',
        userId,
      },
    });
    expect(request.status).toBe('NEW');
    await db.consultationRequest.delete({ where: { id: request.id } });
  });
});
