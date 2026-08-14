<div align="center">

# Tracy English

**An English learning platform and language centre, built for Vietnamese learners.**

Vietnamese-first · real licensed content · no synthetic speech

</div>

---

## What this is

One product with two halves that share a single database:

1. **A learning platform.** A dictionary of 8,400 CEFR-levelled words with human pronunciation
   and Vietnamese meanings, 32 grammar topics explained in Vietnamese, and roughly a thousand
   listening and reading pieces with real broadcast audio — plus spaced-repetition review,
   progress tracking and a placement test.
2. **A language centre.** Teacher profiles, classes online and at the centre, one-to-one and
   small-group tuition, a working enquiry pipeline, and an admin panel that manages all of it.

The core journey works end to end and there is a test that proves it: register → enrol → open a
lesson → answer an exercise → get graded on the server → progress moves → a word enters the
review schedule.

## The content principle

**Nothing on this platform is machine-generated teaching content, and no audio is synthesised.**

Every word, sentence, recording, article and transcript comes from an openly licensed corpus and
carries its licence and attribution through to the page a learner reads.

| What | Source | Licence |
| --- | --- | --- |
| CEFR level of every word | CEFR-J Wordlist 1.5 · Octanove Vocabulary Profile 1.0 | CC BY-SA 4.0 |
| IPA, English definitions, inflections | English Wiktionary | CC BY-SA 4.0 |
| Vietnamese meanings | Wiktionary tiếng Việt (largely the Free Vietnamese Dictionary Project) | CC BY-SA 4.0 |
| Pronunciation recordings | Wikimedia Commons · Lingua Libre | CC BY-SA / CC BY / CC0 |
| Bilingual example sentences | Tatoeba (English–Vietnamese) | CC BY 2.0 FR |
| Listening, reading, transcripts, glossaries | VOA Learning English | Public domain (US Government work) |
| Grammar levelling and criterial features | CEFR-J Grammar Profile | CC BY-SA 4.0 |

**Written for this platform:** the Vietnamese grammar explanations, the "mistakes Vietnamese
learners make" notes, the course structure, and the centre's own copy. There is no openly
licensed Vietnamese-language English grammar reference to reuse, and machine-translating an
English explanation defeats the purpose — the value of a Vietnamese explanation is that it names
the specific interference from Vietnamese (no verb inflection, no articles, no plural marking)
that causes the error. Those sections are labelled as editorial in the UI.

The `/credits` page renders the full register at runtime, from the database.

## What is in the database after seeding

```
vocabulary   8,426   words, 91% with a Vietnamese meaning, 97% with IPA
audio        2,661   human pronunciation recordings (32% of the dictionary, 83% of A1–B1)
examples    12,636   bilingual example sentences with per-sentence credit
grammar         32   topics, A1–C1, each with theory, patterns, pitfalls and practice
listening      440   pieces with real broadcast audio and full transcripts
reading        569   graded passages, ~455,000 words of text
exercises    7,700+  all derived from the sourced material above
courses         14   across 11 tracks, 28 modules, 104 lessons
```

## Quick start

```bash
npm install
npm run db:push          # create the SQLite database from the Prisma schema
npm run db:seed          # load content/ into it (~60s)
npm run dev              # http://localhost:3000 → redirects to /vi
```

