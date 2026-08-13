import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Headphones,
  Mic,
  PenLine,
  Quote,
  ScrollText,
  Sparkles,
  Star,
  Users,
  Volume2,
} from 'lucide-react';

import { LEARNING_FORMATS } from '@tracy/curriculum';
import { formatNumber, pick, translate, type Locale } from '@tracy/localization';
import {
  Badge,
  ButtonLink,
  Card,
  DottedGrid,
  Eyebrow,
  HeroGlow,
  LevelBadge,
  SectionHeading,
  Squiggle,
  Stat,
  StudyCardStack,
  accentStyles,
  cn,
} from '@tracy/ui';

import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

const SKILL_CARDS = [
  { skill: 'listening', href: '/listening', accent: 'sky', icon: Headphones, blurbVi: 'Bài nghe thật của phát thanh viên VOA, có lời thoại đầy đủ và từ vựng đi kèm.' },
  { skill: 'reading', href: '/reading', accent: 'teal', icon: BookOpen, blurbVi: 'Bài đọc phân theo trình độ, có từ vựng do biên tập viên chọn và câu hỏi kiểm tra.' },
  { skill: 'writing', href: '/writing', accent: 'sun', icon: PenLine, blurbVi: 'Từ câu đơn đến đoạn văn và bài luận, với dàn ý và tiêu chí chấm rõ ràng.' },
  { skill: 'speaking', href: '/speaking', accent: 'coral', icon: Mic, blurbVi: 'Luyện phát âm theo bản thu của người bản xứ, và đặt buổi nói với giáo viên khi cần.' },
  { skill: 'grammar', href: '/grammar', accent: 'brand', icon: ScrollText, blurbVi: 'Giải thích bằng tiếng Việt, chỉ rõ lỗi do dịch từ tiếng mẹ đẻ, bài tập có chữa.' },
  { skill: 'vocabulary', href: '/vocabulary', accent: 'rose', icon: Sparkles, blurbVi: 'Hơn tám nghìn từ có phiên âm, nghĩa tiếng Việt, ví dụ song ngữ và ôn theo giãn cách.' },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await resolveLocale(params)) as Locale;
  const t = (key: string, values?: Record<string, string | number>) =>
    translate(locale, key, values);
  const href = (path: string) => `/${locale}${path}`;

  const [
    wordCount,
    audioCount,
    listeningCount,
    exampleCount,
    grammarCount,
    tracks,
    featured,
    teachers,
    testimonials,
    faqs,
  ] = await Promise.all([
    db.vocabularyItem.count({ where: { status: 'PUBLISHED' } }),
    db.vocabularyItem.count({ where: { audioPath: { not: '' } } }),
    db.listeningItem.count({ where: { status: 'PUBLISHED' } }),
    db.vocabularyExample.count(),
    db.grammarTopic.count({ where: { status: 'PUBLISHED' } }),
    db.track.findMany({ where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' } }),
    db.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { displayOrder: 'asc' },
      take: 6,
      include: {
        track: { select: { titleVi: true, titleEn: true } },
        _count: { select: { modules: true } },
      },
    }),
    db.teacherProfile.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { displayOrder: 'asc' },
      take: 4,
      include: { user: { select: { name: true } } },
    }),
    db.testimonial.findMany({ where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' }, take: 3 }),
    db.faqItem.findMany({ where: { status: 'PUBLISHED' }, orderBy: { displayOrder: 'asc' }, take: 6 }),
  ]);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b-2 border-ink-100 bg-lavender">
        <HeroGlow />
        <DottedGrid className="opacity-40" />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            <Eyebrow accent="coral">
              <Volume2 className="h-3.5 w-3.5" />
              {t('home.hero.eyebrow')}
            </Eyebrow>
            <h1 className="mt-5 text-4xl leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              {t('home.hero.title')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">{t('home.hero.lead')}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={href('/register')} variant="pop" size="lg">
                {t('home.hero.primary')}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={href('/placement')} variant="outline" size="lg">
                {t('home.hero.secondary')}
              </ButtonLink>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-600">
              {[
                'Phần tự học miễn phí, không giới hạn',
                'Không dùng giọng đọc máy',
                'Ghi rõ nguồn và giấy phép học liệu',
              ].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-pop-in lg:pl-6">
            <StudyCardStack />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- stats */}
      <section className="border-b-2 border-ink-100 bg-white py-12">
        <div className="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            accent="brand"
            icon={<Sparkles className="h-5 w-5" />}
            value={formatNumber(wordCount, locale)}
            label={t('home.stats.words')}
          />
          <Stat
            accent="coral"
            icon={<Volume2 className="h-5 w-5" />}
            value={formatNumber(audioCount, locale)}
            label={t('home.stats.audio')}
          />
          <Stat
            accent="sky"
            icon={<Headphones className="h-5 w-5" />}
            value={formatNumber(listeningCount, locale)}
            label={t('home.stats.listening')}
          />
          <Stat
            accent="teal"
            icon={<BookOpen className="h-5 w-5" />}
            value={formatNumber(exampleCount, locale)}
            label={t('home.stats.sentences')}
          />
        </div>
      </section>

      {/* -------------------------------------------------------------- skills */}
      <section className="py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('nav.learn')}
            title={t('home.skills.title')}
            lead={t('home.skills.lead')}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SKILL_CARDS.map((card) => {
              const styles = accentStyles(card.accent);
              const Icon = card.icon;
              return (
                <Link key={card.skill} href={href(card.href)} className="group">
                  <Card interactive className="h-full">
                    <span
                      className={cn(
                        'inline-flex h-12 w-12 items-center justify-center rounded-2xl',
                        styles.bg,
                        styles.text,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-xl">{t(`skill.${card.skill}`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{card.blurbVi}</p>
                    <span className={cn('mt-4 inline-flex items-center gap-1 text-sm font-bold', styles.text)}>
                      {t('action.start')}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- tracks */}
      <section className="border-y-2 border-ink-100 bg-white py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('nav.courses')}
            title={t('home.tracks.title')}
            lead={t('home.tracks.lead')}
            accent="coral"
            action={
              <ButtonLink href={href('/courses')} variant="outline">
                {t('action.viewAll')}
              </ButtonLink>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => {
              const styles = accentStyles(track.accent);
              return (
                <Link key={track.id} href={href(`/courses?track=${track.slug}`)} className="group">
                  <Card interactive className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg">{pick(locale, track.titleVi, track.titleEn)}</h3>
                      <Badge accent={track.accent as never}>{track.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {pick(locale, track.summaryVi, track.summaryEn)}
                    </p>
                    <span className={cn('mt-4 inline-flex items-center gap-1 text-sm font-bold', styles.text)}>
                      {t('action.viewCourse')}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ featured courses */}
      <section className="py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Khoá học nổi bật"
            title="Bắt đầu với một khoá cụ thể"
            lead="Mỗi khoá có mục tiêu đầu ra rõ ràng và được xây từ học liệu thật, không phải bài tập máy sinh."
            accent="teal"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((course) => {
              const styles = accentStyles(course.accent);
              const skills = parseArray<string>(course.skills);
              return (
                <Link key={course.id} href={href(`/courses/${course.slug}`)} className="group">
                  <Card interactive className="flex h-full flex-col">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={course.cefrFrom} />
                      {course.cefrTo !== course.cefrFrom ? (
                        <>
                          <span className="text-ink-300">→</span>
                          <LevelBadge level={course.cefrTo} />
                        </>
                      ) : null}
                      {course.isFree ? <Badge accent="teal">{t('common.free')}</Badge> : null}
                    </div>
                    <h3 className="mt-3 text-lg leading-snug">
                      {pick(locale, course.titleVi, course.titleEn)}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">
                      {pick(locale, course.subtitleVi || course.descriptionVi, course.descriptionEn)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600"
                        >
                          {t(`skill.${skill}`)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                      <span className="font-semibold text-ink-500">
                        {course._count.modules} chương · {course.estimatedHours} giờ
                      </span>
                      <span className={cn('inline-flex items-center gap-1 font-bold', styles.text)}>
                        {t('action.viewCourse')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- formats */}
      <section className="relative overflow-hidden border-y-2 border-ink-100 bg-lavender py-16 lg:py-20">
        <DottedGrid className="opacity-30" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Hình thức học"
            title={t('home.methods.title')}
            lead={t('home.methods.lead')}
            accent="brand"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LEARNING_FORMATS.map((format) => {
              const styles = accentStyles(format.accent);
              return (
                <Card key={format.slug} className="flex h-full flex-col bg-white">
                  <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl', styles.bg, styles.text)}>
                    <Users className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-base">{format.titleVi}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{format.summaryVi}</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-ink-500">
                    {format.featuresVi.slice(0, 3).map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <CheckCircle2 className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', styles.text)} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={href('/classes')}>{t('nav.classes')}</ButtonLink>
            <ButtonLink href={href('/contact')} variant="secondary">
              {t('action.consult')}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ teachers */}
      <section className="py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={t('nav.teachers')}
            title={t('home.teachers.title')}
            lead="Đội ngũ dạy trực tiếp tại trung tâm và trực tuyến."
            accent="coral"
            action={
              <ButtonLink href={href('/teachers')} variant="outline">
                {t('action.viewAll')}
              </ButtonLink>
            }
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((teacher) => {
              const specialties = parseArray<string>(teacher.specialties);
              return (
                <Link key={teacher.id} href={href(`/teachers/${teacher.slug}`)} className="group">
                  <Card interactive className="h-full text-center">
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-blob bg-gradient-to-br from-brand-400 to-coral-400 font-display text-2xl font-extrabold text-white">
                      {teacher.user.name.split(' ').slice(-1)[0].slice(0, 1)}
                    </span>
                    <h3 className="mt-4 text-base">{teacher.user.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-brand-600">{teacher.headlineVi}</p>
                    <div className="mt-3 flex items-center justify-center gap-1 text-xs text-ink-500">
                      <Star className="h-3.5 w-3.5 fill-sun-400 text-sun-400" aria-hidden="true" />
                      {teacher.rating.toFixed(1)} · {teacher.yearsExperience} năm kinh nghiệm
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {specialties.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-ink-100 px-2 py-0.5 text-[0.7rem] font-semibold text-ink-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- testimonials */}
      <section className="border-y-2 border-ink-100 bg-white py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Cảm nhận"
            title={t('home.testimonials.title')}
            accent="sun"
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <Card key={item.id} className="flex h-full flex-col">
                <Quote className="h-7 w-7 text-brand-200" aria-hidden="true" />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">“{item.quoteVi}”</p>
                {item.resultVi ? (
                  <p className="mt-4 rounded-2xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800">
                    {item.resultVi}
                  </p>
                ) : null}
                <div className="mt-4 border-t-2 border-ink-100 pt-3">
                  <p className="text-sm font-bold text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-500">{item.roleVi}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- faq */}
      <section className="py-16 lg:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Hỏi đáp" title={t('home.faq.title')} accent="teal" />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-3xl border-2 border-ink-100 bg-white p-5 shadow-soft open:border-brand-200"
              >
                <summary className="cursor-pointer list-none font-display text-base font-extrabold text-ink-900 marker:hidden">
                  <span className="flex items-start justify-between gap-4">
                    {faq.questionVi}
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-brand-400 transition-transform group-open:rotate-90" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">{faq.answerVi}</p>
              </details>
            ))}
            <ButtonLink href={href('/faq')} variant="ghost">
              {t('action.viewAll')} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- cta */}
      <section className="relative overflow-hidden bg-ink-900 py-16 text-cream lg:py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-coral-500/30 blur-3xl" />
        </div>
        <div className="container-page relative text-center">
          <h2 className="mx-auto max-w-2xl text-3xl text-cream sm:text-4xl">{t('home.cta.title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-200">{t('home.cta.lead')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={href('/placement')} variant="pop" size="lg">
              {t('nav.placement')}
            </ButtonLink>
            <ButtonLink
              href={href('/contact')}
              size="lg"
              className="border-2 border-cream/30 bg-transparent text-cream hover:bg-cream/10"
            >
              {t('action.consult')}
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink-300">
            {formatNumber(grammarCount, locale)} chủ điểm ngữ pháp ·{' '}
            {formatNumber(wordCount, locale)} từ vựng · {formatNumber(listeningCount, locale)} bài nghe
          </p>
        </div>
        <Squiggle className="absolute bottom-0 left-0 h-3 w-full text-brand-400" tone="#9070FF" />
      </section>
    </>
  );
}
