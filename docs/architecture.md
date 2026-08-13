# Architecture notes

Decisions that are not obvious from the code, and why they were made.

## SQLite

Reads dominate by a wide margin: a page view is a handful of indexed selects against content that
changes when an administrator edits it. Writes are one row per exercise attempt, one per review,
one per lesson completion. SQLite handles that comfortably, and it removes an entire class of
deployment problem for a language centre that does not have a database administrator.

Nothing in the application references SQLite directly. Changing the `datasource` provider in
`prisma/schema.prisma` to `postgresql` and re-running `db:push` is the whole migration.

## JSON in text columns

SQLite has no array or JSON type, so structured fields (`skills`, `outcomesVi`, `transcript`,
`blocks`) are stored as text. Every read goes through `parseJson`/`parseArray` in `src/lib/json.ts`,
which returns a fallback rather than throwing — a malformed value must not blank a page.

The alternative, a join table per list, would have added a dozen tables to model data that is
never queried by its elements.

## Server-side grading

`POST /api/exercises/grade` reads the exercise fresh, grades with `@tracy/exercise-engine`, and
returns the verdict plus the model answer. The answer key is never serialised into the page.

`src/lib/exercises.ts` is the boundary: it converts a Prisma row into the shape the client
component receives, dropping `answer` and `explanationVi`. Any new question type must go through
it.

## Partial credit

Binary right/wrong is a poor signal for a language learner. The engine awards:

- **0.5** for a near-miss on a typed answer, judged by edit distance scaled to word length — so
  `enviroment` is a spelling slip, but `cat` for `car` is a wrong answer.
- **proportional credit** for matching and word-order tasks, since getting three of four right is
  not the same as getting none.
- **penalised credit** for multiple-select, so ticking everything scores zero.

## Spaced repetition

Leitner boxes give the schedule its shape; an SM-2-style ease factor stretches it per word. A
word a learner keeps forgetting returns sooner than an easy one in the same box. Box 0 schedules
ten minutes away rather than a day, so a forgotten word reappears in the same session — which is
the entire point of box zero.

Self-grading (`again` / `hard` / `good` / `easy`) is deliberate. Only the learner knows whether
they recalled the word or guessed it.

## Days in Asia/Ho_Chi_Minh

Streaks and the activity chart bucket by local day, not UTC. A learner revising at 11pm in Hanoi
should not have it counted as tomorrow, and losing a streak to a timezone bug is exactly the kind
of thing that makes someone stop using a product.

## The admin resource registry

Twenty content types differ only in which columns to list and which fields to edit. Declaring
that as data in `src/lib/admin/resources.ts` and rendering it with two generic pages removes
about two thousand lines of near-duplicate code — and, more importantly, makes every editing
screen behave the same way.

The registry is also the security boundary. `saveResource` writes only fields the registry
declares for that resource, so a crafted form post cannot set `role` on a course or reach a table
that was never registered.

## Locale routing

Middleware redirects an unprefixed path to `/vi` or `/en`, defaulting to Vietnamese and only
choosing English when `Accept-Language` ranks it above Vietnamese. A previously chosen locale
wins over the header.

Interface language is what the locale selects. Study language is English and is never translated
away — a vocabulary card shows the English word, its IPA and English examples in both locales.
What changes is the explanation around them.

## Audio

Article audio streams from VOA's public-domain CDN by URL rather than being committed; the field
`audioPath` exists for a locally cached copy when a deployment wants one.

Word pronunciation is downloaded, transcoded to mono Ogg Vorbis at 40 kbps and committed, because
a learner tapping a word expects sound instantly and the whole set is around 20 MB.

Where no human recording exists, the UI says so and shows a disabled control. Filling the gap
with synthesis would be worse than the gap: a learner copies what they hear.

## What is deliberately not automated

**Essay grading.** Automatic scoring rewards a well-formed empty answer and punishes a clumsy
good one — the opposite of useful feedback. The writing section routes to sentence-level grammar
practice and to a teacher.

**Speaking assessment.** A web page cannot hear the learner. The speaking section gives models to
copy, minimal pairs chosen for Vietnamese speakers, and a route to a one-to-one session.

Both are stated plainly on their pages rather than papered over.
