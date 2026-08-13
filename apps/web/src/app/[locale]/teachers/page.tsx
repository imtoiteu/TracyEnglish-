import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Award, GraduationCap, Star } from 'lucide-react';

import { translate } from '@tracy/localization';
import { Badge, ButtonLink, Card, Eyebrow, SectionHeading } from '@tracy/ui';

import { db } from '@/lib/db';
import { parseArray } from '@/lib/json';
import { resolveLocale } from '@/lib/session';

export const metadata: Metadata = { title: 'Giáo viên' };
export const dynamic = 'force-dynamic';

export default async function TeachersPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = (key: string) => translate(locale, key);
  const href = (path: string) => `/${locale}${path}`;

  const teachers = await db.teacherProfile.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { displayOrder: 'asc' },
    include: {
      user: { select: { name: true } },
      _count: { select: { courses: true, classGroups: true } },
    },
  });

  return (
    <>
      <section className="border-b-2 border-ink-100 bg-lavender py-12">
        <div className="container-page">
          <Eyebrow accent="coral">
            <GraduationCap className="h-3.5 w-3.5" />
            {t('nav.teachers')}
          </Eyebrow>
          <h1 className="mt-4 text-4xl">Đội ngũ giáo viên</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
            Mỗi giáo viên phụ trách một mảng cụ thể và dạy đúng mảng đó. Bạn có thể xem phương pháp
            dạy, chứng chỉ và lịch rảnh của từng người trước khi đặt buổi học thử.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container-page grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => {
            const specialties = parseArray<string>(teacher.specialties);
            const certificates = parseArray<{ name: string; issuer: string; year: string }>(
              teacher.certificatesVi,
            );
            return (
              <Card key={teacher.id} className="flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-blob bg-gradient-to-br from-brand-400 to-coral-400 font-display text-xl font-extrabold text-white">
                    {teacher.user.name.split(' ').slice(-1)[0].slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg leading-snug">{teacher.user.name}</h2>
                    <p className="mt-0.5 text-xs font-semibold text-brand-600">{teacher.headlineVi}</p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-4 flex-1 text-sm leading-relaxed text-ink-600">
                  {teacher.bioVi}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {specialties.map((tag) => (
                    <Badge key={tag} accent="ink">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-sun-400 text-sun-400" />
                    {teacher.rating.toFixed(1)} ({teacher.reviewCount})
                  </span>
                  <span>{teacher.yearsExperience} năm</span>
                  {certificates.length ? (
                    <span className="inline-flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {certificates.length} chứng chỉ
                    </span>
                  ) : null}
                </div>

                <Link
                  href={href(`/teachers/${teacher.slug}`)}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline"
                >
                  Xem hồ sơ
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-t-2 border-ink-100 bg-white py-12">
        <div className="container-page">
          <SectionHeading
            eyebrow="Học thử"
            title="Buổi đầu tiên miễn phí"
            lead="Với lớp nhóm, buổi học thử miễn phí. Với kèm 1–1, buổi đầu là buổi kiểm tra trình độ và thiết kế lộ trình, cũng không tính phí."
            accent="coral"
            action={<ButtonLink href={href('/contact')}>{t('action.bookTrial')}</ButtonLink>}
          />
        </div>
      </section>
    </>
  );
}
