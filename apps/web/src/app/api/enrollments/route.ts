import { NextResponse, type NextRequest } from 'next/server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

/** Create a self-study enrolment. Paid formats go through the consultation flow instead. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  let body: { courseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const courseId = String(body.courseId ?? '');
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const enrollment = await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId, mode: 'SELF_STUDY' },
    update: { status: 'ACTIVE' },
  });

  return NextResponse.json({ id: enrollment.id, status: enrollment.status });
}
