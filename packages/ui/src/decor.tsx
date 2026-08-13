import { cn } from './cn';

/**
 * Decorative pieces.
 *
 * All of it is inline SVG drawn for this project — no icon fonts, no stock illustration.
 * Everything here is `aria-hidden`, because none of it carries meaning a screen reader
 * needs, and all of it respects `prefers-reduced-motion` through the global stylesheet.
 */

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
          <defs>
            <linearGradient id="tracy-logo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6D4AFF" />
              <stop offset="100%" stopColor="#FF7A45" />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="37" height="37" rx="12" fill="url(#tracy-logo)" />
          {/* A speech mark and a book spine: talking, and reading. */}
          <path
            d="M12 25.5V15.5c0-1.1.9-2 2-2h5.2c1.5 0 2.8 1.2 2.8 2.8 0 1.6-1.3 2.8-2.8 2.8H15"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22.5 26.5c2.9-.6 5-3.1 5-6.1"
            fill="none"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-xl font-extrabold leading-none tracking-tight text-ink-900">
          Tracy<span className="text-brand-600">English</span>
        </span>
      )}
    </span>
  );
}

/** The wavy divider used between page sections. */
export function Squiggle({ className, tone = '#CFC2FF' }: { className?: string; tone?: string }) {
  return (
    <svg
      viewBox="0 0 1200 16"
      preserveAspectRatio="none"
      className={cn('block', className)}
      aria-hidden="true"
    >
      <path
        d="M0 8c50-8 100-8 150 0s100 8 150 0 100-8 150 0 100 8 150 0 100-8 150 0 100 8 150 0 100-8 150 0"
        fill="none"
        stroke={tone}
        strokeWidth="3"
      />
    </svg>
  );
}

/** Soft blurred colour fields behind hero sections. */
export function HeroGlow({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="absolute -right-16 top-16 h-80 w-80 rounded-full bg-coral-200/45 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-200/40 blur-3xl" />
    </div>
  );
}

export function DottedGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 bg-grid-soft bg-grid opacity-70', className)}
      aria-hidden="true"
    />
  );
}

/**
 * The hero illustration: a stack of study cards showing what the product actually does —
 * an English word, its phonetics, its Vietnamese meaning, and a waveform for the audio.
 */
export function StudyCardStack({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)} aria-hidden="true">
      <div className="absolute inset-x-6 top-8 h-56 rotate-[-6deg] rounded-3xl border-2 border-ink-100 bg-white/70 shadow-soft" />
      <div className="absolute inset-x-3 top-4 h-56 rotate-[3deg] rounded-3xl border-2 border-ink-100 bg-white/85 shadow-soft" />
      <div className="relative rounded-3xl border-2 border-ink-100 bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-3xl font-extrabold text-ink-900">environment</p>
            <p className="ipa mt-1 text-lg">/ɪnˈvaɪ.rə.mənt/</p>
          </div>
          <span className="rounded-full bg-brand-100 px-2.5 py-1 font-mono text-xs font-bold text-brand-700">
            B1
          </span>
        </div>
        <p className="mt-4 text-lg font-bold text-teal-700">môi trường</p>
        <p className="mt-1 text-sm text-ink-500">
          Toàn bộ những điều kiện tự nhiên và xã hội xung quanh con người.
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-sky-50 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="flex h-6 items-end gap-[3px]">
            {[7, 14, 22, 11, 18, 9, 16, 24, 12, 8, 15, 20, 10].map((height, index) => (
              <span
                key={index}
                className="w-[3px] rounded-full bg-sky-400"
                style={{ height: `${height}px` }}
              />
            ))}
          </span>
          <span className="ml-auto text-xs font-semibold text-sky-700">Giọng bản xứ</span>
        </div>
        <p className="mt-4 border-l-4 border-sun-300 pl-3 text-sm italic text-ink-700">
          We must protect the environment.
          <span className="mt-0.5 block not-italic text-ink-500">
            Chúng ta phải bảo vệ môi trường.
          </span>
        </p>
      </div>
    </div>
  );
}

/** Small inline waveform used on listening cards. */
export function Waveform({ className, bars = 18 }: { className?: string; bars?: number }) {
  const heights = Array.from({ length: bars }, (_, index) => 6 + ((index * 7) % 16));
  return (
    <span className={cn('flex h-6 items-end gap-[2px]', className)} aria-hidden="true">
      {heights.map((height, index) => (
        <span
          key={index}
          className="w-[2px] rounded-full bg-current opacity-70"
          style={{ height: `${height}px` }}
        />
      ))}
    </span>
  );
}
