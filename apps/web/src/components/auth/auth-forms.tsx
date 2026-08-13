'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { SEGMENTS } from '@tracy/curriculum';
import { Alert, Button, Field, Input, Select } from '@tracy/ui';

import { loginAction, registerAction, type AuthState } from '@/app/actions/auth';
import { useI18n } from '@/lib/i18n';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? '…' : label}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const { t, locale, href } = useI18n();
  const [state, action] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state?.error ? <Alert tone="error">{t(state.error)}</Alert> : null}

      <Field label={t('common.email')} htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ban@example.com"
        />
      </Field>

      <Field label={t('common.password')} htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      <SubmitButton label={t('action.login')} />

      <p className="text-center text-sm text-ink-600">
        {t('auth.noAccount')}{' '}
        <Link href={href('/register')} className="font-bold text-brand-600 hover:underline">
          {t('action.register')}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const { t, locale, href } = useI18n();
  const [state, action] = useActionState<AuthState, FormData>(registerAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state?.error && !state.field ? <Alert tone="error">{t(state.error)}</Alert> : null}

      <Field
        label={t('common.name')}
        htmlFor="name"
        required
        error={state?.field === 'name' ? t(state.error!) : undefined}
      >
        <Input id="name" name="name" autoComplete="name" required placeholder="Nguyễn Văn A" />
      </Field>

      <Field
        label={t('common.email')}
        htmlFor="email"
        required
        error={state?.field === 'email' ? t(state.error!) : undefined}
      >
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label={t('common.phone')} htmlFor="phone" hint="Không bắt buộc — dùng để trung tâm liên hệ tư vấn.">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0912 345 678" />
      </Field>

      <Field label={t('auth.segment')} htmlFor="segment">
        <Select id="segment" name="segment" defaultValue="ADULT">
          {SEGMENTS.map((segment) => (
            <option key={segment} value={segment}>
              {t(`segment.${segment}`)}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={t('common.password')}
        htmlFor="password"
        required
        hint="Ít nhất 8 ký tự."
        error={state?.field === 'password' ? t(state.error!) : undefined}
      >
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>

      <SubmitButton label={t('action.register')} />

      <p className="text-center text-sm text-ink-600">
        {t('auth.hasAccount')}{' '}
        <Link href={href('/login')} className="font-bold text-brand-600 hover:underline">
          {t('action.login')}
        </Link>
      </p>
    </form>
  );
}
