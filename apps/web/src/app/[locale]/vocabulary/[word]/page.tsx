import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Info, Languages, Quote, Shapes } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, LevelBadge, cn } from '@tracy/ui';

import { WordAudioButton } from '@/components/learn/audio';
import { VocabularyCard } from '@/components/learn/vocabulary-card';
import { WordActions } from '@/components/learn/word-actions';
import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { getCurrentUser, resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ word: string }>;
}): Promise<Metadata> {
  const { word } = await params;
  const decoded = decodeURIComponent(word);
  const item = await db.vocabularyItem.findUnique({ where: { word: decoded } });
  if (!item) return { title: decoded };
  return {
    title: `${item.word} — ${item.meaningVi || 'nghĩa tiếng Việt'}`,
    description: `${item.word} ${item.ipaUk} — ${item.meaningVi}. Phát âm của người bản xứ, ví dụ song ngữ và bài tập ôn.`,
  };
}

export default async function WordPage({
  params,
}: {
  params: Promise<{ locale: string; word: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;
  const decoded = decodeURIComponent(resolved.word).toLowerCase();

  const item = await db.vocabularyItem.findUnique({
    where: { word: decoded },
    include: {
      examples: { orderBy: { displayOrder: 'asc' }, include: { source: true } },
      source: true,
      listItems: { include: { list: true } },
    },
  });
  if (!item || item.status !== 'PUBLISHED') notFound();

  const user = await getCurrentUser();
  const [progress, related] = await Promise.all([
    user
      ? db.vocabularyProgress.findUnique({
          where: { userId_vocabularyId: { userId: user.id, vocabularyId: item.id } },
        })
      : Promise.resolve(null),
    // Neighbours at the same level: the closest thing to "related words" that is honest,
    // since we have no thesaurus relation in the corpus.
    db.vocabularyItem.findMany({
      where: {
        status: 'PUBLISHED',
        cefr: item.cefr,
        id: { not: item.id },
        word: { startsWith: item.word.slice(0, 3) },
        meaningVi: { not: '' },
      },
      take: 6,
      orderBy: { word: 'asc' },
    }),
  ]);

  const sensesEn = parseArray<{ pos: string; gloss: string; example: string }>(item.sensesEn);
  const sensesVi = parseArray<{ pos: string; text: string }>(item.sensesVi);
  const forms = parseArray<string>(item.forms);
  const partsOfSpeech = parseArray<string>(item.partsOfSpeech);

  const groupedVi = sensesVi.reduce<Record<string, string[]>>((accumulator, sense) => {
    (accumulator[sense.pos] ??= []).push(sense.text);
    return accumulator;
  }, {});

  return (
    <div className="py-10">
      <div className="container-page">
        <Link
          href={href('/vocabulary')}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('nav.vocabulary')}
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="space-y-6">
            {/* ---------------------------------------------------------- headword */}
            <Card className="border-brand-200 bg-gradient-to-br from-white to-lavender">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl sm:text-5xl">{item.word}</h1>
                    <LevelBadge level={item.cefr} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {item.ipaUk ? (
                      <span className="flex items-center gap-2">
                        <span className="rounded-md bg-ink-800 px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-cream">
                          UK
                        </span>
                        <span className="ipa text-lg">{item.ipaUk}</span>
                      </span>
                    ) : null}
                    {item.ipaUs ? (
                      <span className="flex items-center gap-2">
                        <span className="rounded-md bg-ink-800 px-1.5 py-0.5 text-[0.65rem] font-extrabold uppercase text-cream">
                          US
                        </span>
                        <span className="ipa text-lg">{item.ipaUs}</span>
                      </span>
                    ) : null}
                    <WordAudioButton
                      src={item.audioPath || null}
                      word={item.word}
                      credit={item.audioCredit}
                      size="lg"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {partsOfSpeech.map((pos) => (
                      <Badge key={pos} accent="ink">
                        {pos}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border-2 border-teal-200 bg-teal-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                  {t('vocab.meaning')}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-teal-900">
                  {item.meaningVi || '—'}
                </p>
              </div>

              {item.audioPath ? (
                <p className="mt-3 text-xs leading-relaxed text-ink-500">
                  Bản thu: {item.audioCredit || 'Wikimedia Commons'}. Đây là giọng người thật, không
                  phải giọng tổng hợp.
                </p>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-ink-500">
                  {t('vocab.noAudio')}. Chúng tôi chỉ dùng bản thu của người thật, nên khi chưa có
                  bản thu phù hợp thì để trống thay vì tạo giọng máy.
                </p>
              )}
            </Card>

            {/* ------------------------------------------------- Vietnamese senses */}
            {Object.keys(groupedVi).length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-xl">
                  <Languages className="h-5 w-5 text-teal-600" />
                  {t('vocab.explanation')}
                </h2>
                <div className="mt-4 space-y-4">
                  {Object.entries(groupedVi).map(([pos, texts]) => (
                    <div key={pos}>
                      <p className="text-xs font-bold uppercase tracking-widest text-ink-400">{pos}</p>
                      <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-[0.95rem] leading-relaxed text-ink-800 marker:font-bold marker:text-teal-500">
                        {texts.slice(0, 6).map((text, index) => (
                          <li key={index}>{text}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
                {item.source ? (
                  <p className="mt-4 border-t-2 border-ink-100 pt-3 text-xs text-ink-400">
                    {t('common.source')}: {item.source.name} — {item.source.licence}
                  </p>
                ) : null}
              </Card>
            ) : null}

            {/* ---------------------------------------------------- English senses */}
            {sensesEn.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-xl">
                  <BookOpen className="h-5 w-5 text-brand-600" />
                  {t('vocab.englishDefinition')}
                </h2>
                <div className="mt-4 space-y-4">
                  {sensesEn.map((sense, index) => (
                    <div key={index} className="border-l-4 border-brand-200 pl-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
                        {sense.pos}
                      </p>
                      <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-800">{sense.gloss}</p>
                      {sense.example ? (
                        <p className="mt-1.5 text-sm italic text-ink-500">“{sense.example}”</p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t-2 border-ink-100 pt-3 text-xs text-ink-400">
                  {t('common.source')}: English Wiktionary — CC BY-SA 4.0
                </p>
              </Card>
            ) : null}

            {/* --------------------------------------------------------- examples */}
            {item.examples.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-xl">
                  <Quote className="h-5 w-5 text-coral-500" />
                  {t('vocab.examples')}
                </h2>
                <ul className="mt-4 space-y-4">
                  {item.examples.map((example) => (
                    <li key={example.id} className="rounded-2xl bg-ink-50 p-4">
                      <p className="text-[0.95rem] font-semibold leading-relaxed text-ink-900">
                        {highlight(example.textEn, item.word)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-teal-800">{example.textVi}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-ink-400">
                        <LevelBadge level={example.cefr} />
                        <span>{example.attribution}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {/* -------------------------------------------------------- etymology */}
            {item.etymology ? (
              <Card>
                <h2 className="flex items-center gap-2 text-xl">
                  <Info className="h-5 w-5 text-sun-600" />
                  {t('vocab.etymology')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">{item.etymology}</p>
              </Card>
            ) : null}
          </div>

          {/* --------------------------------------------------------------- aside */}
          <aside className="space-y-6 lg:sticky lg:top-24">
            <WordActions
              word={item.word}
              vocabularyId={item.id}
              signedIn={Boolean(user)}
              initialFavourite={progress?.isFavourite ?? false}
              box={progress?.box ?? null}
            />

            {forms.length ? (
              <Card>
                <h2 className="flex items-center gap-2 text-base">
                  <Shapes className="h-4 w-4 text-brand-500" />
                  {t('vocab.forms')}
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {forms.map((form) => (
                    <span key={form} className="rounded-xl bg-ink-100 px-2.5 py-1 text-sm font-semibold text-ink-700">
                      {form}
                    </span>
                  ))}
                </div>
              </Card>
            ) : null}

            {item.listItems.length ? (
              <Card>
                <h2 className="text-base">Thuộc danh sách</h2>
                <ul className="mt-3 space-y-2">
                  {item.listItems.map((membership) => (
                    <li key={membership.id}>
                      <Link
                        href={href(`/vocabulary/lists/${membership.list.slug}`)}
                        className="flex items-center justify-between gap-2 rounded-2xl bg-ink-50 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {membership.list.titleVi}
                        <LevelBadge level={membership.list.cefr} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {related.length ? (
              <div>
                <h2 className="mb-3 text-base font-extrabold">{t('vocab.related')}</h2>
                <div className="grid gap-3">
                  {related.slice(0, 4).map((neighbour) => (
                    <VocabularyCard
                      key={neighbour.id}
                      compact
                      item={{
                        word: neighbour.word,
                        cefr: neighbour.cefr,
                        ipaUk: neighbour.ipaUk,
                        ipaUs: neighbour.ipaUs,
                        audioPath: neighbour.audioPath,
                        audioCredit: neighbour.audioCredit,
                        meaningVi: neighbour.meaningVi,
                        partsOfSpeech: parseArray<string>(neighbour.partsOfSpeech),
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <Card className="bg-brand-50">
              <p className="text-sm leading-relaxed text-ink-700">
                Muốn nhớ từ này lâu? Thêm vào danh sách ôn — hệ thống sẽ nhắc bạn đúng lúc sắp
                quên, thay vì bắt bạn ôn lại những từ đã thuộc.
              </p>
              {!user ? (
                <ButtonLink href={href('/register')} size="sm" className="mt-3">
                  {t('action.register')}
                </ButtonLink>
              ) : null}
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Bold the headword inside an example sentence so the eye finds it immediately. */
function highlight(sentence: string, word: string) {
  const pattern = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)\\b`, 'i');
  const match = pattern.exec(sentence);
  if (!match) return sentence;
  return (
    <>
      {sentence.slice(0, match.index)}
      <mark className="rounded bg-sun-200/70 px-0.5 font-extrabold text-ink-900">{match[0]}</mark>
      {sentence.slice(match.index + match[0].length)}
    </>
  );
}
