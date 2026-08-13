'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Copy, Save, Trash2 } from 'lucide-react';

import { Alert, Button, Card, Field, Input, Select, Textarea, cn } from '@tracy/ui';

import {
  deleteResource,
  duplicateResource,
  saveResource,
  type AdminState,
} from '@/app/actions/admin';
import type { AdminField } from '@/lib/admin/resources';
import { useI18n } from '@/lib/i18n';

function SaveButton() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      <Save className="h-4 w-4" />
      {pending ? 'Đang lưu…' : t('action.save')}
    </Button>
  );
}

/**
 * The generic admin form.
 *
 * Fields render from the registry declaration, grouped into sections. JSON fields get a
 * monospace textarea with client-side validation feedback — an administrator pasting a
 * malformed transcript should find out before submitting, not after.
 */
export function ResourceForm({
  resourceKey,
  fields,
  values,
  relationOptions,
  recordId,
  deletable,
  duplicable,
  locale,
}: {
  resourceKey: string;
  fields: AdminField[];
  values: Record<string, string>;
  relationOptions: Record<string, { value: string; label: string }[]>;
  recordId: string;
  deletable: boolean;
  duplicable: boolean;
  locale: string;
}) {
  const { t } = useI18n();
  const [state, action] = useActionState<AdminState, FormData>(saveResource, null);
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  const groups = fields.reduce<Record<string, AdminField[]>>((accumulator, field) => {
    (accumulator[field.group ?? 'Khác'] ??= []).push(field);
    return accumulator;
  }, {});

  const checkJson = (name: string, text: string) => {
    if (!text.trim()) {
      setJsonErrors((previous) => ({ ...previous, [name]: '' }));
      return;
    }
    try {
      JSON.parse(text);
      setJsonErrors((previous) => ({ ...previous, [name]: '' }));
    } catch (error) {
      setJsonErrors((previous) => ({
        ...previous,
        [name]: error instanceof Error ? error.message : 'JSON không hợp lệ',
      }));
    }
  };

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-5">
        <input type="hidden" name="__resource" value={resourceKey} />
        <input type="hidden" name="__id" value={recordId || 'new'} />
        <input type="hidden" name="__locale" value={locale} />

        {state?.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state?.ok ? <Alert tone="success">{t('admin.saved')}</Alert> : null}

        {Object.entries(groups).map(([group, groupFields]) => (
          <Card key={group}>
            <h3 className="text-base">{group}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {groupFields.map((field) => {
                const wide =
                  field.type === 'textarea' ||
                  field.type === 'json' ||
                  field.type === 'blocks' ||
                  field.type === 'richtext' ||
                  field.type === 'jsonList';
                return (
                  <div key={field.name} className={cn(wide && 'md:col-span-2')}>
                    <Field
                      label={field.label}
                      htmlFor={`f-${field.name}`}
                      required={field.required}
                      hint={field.hint}
                      error={jsonErrors[field.name] || undefined}
                    >
                      <Control
                        field={field}
                        value={values[field.name] ?? ''}
                        options={relationOptions[field.name]}
                        onJsonChange={checkJson}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <SaveButton />
        </div>
      </form>

      {recordId ? (
        <div className="flex flex-wrap gap-3 border-t-2 border-ink-100 pt-4">
          {duplicable ? (
            <form action={duplicateResource}>
              <input type="hidden" name="__resource" value={resourceKey} />
              <input type="hidden" name="__id" value={recordId} />
              <input type="hidden" name="__locale" value={locale} />
              <Button type="submit" variant="outline">
                <Copy className="h-4 w-4" />
                {t('action.duplicate')}
              </Button>
            </form>
          ) : null}
          {deletable ? (
            <form action={deleteResource}>
              <input type="hidden" name="__resource" value={resourceKey} />
              <input type="hidden" name="__id" value={recordId} />
              <input type="hidden" name="__locale" value={locale} />
              <Button type="submit" variant="danger">
                <Trash2 className="h-4 w-4" />
                {t('action.delete')}
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Control({
  field,
  value,
  options,
  onJsonChange,
}: {
  field: AdminField;
  value: string;
  options?: { value: string; label: string }[];
  onJsonChange: (name: string, text: string) => void;
}) {
  const id = `f-${field.name}`;

  switch (field.type) {
    case 'boolean':
      return (
        <label className="flex items-center gap-2 rounded-2xl border-2 border-ink-200 bg-white px-4 py-2.5">
          <input
            id={id}
            type="checkbox"
            name={field.name}
            defaultChecked={value === 'on'}
            className="h-4 w-4 rounded accent-brand-600"
          />
          <span className="text-sm text-ink-700">Bật</span>
        </label>
      );

    case 'number':
      return <Input id={id} name={field.name} type="number" defaultValue={value} />;

    case 'date':
      return <Input id={id} name={field.name} type="date" defaultValue={value} />;

    case 'select':
      return (
        <Select id={id} name={field.name} defaultValue={value}>
          <option value="">—</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );

    case 'relation':
      return (
        <Select id={id} name={field.name} defaultValue={value}>
          <option value="">—</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      );

    case 'multiselect': {
      let selected: string[] = [];
      try {
        selected = JSON.parse(value || '[]');
      } catch {
        selected = [];
      }
      return (
        <div className="flex flex-wrap gap-2 rounded-2xl border-2 border-ink-200 bg-white p-3">
          {field.options?.map((option) => (
            <label
              key={option.value}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-ink-50 px-2.5 py-1.5 text-sm has-[:checked]:bg-brand-100 has-[:checked]:text-brand-800"
            >
              <input
                type="checkbox"
                name={field.name}
                value={option.value}
                defaultChecked={selected.includes(option.value)}
                className="h-3.5 w-3.5 accent-brand-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }

    case 'jsonList':
      return (
        <Textarea
          id={id}
          name={field.name}
          defaultValue={value}
          rows={field.rows ?? 5}
          placeholder="Mỗi dòng một mục"
        />
      );

    case 'json':
    case 'blocks':
      return (
        <Textarea
          id={id}
          name={field.name}
          defaultValue={value}
          rows={field.rows ?? 10}
          className="font-mono text-[0.8rem] leading-relaxed"
          spellCheck={false}
          onChange={(event) => onJsonChange(field.name, event.target.value)}
        />
      );

    case 'textarea':
    case 'richtext':
      return <Textarea id={id} name={field.name} defaultValue={value} rows={field.rows ?? 4} />;

    default:
      return <Input id={id} name={field.name} defaultValue={value} />;
  }
}
