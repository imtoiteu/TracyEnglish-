'use client';

import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

import { Logo, Squiggle } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

const COLUMNS = [
  {
    titleKey: 'footer.learn',
    links: [
      { labelKey: 'nav.vocabulary', href: '/vocabulary' },
      { labelKey: 'nav.grammar', href: '/grammar' },
      { labelKey: 'nav.listening', href: '/listening' },
      { labelKey: 'nav.reading', href: '/reading' },
      { labelKey: 'nav.courses', href: '/courses' },
      { labelKey: 'nav.placement', href: '/placement' },
    ],
  },
  {
    titleKey: 'footer.centre',
    links: [
      { labelKey: 'nav.classes', href: '/classes' },
      { labelKey: 'nav.teachers', href: '/teachers' },
      { labelKey: 'nav.exams', href: '/exams' },
      { labelKey: 'nav.pricing', href: '/pricing' },
      { labelKey: 'action.consult', href: '/contact' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { labelKey: 'nav.about', href: '/about' },
      { labelKey: 'footer.credits', href: '/credits' },
      { labelKey: 'nav.contact', href: '/contact' },
      { labelKey: 'home.faq.title', href: '/faq' },
    ],
  },
];

/**
 * Site footer.
 *
 * Contact details come from admin-managed settings, with sensible fallbacks so the footer
 * still renders if a setting has been deleted. The credits link is deliberately prominent —
 * this product's content is borrowed under licence, and the licence requires attribution.
 */
export function SiteFooter({ settings = {} }: { settings?: Record<string, string> }) {
  const { t, href } = useI18n();
  const setting = (key: string, fallback: string) => settings[key] || fallback;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t-2 border-ink-100 bg-white">
      <Squiggle className="h-3 w-full text-brand-300" tone="#CFC2FF" />
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
              {setting('footer.tagline', t('footer.tagline'))}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                {setting('contact.address', 'Hà Nội, Việt Nam')}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                <a
                  href={`tel:${setting('contact.hotline', '0912345678').replace(/\s/g, '')}`}
                  className="hover:text-brand-700 hover:underline"
                >
                  {setting('contact.hotline', '0912 345 678')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                <a
                  href={`mailto:${setting('contact.email', 'hello@tracyenglish.vn')}`}
                  className="hover:text-brand-700 hover:underline"
                >
                  {setting('contact.email', 'hello@tracyenglish.vn')}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                {setting('contact.hours', 'Thứ 2 – Thứ 7: 8:00 – 21:00')}
              </li>
            </ul>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.titleKey}>
              <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-ink-500">
                {t(column.titleKey)}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={href(link.href)}
                      className="text-sm font-semibold text-ink-700 transition-colors hover:text-brand-700"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t-2 border-ink-100 pt-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t('footer.rights')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={href('/credits')} className="font-semibold hover:text-brand-700">
              {t('footer.credits')}
            </Link>
            <Link href={href('/pages/terms')} className="hover:text-brand-700">
              Điều khoản
            </Link>
            <Link href={href('/pages/privacy')} className="hover:text-brand-700">
              Quyền riêng tư
            </Link>
          </div>
        </div>

        <p className="mt-6 rounded-2xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
          Học liệu trên nền tảng được sử dụng theo các giấy phép mở: VOA Learning English (phạm vi
          công cộng), Wiktionary (CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR), Wikimedia Commons và Lingua
          Libre, CEFR-J Wordlist và Octanove Vocabulary Profile (CC BY-SA 4.0).{' '}
          <Link href={href('/credits')} className="font-semibold text-brand-600 hover:underline">
            Xem chi tiết từng nguồn
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
