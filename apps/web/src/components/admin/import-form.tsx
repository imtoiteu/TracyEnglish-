'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertTriangle, CheckCircle2, Upload } from 'lucide-react';

import { Alert, Button, Card, Field, Select, Textarea } from '@tracy/ui';

import { runImport, type ImportState } from '@/app/actions/import';

const KINDS = [
  {
    value: 'vocabulary',
    label: 'Từ vựng',
    columns: 'word, cefr, ipaUk, ipaUs, meaningVi, explanationVi, partsOfSpeech, audioPath, audioCredit',
    sample:
      'word,cefr,ipaUk,meaningVi,partsOfSpeech\nresilient,B2,/rɪˈzɪl.i.ənt/,"kiên cường, bền bỉ",adjective\nmitigate,C1,/ˈmɪt.ɪ.ɡeɪt/,"giảm nhẹ, làm dịu",verb',
  },
  {
    value: 'exercises',
    label: 'Bài tập / ngân hàng câu hỏi',
    columns: 'type, skill, cefr, promptVi, promptEn, options, answer, explanationVi, grammarTopicSlug, attribution',
    sample:
      'type,skill,cefr,promptEn,options,answer,explanationVi\nMULTIPLE_CHOICE,grammar,A2,She ___ to school every day.,go;goes;going,goes,"Chủ ngữ she là ngôi thứ ba số ít nên động từ thêm -s."',
  },
  {
    value: 'reading',
    label: 'Bài đọc',
    columns: 'slug, titleVi, titleEn, kind, series, cefr, summaryVi, body, attribution, sourceUrl',
    sample:
      'slug,titleVi,cefr,body\nmy-first-passage,Bài đọc thử,B1,"Đoạn thứ nhất.\\n\\nĐoạn thứ hai."',
  },
  {
    value: 'faq',
    label: 'Câu hỏi thường gặp',
    columns: 'questionVi, answerVi, questionEn, answerEn, category',
    sample:
      'questionVi,answerVi,category\nTrung tâm có lớp cuối tuần không?,"Có, lớp cuối tuần học sáng thứ 7 và Chủ nhật.",classes',
  },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      <Upload className="h-4 w-4" />
      {pending ? 'Đang xử lý…' : 'Chạy nhập dữ liệu'}
    </Button>
  );
}

/**
 * The bulk import form.
 *
 * Defaults to a dry run, on purpose: an administrator pasting 400 rows should see the
 * validation report before anything is written, and has to actively untick the box to
 * commit.
 */
export function ImportForm() {
  const [state, action] = useActionState<ImportState, FormData>(runImport, null);
  const [kind, setKind] = useState<string>('vocabulary');

  const spec = KINDS.find((option) => option.value === kind) ?? KINDS[0];

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-5">
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Loại dữ liệu" htmlFor="kind">
              <Select id="kind" name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>
                {KINDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Định dạng" htmlFor="format">
              <Select id="format" name="format" defaultValue="csv">
                <option value="csv">CSV (dán từ Excel / Google Sheets)</option>
                <option value="json">JSON (mảng đối tượng)</option>
              </Select>
            </Field>
            <Field label="Chế độ" htmlFor="dryRun">
              <label className="flex items-center gap-2 rounded-2xl border-2 border-ink-200 bg-white px-4 py-2.5">
                <input
                  id="dryRun"
                  type="checkbox"
                  name="dryRun"
                  defaultChecked
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="text-sm text-ink-700">Chạy thử, chưa ghi</span>
              </label>
            </Field>
          </div>

          <div className="mt-4 rounded-2xl bg-ink-50 p-4 text-sm">
            <p className="font-bold text-ink-800">Cột hỗ trợ</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-ink-600">{spec.columns}</p>
            <p className="mt-3 font-bold text-ink-800">Ví dụ</p>
            <pre className="scroll-x mt-1 whitespace-pre rounded-xl bg-white p-3 font-mono text-[0.7rem] leading-relaxed text-ink-600">
              {spec.sample}
            </pre>
          </div>

          <div className="mt-4">
            <Field label="Dữ liệu" htmlFor="payload" required>
              <Textarea
                id="payload"
                name="payload"
                rows={14}
                required
                className="font-mono text-[0.8rem]"
                spellCheck={false}
                placeholder="Dán dữ liệu vào đây…"
              />
            </Field>
          </div>
        </Card>

        {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

        <SubmitButton />
      </form>

      {state?.report ? (
        <Card className={state.report.dryRun ? 'border-sky-200 bg-sky-50/60' : 'border-teal-200 bg-teal-50/60'}>
          <h3 className="flex items-center gap-2 text-lg">
            {state.report.dryRun ? (
              <AlertTriangle className="h-5 w-5 text-sky-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            )}
            {state.report.dryRun ? 'Kết quả chạy thử' : 'Đã nhập xong'}
          </h3>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Dòng đọc được', value: state.report.parsed },
              { label: state.report.dryRun ? 'Sẽ tạo mới' : 'Đã tạo mới', value: state.report.created },
              { label: 'Đã cập nhật', value: state.report.updated },
              { label: 'Bỏ qua', value: state.report.skipped },
            ].map((row) => (
              <div key={row.label} className="rounded-2xl bg-white p-3 text-center">
                <dt className="text-xs font-bold uppercase tracking-widest text-ink-400">{row.label}</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold text-ink-900">{row.value}</dd>
              </div>
            ))}
          </dl>

          {state.report.preview.length ? (
            <div className="mt-4">
              <p className="text-sm font-bold text-ink-800">Xem trước</p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-ink-600">
                {state.report.preview.map((line, index) => (
                  <li key={index} className="truncate">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.report.problems.length ? (
            <div className="mt-4">
              <p className="text-sm font-bold text-rose-700">Vấn đề gặp phải</p>
              <ul className="mt-2 space-y-1 text-xs text-rose-700">
                {state.report.problems.map((problem, index) => (
                  <li key={index}>{problem}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {state.report.dryRun ? (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-ink-700">
              Chưa có gì được ghi vào cơ sở dữ liệu. Bỏ chọn “Chạy thử, chưa ghi” rồi chạy lại để
              nhập thật.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
