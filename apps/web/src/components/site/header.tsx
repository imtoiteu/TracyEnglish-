'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  PenLine,
  ScrollText,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react';

import { LOCALES, withLocale, type Locale } from '@tracy/localization';
import { ButtonLink, cn, Logo } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

type SessionUser = { name: string; role: string; email: string } | null;

type MenuItem = { key: string; href: string; icon: React.ReactNode; blurbKey?: string };

const LEARN_MENU: MenuItem[] = [
  { key: 'nav.vocabulary', href: '/vocabulary', icon: <Sparkles className="h-4 w-4" /> },
  { key: 'nav.grammar', href: '/grammar', icon: <ScrollText className="h-4 w-4" /> },
  { key: 'nav.listening', href: '/listening', icon: <Headphones className="h-4 w-4" /> },
  { key: 'nav.reading', href: '/reading', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'nav.writing', href: '/writing', icon: <PenLine className="h-4 w-4" /> },
  { key: 'nav.speaking', href: '/speaking', icon: <Mic className="h-4 w-4" /> },
];

const CENTRE_MENU: MenuItem[] = [
  { key: 'nav.classes', href: '/classes', icon: <Users className="h-4 w-4" /> },
  { key: 'nav.teachers', href: '/teachers', icon: <GraduationCap className="h-4 w-4" /> },
  { key: 'nav.pricing', href: '/pricing', icon: <Target className="h-4 w-4" /> },
  { key: 'nav.contact', href: '/contact', icon: <MessageCircle className="h-4 w-4" /> },
];

/**
 * The site header.
 *
 * Two dropdowns rather than a flat list of fifteen links: "Self-study" holds everything a
 * learner does alone, "The centre" everything involving a teacher. That split matches how
 * people actually arrive — either wanting to study now, or wanting to ask about classes.
 *
 * The whole thing collapses to a full-height sheet on mobile, because a Vietnamese learner
 * is far more likely to arrive on a phone than a laptop.
 */
