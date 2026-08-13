# Authoring guide

For teachers and administrators writing content in the admin panel.

## The seven-part lesson

Every lesson on the platform follows the same shape. It is not decoration: a learner working
alone needs to know what they are about to learn, see it explained, see it used, try it, find out
whether they were right, be reminded of the point, and be told where to go next. Miss any of the
seven and self-study breaks down somewhere.

| Stage | Block type | What belongs here |
| --- | --- | --- |
| Objective | `objective` | One sentence, in Vietnamese, saying what the learner will be able to *do*. Not "learn the present perfect" — "phân biệt được hiện tại hoàn thành với quá khứ đơn". |
| Explanation | `prose`, `grammar`, `tip` | The teaching. Name the Vietnamese-language interference explicitly. |
| Examples | `examples`, `table` | Bilingual model sentences, or a form table. |
| Practice | `practice` | The lesson's exercises. Every question must test what the explanation taught. |
| Feedback | (automatic) | Comes from each exercise's `explanationVi`. Write it as if the learner got it wrong. |
| Summary | `summary` | Two or three sentences, plus optional bullet points. |
| Next step | `nextStep` | Where to go, with a real link. |

## Content blocks

A lesson body is a JSON array of blocks. The editor shows it as raw JSON — it is a small format
and staying close to it beats a rich-text editor that hides structure.

```json
[
  { "type": "objective", "vi": "Nói được về thói quen hằng ngày." },
  { "type": "prose", "vi": "Hiện tại đơn dùng cho **thói quen**…" },
  { "type": "tip", "tone": "warning", "titleVi": "Lỗi hay gặp", "vi": "Quên -s ở ngôi thứ ba." },
  { "type": "examples", "items": [{ "en": "She works here.", "vi": "Cô ấy làm ở đây.", "note": "-s" }] },
  { "type": "table", "titleVi": "Công thức", "headers": ["Ngôi", "Động từ"], "rows": [["I / You", "V"]] },
  { "type": "grammar", "slug": "present-simple", "sections": ["theory", "patterns", "pitfalls"] },
  { "type": "vocabList", "slug": "cefr-a1", "limit": 24 },
  { "type": "listening", "slug": "listen-...", "taskVi": "Nghe lần đầu không nhìn lời thoại." },
  { "type": "reading", "slug": "read-...", "taskVi": "Đọc lần đầu không tra từ." },
  { "type": "practice", "introVi": "Bài tập dùng chính câu ví dụ ở trên." },
  { "type": "summary", "vi": "…", "points": ["…"] },
  { "type": "nextStep", "vi": "…", "href": "/grammar/present-continuous", "labelVi": "Học tiếp" }
]
```

Blocks that reference content by slug (`grammar`, `vocabList`, `listening`, `reading`) pull the
live record. When that record gains a word or a paragraph, every lesson using it gains it too —
so never copy content into a lesson that already exists as a record.

Text in `prose`, `tip`, `summary` and grammar theory supports `**bold**`, `*italic*`, `` `code` ``
and blank-line paragraph breaks. Nothing else; everything is escaped first.

## Writing a Vietnamese grammar explanation

The reason a Vietnamese explanation is worth writing at all is that it can say *why* the mistake
happens. A translated English explanation cannot.

Good:

> Tiếng Việt nói "Tôi mệt" mà không cần từ nào giữa "tôi" và "mệt". Tiếng Anh bắt buộc phải có
> *am*: **I am tired**. Bỏ động từ to be là lỗi phổ biến nhất của người mới học.

Weak:

> The verb "to be" is used to describe states. It changes form according to the subject.

Checklist:

- Name the Vietnamese structure the learner is transferring from.
- Show the wrong sentence and the right one, in that order.
- Say what to check when proofreading their own writing.
- Keep it under about 400 words. Longer is not more thorough, it is less read.

## Writing exercises

Practice must be connected to the teaching. An exercise that could appear in any lesson belongs
in none.

- **Gap-fill**: blank the span the lesson is about, never a random word.
- **Multiple choice**: distractors should be *plausibly* wrong — a wrong answer the learner might
  actually pick teaches something; an absurd one teaches nothing.
- **Explanation**: written for the learner who got it wrong. State the rule, then apply it to
  this sentence.
- **Attribution**: if you edit a question that came from a corpus, update the attribution field
  or clear it. Leaving someone else's name on your sentence is worse than no credit.

Several accepted answers go in one field, separated by `|`: `don't|do not`.

## Importing in bulk

`Admin → Nhập dữ liệu` takes CSV pasted from a spreadsheet or a JSON array, for vocabulary,
question banks, reading passages and FAQ entries. Every import runs as a dry run first and shows
what it would create, update and skip, with per-row problems. Untick the dry-run box to commit.

Vocabulary and reading imports **upsert** by `word` and `slug`, so re-importing a corrected file
fixes rows rather than duplicating them.

## Publishing

`DRAFT` is invisible to learners. `PUBLISHED` is live. `ARCHIVED` is retired but kept — use it
instead of deleting, so links from old lessons do not break.

Duplicating a record always produces a `DRAFT` with a fresh slug, so a copy can never go live by
accident.
