'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';

import { cn } from '@tracy/ui';

import { useI18n } from '@/lib/i18n';

/**
 * Audio playback.
 *
 * Every clip on this platform is a recording of a person — a Lingua Libre volunteer saying
 * a word, or a VOA broadcaster reading an article. Nothing is synthesised, so the player
 * never needs a "this is a robot voice" caveat.
 *
 * Both players below degrade honestly: if a clip is missing they say so rather than
 * rendering a dead button.
 */

/** A small round button that speaks one word. Used on vocabulary cards and in lists. */
export function WordAudioButton({
  src,
  word,
  credit,
  size = 'md',
  className,
}: {
  src?: string | null;
  word: string;
  credit?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const dimensions = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];
  const icon = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }[size];

  const play = useCallback(() => {
    if (!src || failed) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
      audioRef.current.addEventListener('error', () => {
        setFailed(true);
        setPlaying(false);
      });
    }
    audioRef.current.currentTime = 0;
    setPlaying(true);
    void audioRef.current.play().catch(() => {
      setFailed(true);
      setPlaying(false);
    });
  }, [src, failed]);

  useEffect(() => () => audioRef.current?.pause(), []);

  if (!src || failed) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-300',
          dimensions,
          className,
        )}
        title={t('vocab.noAudio')}
        aria-label={t('vocab.noAudio')}
      >
        <Volume2 className={icon} aria-hidden="true" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={play}
      title={credit ? `${t('action.playAudio')} — ${credit}` : t('action.playAudio')}
      aria-label={`${t('action.playAudio')}: ${word}`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-soft transition-all hover:bg-sky-600 active:scale-95',
        playing && 'ring-4 ring-sky-500/30',
        dimensions,
        className,
      )}
    >
      <Volume2 className={cn(icon, playing && 'animate-pulse')} aria-hidden="true" />
    </button>
  );
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

/**
 * The full player used on listening lessons.
 *
 * Three things matter for a learner and are therefore present: a speed control (0.75× is
 * how an A2 learner survives a B1 broadcast), a fifteen-second rewind, and a visible
 * position so they can find the sentence they missed again.
 */
export function LessonAudioPlayer({
  src,
  title,
  attribution,
}: {
  src: string;
  title: string;
  attribution?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setFailed(true));
    } else {
      audio.pause();
    }
  };

  const seek = (seconds: number) => {
    const audio = ref.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, seconds));
  };

  const changeSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (ref.current) ref.current.playbackRate = next;
  };

  const format = (value: number) => {
    if (!Number.isFinite(value)) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  if (failed) {
    return (
      <div className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
        Không tải được bản thu này. Bạn vẫn có thể đọc lời thoại bên dưới.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-sky-200 bg-sky-50 p-5">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onError={() => setFailed(true)}
      >
        <track kind="captions" />
      </audio>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Tạm dừng' : 'Phát'}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-soft transition-colors hover:bg-sky-600"
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-sky-900">{title}</p>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.5}
            value={current}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Vị trí phát"
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sky-200 accent-sky-600"
          />
          <div className="mt-1 flex justify-between text-xs font-semibold text-sky-700">
            <span>{format(current)}</span>
            <span>{format(duration)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => seek(current - 15)}
            aria-label="Lùi 15 giây"
            title="Lùi 15 giây"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-700 shadow-soft transition-colors hover:bg-sky-100"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={changeSpeed}
            aria-label={`${t('listening.speed')} ${speed}×`}
            title={`${t('listening.speed')} ${speed}×`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-sky-700 shadow-soft transition-colors hover:bg-sky-100"
          >
            {speed}×
          </button>
        </div>
      </div>

      {attribution ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-sky-700">
          <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {attribution}
        </p>
      ) : null}
    </div>
  );
}