export function SiteHeader({ user, announcement }: { user: SessionUser; announcement?: string }) {
  const { t, href, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<'learn' | 'centre' | 'account' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close every menu on navigation — otherwise a dropdown stays open over the new page.
  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenu(null);
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const isActive = (path: string) => pathname.startsWith(withLocale(path, locale));

  const dropdown = (items: MenuItem[]) => (
    <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-3xl border-2 border-ink-100 bg-white p-2 shadow-lift">
      {items.map((item) => (
        <Link
          key={item.href}
          href={href(item.href)}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
        >
          <span className="text-brand-500">{item.icon}</span>
          {t(item.key)}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {announcement ? (
        <div className="bg-ink-900 px-4 py-2 text-center text-sm font-semibold text-cream">
          {announcement}
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b-2 border-ink-100 bg-cream/90 backdrop-blur-md">
        <div className="container-page flex h-[4.5rem] items-center gap-4">
          <Link href={href('/')} aria-label={t('brand.name')} className="shrink-0">
            <Logo />
          </Link>

          <nav ref={navRef} className="ml-2 hidden items-center gap-1 lg:flex" aria-label={t('nav.menu')}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === 'learn' ? null : 'learn')}
                aria-expanded={menu === 'learn'}
                className={cn(
                  'flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold transition-colors',
                  isActive('/vocabulary') || isActive('/grammar') || isActive('/listening') || isActive('/reading')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                {t('nav.learn')}
                <ChevronDown className={cn('h-4 w-4 transition-transform', menu === 'learn' && 'rotate-180')} />
              </button>
              {menu === 'learn' ? dropdown(LEARN_MENU) : null}
            </div>

            <Link
              href={href('/courses')}
              className={cn(
                'rounded-2xl px-3 py-2 text-sm font-bold transition-colors',
                isActive('/courses') ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100',
              )}
            >
              {t('nav.courses')}
            </Link>

            <Link
              href={href('/exams')}
              className={cn(
                'rounded-2xl px-3 py-2 text-sm font-bold transition-colors',
                isActive('/exams') ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100',
              )}
            >
              {t('nav.exams')}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === 'centre' ? null : 'centre')}
                aria-expanded={menu === 'centre'}
                className={cn(
                  'flex items-center gap-1 rounded-2xl px-3 py-2 text-sm font-bold transition-colors',
                  isActive('/classes') || isActive('/teachers') || isActive('/pricing')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-700 hover:bg-ink-100',
                )}
              >
                {t('nav.tuition')}
                <ChevronDown className={cn('h-4 w-4 transition-transform', menu === 'centre' && 'rotate-180')} />
              </button>
              {menu === 'centre' ? dropdown(CENTRE_MENU) : null}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={href('/search')}
              aria-label={t('action.search')}
              className="hidden rounded-2xl p-2.5 text-ink-600 transition-colors hover:bg-ink-100 sm:block"
            >
              <Search className="h-5 w-5" />
            </Link>

            <LocaleSwitch />

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu(menu === 'account' ? null : 'account')}
                  aria-expanded={menu === 'account'}
                  className="flex items-center gap-2 rounded-2xl border-2 border-ink-200 bg-white px-3 py-1.5 text-sm font-bold text-ink-800 transition-colors hover:border-brand-300"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-extrabold text-white">
                    {user.name.trim().slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[8rem] truncate md:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {menu === 'account' ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-3xl border-2 border-ink-100 bg-white p-2 shadow-lift">
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                      <p className="truncate text-xs text-ink-500">{user.email}</p>
                    </div>
                    <div className="my-1 h-px bg-ink-100" />
                    <Link href={href('/dashboard')} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-brand-50">
                      <LayoutDashboard className="h-4 w-4 text-brand-500" />
                      {t('nav.dashboard')}
                    </Link>
                    {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                      <Link href={href('/teacher')} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-brand-50">
                        <GraduationCap className="h-4 w-4 text-teal-500" />
                        {t('nav.teacherArea')}
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href={href('/admin')} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-brand-50">
                        <Settings className="h-4 w-4 text-coral-500" />
                        {t('nav.admin')}
                      </Link>
                    )}
                    <div className="my-1 h-px bg-ink-100" />
                    <form action={href('/logout')} method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('action.logout')}
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href={href('/login')}
                  className="rounded-2xl px-3 py-2 text-sm font-bold text-ink-700 hover:bg-ink-100"
                >
                  {t('action.login')}
                </Link>
                <ButtonLink href={href('/register')} size="sm">
                  {t('action.startFree')}
                </ButtonLink>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t('nav.menu')}
              className="rounded-2xl p-2.5 text-ink-700 hover:bg-ink-100 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[60] bg-cream lg:hidden">
          <div className="flex h-[4.5rem] items-center justify-between px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('nav.close')}
              className="rounded-2xl p-2.5 text-ink-700 hover:bg-ink-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="h-[calc(100vh-4.5rem)] overflow-y-auto px-5 pb-16" aria-label={t('nav.menu')}>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-ink-400">{t('nav.learn')}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {LEARN_MENU.map((item) => (
                <Link
                  key={item.href}
                  href={href(item.href)}
                  className="flex items-center gap-2 rounded-2xl border-2 border-ink-100 bg-white px-3 py-3 text-sm font-bold text-ink-800"
                >
                  <span className="text-brand-500">{item.icon}</span>
                  {t(item.key)}
                </Link>
              ))}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-ink-400">{t('nav.tuition')}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CENTRE_MENU.map((item) => (
                <Link
                  key={item.href}
                  href={href(item.href)}
                  className="flex items-center gap-2 rounded-2xl border-2 border-ink-100 bg-white px-3 py-3 text-sm font-bold text-ink-800"
                >
                  <span className="text-coral-500">{item.icon}</span>
                  {t(item.key)}
                </Link>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <Link href={href('/courses')} className="block rounded-2xl bg-white px-4 py-3 font-bold text-ink-800 border-2 border-ink-100">
                {t('nav.courses')}
              </Link>
              <Link href={href('/exams')} className="block rounded-2xl bg-white px-4 py-3 font-bold text-ink-800 border-2 border-ink-100">
                {t('nav.exams')}
              </Link>
              <Link href={href('/credits')} className="block rounded-2xl bg-white px-4 py-3 font-bold text-ink-800 border-2 border-ink-100">
                {t('nav.credits')}
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {user ? (
                <>
                  <ButtonLink href={href('/dashboard')} size="lg">
                    {t('nav.dashboard')}
                  </ButtonLink>
                  <form action={href('/logout')} method="post">
                    <button type="submit" className="w-full rounded-2xl border-2 border-ink-200 px-4 py-3 font-bold text-rose-600">
                      {t('action.logout')}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <ButtonLink href={href('/register')} size="lg">
                    {t('action.startFree')}
                  </ButtonLink>
                  <ButtonLink href={href('/login')} variant="outline" size="lg">
                    {t('action.login')}
                  </ButtonLink>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}

function LocaleSwitch() {
  const { locale } = useI18n();
  const pathname = usePathname();
  return (
    <div className="flex items-center rounded-2xl border-2 border-ink-200 bg-white p-0.5" role="group" aria-label="Language">
      {LOCALES.map((code) => (
        <Link
          key={code}
          href={withLocale(pathname, code as Locale)}
          className={cn(
            'rounded-xl px-2.5 py-1 text-xs font-extrabold uppercase transition-colors',
            locale === code ? 'bg-brand-500 text-white' : 'text-ink-500 hover:text-ink-800',
          )}
          aria-current={locale === code ? 'true' : undefined}
        >
          {code}
        </Link>
      ))}
    </div>
  );
}
