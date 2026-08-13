'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookmarkCheck, BookmarkPlus } from 'lucide-react';

import { Button, ButtonLink } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

/**
 * Enrol in a course.
 *
 * Enrolment is free and instant for self-study — it exists to create the progress record,
 * not to gate content. Everything in a free course is readable before enrolling; enrolling
 * is what makes the dashboard start tracking it.
 */
export function EnrollButton({
  courseId,
  courseSlug,
  signedIn,
  enrolled,
}: {
  courseId: string;
  courseSlug: string;
  signedIn: boolean;
  enrolled: boolean;
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(enrolled);

  if (!signedIn) {
    return (
      <ButtonLink
        href={href(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`)}
        variant="secondary"
        className="w-full"
      >
        {t('action.enroll')}
      </ButtonLink>
    );
  }

  const enrol = async () => {
    if (busy || active) return;
    setBusy(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (response.ok) {
        setActive(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      onClick={enrol}
      disabled={busy || active}
      variant={active ? 'outline' : 'secondary'}
      className="w-full"
    >
      {active ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
      {active ? 'Đã ghi danh' : t('action.enroll')}
    </Button>
  );
}
