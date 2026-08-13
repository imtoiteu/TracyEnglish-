import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mic, Volume2 } from 'lucide-react';

import { formatNumber, translate } from '@tracy/localization';
import { ButtonLink, Card, Eyebrow, LevelBadge, SectionHeading } from '@tracy/ui';

import { WordAudioButton } from '@/components/learn/audio';
import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Luyện nói và phát âm' };
export const dynamic = 'force-dynamic';

/**
 * The speaking hub.
 *
 * Speaking cannot be assessed by a static site, and pretending otherwise would be dishonest.
 * What this page *can* do is give a learner a model to copy — real recordings, chosen for
 * the sounds Vietnamese speakers find hardest — and a route to a teacher who will listen.
 */
export default async function SpeakingPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const [audioCount, pronunciationCourse, drillWords, teachers] = await Promise.all([
    db.vocabularyItem.count({ where: { audioPath: { not: '' } } }),
    db.course.findUnique({
      where: { slug: 'pronunciation-for-vietnamese' },
      include: { modules: { include: { lessons: { orderBy: { displayOrder: 'asc' } } } } },
    }),
    // Minimal pairs and final-consonant words that actually have a recording.
    db.vocabularyItem.findMany({
      where: {
        audioPath: { not: '' },
        word: {
          in: [
            'bat', 'back', 'bad', 'bag', 'nice', 'knives', 'hard', 'heart',
            'ship', 'sheep', 'live', 'leave', 'thin', 'think', 'three', 'tree',
          ],
        },
      },
      orderBy: { word: 'asc' },
    }),
    db.teacherProfile.findMany({
      where: { status: 'PUBLISHED', specialties: { contains: 'speaking' } },
      include: { user: { select: { name: true } } },
      take: 3,
    }),
  ]);

  const PROBLEMS = [
    {
      titleVi: 'Nuốt âm cuối',
      bodyVi:
        'Tiếng Việt không bật hơi ở âm cuối, nên bat / back / bad nghe gần như giống nhau. Đây là lỗi làm người nghe hiểu sai nhiều nhất.',
    },
    {
      titleVi: 'Sai trọng âm',
      bodyVi:
        'Tiếng Việt là ngôn ngữ thanh điệu, các âm tiết đều nhau. Tiếng Anh nhấn một âm tiết và nuốt bớt phần còn lại. Đặt sai trọng âm khiến người nghe không nhận ra từ.',
    },
    {
      titleVi: 'Âm tiếng Việt không có',
      bodyVi:
        'Các âm /θ/, /ð/, /ʃ/, /ʒ/ và /r/ kiểu Mỹ không tồn tại trong tiếng Việt, nên bị thay bằng âm gần giống nhất — th thành t hoặc s.',
    },
    {
      titleVi: 'Nối âm',
      bodyVi:
        'Người bản xứ nối từ liền nhau: "an apple" nghe thành một khối. Không quen nối âm thì vừa nói cứng vừa nghe không kịp.',
    },
  ];

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="coral">
            <Mic className="h-3.5 w-3.5" />
            {t('nav.speaking')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">Luyện nói và phát âm</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Nền tảng không chấm điểm phần nói — một trang web không nghe được bạn. Nhưng nó cho bạn{' '}
            <strong>mẫu để bắt chước</strong>: {formatNumber(audioCount, locale)} bản thu của người
            bản xứ, và một lộ trình sửa đúng bốn lỗi mà người Việt hay mắc nhất.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow="Chẩn đoán"
            title="Bốn lỗi làm người nghe không hiểu bạn"
            accent="coral"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((problem, index) => (
              <Card key={problem.titleVi} className="h-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-coral-100 font-display text-base font-extrabold text-coral-700">
                  {index + 1}
                </span>
                <h2 className="mt-3 text-base">{problem.titleVi}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{problem.bodyVi}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {drillWords.length ? (
        <section className="border-y-2 border-ink-100 bg-white py-12">
          <div className="container-page">
            <SectionHeading
              eyebrow="Luyện ngay"
              title="Cặp từ chỉ khác nhau ở một âm"
              lead="Nghe từng cặp và đọc theo. Nếu bạn phát âm hai từ giống nhau thì người nghe cũng sẽ nghe giống nhau."
              accent="sky"
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {drillWords.map((word) => (
                <Card key={word.id} className="flex items-center gap-3">
                  <WordAudioButton
                    src={word.audioPath}
                    word={word.word}
                    credit={word.audioCredit}
                    size="md"
                  />
                  <div className="min-w-0">
                    <Link
                      href={href(`/vocabulary/${encodeURIComponent(word.word)}`)}
                      className="font-display text-lg font-extrabold text-ink-900 hover:text-brand-700"
                    >
                      {word.word}
                    </Link>
                    <p className="ipa text-xs">{word.ipaUk || word.ipaUs}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {pronunciationCourse ? (
        <section className="py-12">
          <div className="container-page grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow={t('nav.courses')}
                title={pronunciationCourse.titleVi}
                lead={pronunciationCourse.subtitleVi}
                accent="coral"
              />
              <div className="mt-6 space-y-3">
                {pronunciationCourse.modules.flatMap((module) =>
                  module.lessons.map((lesson) => (
                    <Link key={lesson.id} href={href(`/lessons/${lesson.slug}`)}>
                      <Card interactive>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base leading-snug">{lesson.titleVi}</h3>
                            <p className="mt-1 text-sm text-ink-600">{lesson.objectiveVi}</p>
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand-500" />
                        </div>
                      </Card>
                    </Link>
                  )),
                )}
              </div>
              <ButtonLink href={href(`/courses/${pronunciationCourse.slug}`)} className="mt-5">
                {t('action.viewCourse')}
              </ButtonLink>
            </div>

            <Card className="bg-ink-900 text-cream">
              <h2 className="flex items-center gap-2 text-xl text-cream">
                <Volume2 className="h-5 w-5" />
                Cần người nghe bạn nói
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-200">
                Bắt chước bản thu giúp bạn đi được một quãng dài, nhưng đến lúc nào đó bạn cần một
                người chỉ ra rằng bạn vẫn đang nuốt âm /t/ cuối từ mà không tự nhận ra. Trung tâm có
                buổi kèm 1–1 chuyên sửa phát âm.
              </p>
              {teachers.length ? (
                <ul className="mt-4 space-y-2">
                  {teachers.map((teacher) => (
                    <li key={teacher.id}>
                      <Link
                        href={href(`/teachers/${teacher.slug}`)}
                        className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 hover:bg-white/20"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-400 font-display font-extrabold text-white">
                          {teacher.user.name.split(' ').slice(-1)[0].slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-cream">
                            {teacher.user.name}
                          </span>
                          <span className="block truncate text-xs text-ink-300">
                            {teacher.headlineVi}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <ButtonLink href={href('/contact')} variant="pop" className="mt-5">
                {t('action.bookTrial')}
              </ButtonLink>
            </Card>
          </div>
        </section>
      ) : null}
    </>
  );
}
