'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Headphones,
  History,
  LayoutDashboard,
  Layers,
  ListChecks,
  Megaphone,
  MessageSquare,
  Quote,
  Route,
  ScrollText,
  Settings,
  Sparkles,
  Tag,
  Upload,
  Users,
} from 'lucide-react';

import { cn } from '@tracy/ui';

import { RESOURCES, RESOURCE_GROUPS } from '@/lib/admin/resources';
import { useI18n } from '@/lib/i18n';

const ICONS: Record<string, typeof BookOpen> = {
  'book-open': BookOpen,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'help-circle': HelpCircle,
  headphones: Headphones,
  layers: Layers,
  'list-checks': ListChecks,
  megaphone: Megaphone,
  quote: Quote,
  route: Route,
  'scroll-text': ScrollText,
  sparkles: Sparkles,
  tag: Tag,
  users: Users,
};

/**
 * Admin navigation.
 *
 * Grouped the way an administrator's day is grouped — content they author, people they
 * manage, operations they run, website copy they tweak — rather than by database table.
 */
export function AdminNav({
  newConsultations,
  draftCount,
}: {
  newConsultations: number;
  draftCount: number;
}) {
  const { href } = useI18n();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === href(path) || pathname.startsWith(`${href(path)}/`);

  const link = (
    path: string,
    label: string,
    Icon: typeof BookOpen,
    badge?: number,
  ) => (
    <Link
      key={path}
      href={href(path)}
      className={cn(
        'flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors',
        isActive(path)
          ? 'bg-brand-100 text-brand-800'
          : 'text-ink-600 hover:bg-white hover:text-ink-900',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-coral-500 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <nav className="space-y-6 rounded-3xl border-2 border-ink-100 bg-white p-4 shadow-soft lg:sticky lg:top-6" aria-label="Điều hướng quản trị">
      <div className="space-y-1">
        {link('/admin', 'Tổng quan', LayoutDashboard)}
        {link('/admin/consultations', 'Yêu cầu tư vấn', MessageSquare, newConsultations)}
        {link('/admin/import', 'Nhập dữ liệu', Upload)}
      </div>

      {RESOURCE_GROUPS.map((group) => {
        const items = RESOURCES.filter((resource) => resource.group === group.key);
        if (!items.length) return null;
        return (
          <div key={group.key}>
            <p className="px-3 pb-1.5 text-[0.68rem] font-extrabold uppercase tracking-widest text-ink-400">
              {group.labelVi}
            </p>
            <div className="space-y-1">
              {items.map((resource) =>
                link(
                  `/admin/${resource.key}`,
                  resource.labelPluralVi,
                  ICONS[resource.icon] ?? BookOpen,
                  resource.key === 'lessons' ? draftCount : undefined,
                ),
              )}
            </div>
          </div>
        );
      })}

      <div>
        <p className="px-3 pb-1.5 text-[0.68rem] font-extrabold uppercase tracking-widest text-ink-400">
          Hệ thống
        </p>
        <div className="space-y-1">
          {link('/admin/settings', 'Cài đặt website', Settings)}
          {link('/admin/audit', 'Nhật ký thay đổi', History)}
        </div>
      </div>
    </nav>
  );
}
