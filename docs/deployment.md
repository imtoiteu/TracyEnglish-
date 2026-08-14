# Deployment

## Requirements

Node 18.18+ runs the app; Node 20+ is recommended and is **required** to run the browser tests.

```bash
npm ci
npm run db:push && npm run db:seed
npm run build
npm run start
```

## Sessions and HTTPS

The session cookie is marked `Secure` when — and only when — the site is actually served over
HTTPS. This matters more than it sounds: **a browser silently discards a `Secure` cookie that
arrives over plain HTTP.** If the flag is set on an HTTP deployment, signing in appears to
succeed, the page rendered by the sign-in still shows the account, and then every subsequent
request is anonymous — lessons offer a login button, enrolling bounces to the login page, and
nothing persists.

The flag is resolved in this order:

| Order | Source | Notes |
| --- | --- | --- |
| 1 | `SESSION_COOKIE_SECURE` | `"true"` or `"false"`. An explicit override; anything else is ignored. |
| 2 | `x-forwarded-proto` | Set by most reverse proxies. Only the first hop is read. |
| 3 | `APP_ORIGIN` | Falls back to the scheme of this URL. |
| — | default | Not `Secure`. |

Behind a TLS-terminating proxy that sets `x-forwarded-proto`, nothing needs configuring. Set
`APP_ORIGIN` when TLS terminates somewhere that does not send that header.

**Serve this over HTTPS.** Resolving the flag correctly makes the app work under whatever
deployment it is given, but on plain HTTP the session token still crosses the network in the
clear and can be read or replayed by anyone on the path. Plain HTTP is acceptable for a local
demo and nothing else. Note that `localhost` and `127.0.0.1` are treated by browsers as
*trustworthy origins*, so they keep `Secure` cookies even over HTTP — which is exactly why this
class of bug survives local testing and only appears once the app is reachable at a real
address.

## Authorisation

Route guards live in the pages themselves, not only in layouts. A `redirect()` in a layout does
not prevent the page beneath it from rendering, and once a `loading.tsx` boundary has flushed
the response, the page's data is streamed to the client even though the visible page redirects.
Any new page under `/admin` or `/teacher` must call `requireRole` **before** it queries
anything.

## Browser tests

```bash
# against a running deployment (Node 20+)
E2E_BASE_URL=http://your-host:3888 npm run test:e2e

# or let Playwright start one on 127.0.0.1:3888
npm run test:e2e
```

Point `E2E_BASE_URL` at the deployment's **real address** when you can. The session test that
covers the `Secure`-cookie bug skips itself on `localhost` and `127.0.0.1`, because those
origins cannot reproduce it.

## Database

SQLite is the default and is adequate here: the content is read-mostly and the write volume is
one row per exercise attempt. To move to Postgres, change the `datasource` provider in
`prisma/schema.prisma` and re-run `db:push`; no application code references SQLite directly.
