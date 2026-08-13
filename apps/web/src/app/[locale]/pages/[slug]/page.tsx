import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { pick } from '@tracy/localization';

import { db } from '@/lib/db';
import { resolveLocale } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  return { title: page?.titleVi ?? 'Trang' };
}

/**
 * Static pages managed from the admin panel.
 *
 * The body is authored in a small markdown subset — headings and paragraphs — which is all
 * a terms-of-use or privacy page needs.
 */
export default async function StaticPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolved = await params;
  const locale = await resolveLocale(params);

  const page = await db.page.findUnique({ where: { slug: resolved.slug } });
  if (!page || page.status !== 'PUBLISHED') notFound();

  const body = pick(locale, page.bodyVi, page.bodyEn);
  const blocks = body.split(/\n{2,}/).filter((block) => block.trim());

  return (
    <div className="py-12">
      <article className="container-prose">
        <h1 className="text-4xl">{pick(locale, page.titleVi, page.titleEn)}</h1>
        <div className="mt-8 space-y-5">
          {blocks.map((block, index) => {
            if (block.startsWith('## ')) {
              return (
                <h2 key={index} className="pt-4 text-2xl">
                  {block.slice(3)}
                </h2>
              );
            }
            if (block.startsWith('- ')) {
              return (
                <ul key={index} className="list-disc space-y-1.5 pl-6 text-ink-700">
                  {block
                    .split('\n')
                    .filter((line) => line.startsWith('- '))
                    .map((line, lineIndex) => (
                      <li key={lineIndex} className="leading-relaxed">
                        {line.slice(2)}
                      </li>
                    ))}
                </ul>
              );
            }
            return (
              <p key={index} className="text-[1.0625rem] leading-[1.8] text-ink-700">
                {block}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}
