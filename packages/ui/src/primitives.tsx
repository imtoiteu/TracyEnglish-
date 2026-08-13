import Link from 'next/link';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { accentStyles, cn, CEFR_ACCENT, type Accent } from './cn';

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'pop';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all ' +
  'duration-150 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-lift active:translate-y-px',
  secondary:
    'bg-coral-500 text-white shadow-soft hover:bg-coral-600 hover:shadow-lift active:translate-y-px',
  outline:
    'border-2 border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  // The chunky offset-shadow button used for the most important call to action.
  pop: 'border-2 border-ink-900 bg-sun-300 text-ink-900 shadow-pop hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgb(26_22_51_/_0.9)] active:translate-y-0 active:shadow-pop-sm',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-[0.95rem]',
  lg: 'px-7 py-3.5 text-base',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href: string;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  as: Tag = 'div',
  interactive = false,
  className,
  children,
  ...props
}: { as?: ElementType; interactive?: boolean; className?: string; children: ReactNode } & Record<
  string,
  unknown
>) {
  return (
    <Tag className={cn(interactive ? 'card-interactive' : 'card', className)} {...props}>
      {children}
    </Tag>
  );
}

export function Eyebrow({
  children,
  accent = 'brand',
  className,
}: {
  children: ReactNode;
  accent?: Accent;
  className?: string;
}) {
  const styles = accentStyles(accent);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest',
        styles.chip,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  accent = 'brand',
  align = 'left',
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  accent?: Accent;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : '',
        action ? 'sm:flex-row sm:items-end sm:justify-between' : '',
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? <Eyebrow accent={accent}>{eyebrow}</Eyebrow> : null}
        <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
        {lead ? <p className="mt-3 text-base leading-relaxed text-ink-600">{lead}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges and chips
// ---------------------------------------------------------------------------

export function Badge({
  children,
  accent = 'brand',
  className,
}: {
  children: ReactNode;
  accent?: Accent;
  className?: string;
}) {
  const styles = accentStyles(accent);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        styles.chip,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** The CEFR level badge. Same colour ramp everywhere in the product. */
export function LevelBadge({ level, className }: { level: string; className?: string }) {
  const accent = CEFR_ACCENT[level] ?? 'brand';
  return (
    <Badge accent={accent} className={cn('font-mono tracking-wide', className)}>
      {level}
    </Badge>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const accent: Accent =
    status === 'PUBLISHED' || status === 'ACTIVE' || status === 'ENROLLED'
      ? 'teal'
      : status === 'DRAFT' || status === 'NEW'
        ? 'sun'
        : status === 'ARCHIVED' || status === 'CANCELLED' || status === 'CLOSED'
          ? 'ink'
          : 'brand';
  return <Badge accent={accent}>{label ?? status}</Badge>;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  accent = 'brand',
  className,
  label,
}: {
  value: number;
  accent?: Accent;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const styles = accentStyles(accent);
  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-ink-500">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      ) : null}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', styles.bgSolid)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/** A circular progress ring, used on the dashboard for daily goals and mastery. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 8,
  accent = 'brand',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  accent?: Accent;
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const styles = accentStyles(accent);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-ink-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn('transition-[stroke-dashoffset] duration-700', styles.text)}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-ink-800">
        {children ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats, empty states, alerts
// ---------------------------------------------------------------------------

export function Stat({
  value,
  label,
  accent = 'brand',
  icon,
}: {
  value: ReactNode;
  label: ReactNode;
  accent?: Accent;
  icon?: ReactNode;
}) {
  const styles = accentStyles(accent);
  return (
    <div className="rounded-3xl border-2 border-ink-100 bg-white p-5 shadow-soft">
      {icon ? (
        <span
          className={cn(
            'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl',
            styles.bg,
            styles.text,
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className={cn('font-display text-3xl font-extrabold', styles.text)}>{value}</div>
      <div className="mt-1 text-sm leading-snug text-ink-600">{label}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center">
      {icon ? <span className="text-ink-300">{icon}</span> : null}
      <p className="font-display text-lg font-bold text-ink-800">{title}</p>
      {description ? <p className="max-w-md text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'error';
  title?: ReactNode;
  children?: ReactNode;
}) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-teal-200 bg-teal-50 text-teal-900',
    warning: 'border-sun-200 bg-sun-50 text-sun-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
  } as const;
  return (
    <div className={cn('rounded-2xl border-2 px-4 py-3 text-sm', tones[tone])} role="status">
      {title ? <p className="font-bold">{title}</p> : null}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink-800">
        {label}
        {required ? <span className="ml-1 text-coral-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-xs text-ink-500">{hint}</p> : null}
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-2xl border-2 border-ink-200 bg-white px-4 py-2.5 text-[0.95rem] text-ink-900 ' +
  'placeholder:text-ink-400 transition-colors focus:border-brand-400 focus:outline-none ' +
  'disabled:bg-ink-50 disabled:text-ink-400';

export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<'textarea'>) {
  return <textarea className={cn(CONTROL, 'min-h-[7rem] leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentPropsWithoutRef<'select'>) {
  return (
    <select className={cn(CONTROL, 'appearance-none pr-10', className)} {...props}>
      {children}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Tables (used heavily by the admin panel)
// ---------------------------------------------------------------------------

export function DataTable({
  columns,
  children,
  caption,
}: {
  columns: ReactNode[];
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="scroll-x rounded-3xl border-2 border-ink-100 bg-white shadow-soft">
      <table className="w-full min-w-[42rem] text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b-2 border-ink-100 bg-ink-50/60">
            {columns.map((column, index) => (
              <th key={index} scope="col" className="px-4 py-3 font-bold text-ink-600">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ className, children, ...props }: ComponentPropsWithoutRef<'td'>) {
  return (
    <td className={cn('px-4 py-3 align-middle text-ink-800', className)} {...props}>
      {children}
    </td>
  );
}