Demo accounts created by the seed:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tracyenglish.vn` | `Admin@2026` |
| Teacher | `tracy@tracyenglish.vn` | `Teacher@2026` |
| Student | `linh@example.com` | `Student@2026` |

## The content pipeline

`content/` is committed, so a clone can seed and run without touching the network. To refresh or
extend it:

```bash
npm run content:ingest        # all seven stages, resuming from cache
python3 scripts/ingest/run_all.py 5   # just the pronunciation-audio stage
npm run content:stats         # coverage report, including the gaps
```

| Stage | What it does |
| --- | --- |
| 1 | Build the CEFR-levelled headword list from the vocabulary profiles |
| 2 | Enrich every headword from English and Vietnamese Wiktionary |
| 3 | Load Tatoeba English–Vietnamese sentence pairs and index them by headword |
| 4 | Fetch VOA articles, transcripts, audio URLs and editor glossaries |
| 5 | Download and normalise human pronunciation recordings from Wikimedia Commons |
| 6 | Assemble grammar topics: levelling, attested examples, generated practice |
| 7 | Join everything into the final vocabulary entries and word lists |

Every stage caches its downloads and checkpoints its progress, so an interrupted run resumes.
The pipeline identifies itself with a descriptive User-Agent and rate-limits per host.

## Architecture

```
apps/web                 Next.js 15 App Router, React 19, Tailwind
  src/app/[locale]       every page, under /vi or /en
  src/app/api            server-side grading, review scheduling, enrolment
  src/app/actions        server actions: auth, enquiries, admin writes, import
  src/components         site chrome, learning components, admin framework
  src/lib                db, auth, i18n, progress, admin resource registry
  prisma                 schema and the seed that reads content/
packages/ui              design system: primitives, decor, accent tokens
packages/localization    vi/en message catalogue and formatting
packages/curriculum      the curriculum map: tracks, exams, formats, lesson shape
packages/exercise-engine grading, partial credit, spaced repetition — fully unit-tested
scripts/ingest           the seven-stage content pipeline (Python, stdlib only)
content/                 the distilled JSON the seed reads
```

**Grading runs on the server.** The client posts a response and receives a verdict; the answer
key is never in the page. That matters as soon as anything here is used for assessment.

**Passwords use scrypt** from Node's own crypto module — memory-hard, in the standard library,
no native dependency to rebuild per deployment target. Session tokens are random and only their
SHA-256 digest is stored, so a database leak does not hand out live sessions.

**The admin panel is config-driven.** Twenty content types share two generic pages, declared in
`src/lib/admin/resources.ts`. Only fields declared for a resource can be written, so a crafted
form post cannot set a column the registry does not list. Every mutation is audited.

## Testing

```bash
npm test          # 72 unit and database tests
npm run typecheck
npm run build
npm run test:e2e  # 30 browser tests — needs Node 20+
```

The unit suite covers the grading engine (partial credit, near-miss tolerance, spaced repetition
boundaries), the localisation catalogue (including that every Vietnamese key has an English
counterpart), how the session cookie decides on its `Secure` flag, and a journey test that runs
against the real seeded database.

The browser suite drives a real Chromium against a production build: the account menu for each
role in both locales, the student journey from sign-in through enrolment and lesson completion,
and the authorisation boundaries. Some of what it covers cannot be tested any other way — a
menu that unmounts between `mousedown` and `mouseup` still passes a synthetic click, and a
cookie rejected for being `Secure` on an untrusted origin is only rejected by a real browser.

Point it at a real address when you can:

```bash
E2E_BASE_URL=http://your-host:3888 npm run test:e2e
```

`localhost` and `127.0.0.1` are *trustworthy origins*, so they keep `Secure` cookies even over
plain HTTP; the session test skips itself there because it cannot fail there.

## Deployment

Full notes, including how the session cookie's `Secure` flag is resolved, are in
[`docs/deployment.md`](docs/deployment.md) — read that before deploying anywhere reachable, as
serving sign-in over plain HTTP puts the session token on the wire in the clear.

Any Node 18.18+ host (Node 20+ recommended — Next 15 warns below it, and the browser tests
require it). Set `DATABASE_URL`, then:

```bash
npm ci
npm run db:push && npm run db:seed
npm run build
npm run start
```

SQLite is the default and is genuinely adequate here — the content is read-mostly and the write
volume is one row per exercise attempt. To move to Postgres, change the `datasource` provider in
`prisma/schema.prisma` and re-run `db:push`; no application code references SQLite directly.

Article audio streams from VOA's public CDN by URL. Word pronunciation is served from
`apps/web/public/media/pronunciation` and is committed, so pronunciation works offline.

## Licence and attribution

Application code is the property of Tracy English. Ingested learning material remains under the
licences of its sources, listed above and rendered at `/credits`. If you redistribute this
project, those attribution requirements travel with the content.
