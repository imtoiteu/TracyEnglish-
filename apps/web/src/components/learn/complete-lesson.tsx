'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { Button, ButtonLink } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

/**
 * Mark a lesson complete.
 *
 * Deliberately a manual action rather than something inferred from scroll depth: the
 * learner decides when they have finished, and the streak is only meaningful if it records
 * a decision rather than a page view.
 */
export function CompleteLessonButton({
  lessonId,
  courseSlug,
  signedIn,
  completed,
  nextHref,
}: {
  lessonId: string;
  courseSlug: string;
  signedIn: boolean;
  completed: boolean;
  nextHref: string;
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <ButtonLink href={href(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`)}>
        {t('action.login')}
      </ButtonLink>
    );
  }

  const complete = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      const response = await fetch('/api/lessons/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });
      if (response.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <ButtonLink href={href(nextHref)} variant="secondary">
        {t('action.next')}
        <ArrowRight className="h-4 w-4" />
      </ButtonLink>
    );
  }

  return (
    <Button onClick={complete} disabled={busy}>
      <CheckCircle2 className="h-4 w-4" />
      {t('lesson.markComplete')}
    </Button>
  );
}
