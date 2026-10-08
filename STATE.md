# STATE.md — theodesmond.com (Aurex admin-panel debug, 2026-09-17)

## What was done
- Diagnosed Aurex admin-panel chat (src/components/admin/AurexManager.jsx) against the
  live Aurex SaaS backend (pm2 aurex-api/worker on :4010) using a real run
  (cmu5haj9l000ll04wjw7v2dps, 14 events) as evidence.
- Rewrote chat event handling + rendering in AurexManager.jsx:
  - `reasoning` deltas now go to a collapsible "thought process" block, not the answer.
  - `system` events render as small centered lines, not merged into the answer.
  - Backend `message` echoes render by role (user echo no longer pollutes assistant bubble).
  - Assistant answers render with a lightweight dependency-free Markdown renderer
    (headings, bold/italic, lists, code blocks, inline code, links; React elements only).
  - SSE: seq-based dedupe, no more close-on-error (EventSource auto-reconnect is now safe),
    stream stays open 120s after terminal status so late questions still surface.
  - Follow-up messages no longer lock the input (busy released after post).
  - Running tools show live activity ("⚙ task …"); completion result no longer duplicated.
- Removed dead duplicate `POST /api/admin/conversations/:id/read` route in server/index.js.
- Verified: `npm run lint` (no new issues), `npm run build` (vite + prerender + SEO check OK).
- Deployed 2026-09-17 12:14 UTC: `docker compose up -d --build app`; :3001 healthy
  (/api/health ok, /admin 200).

## Follow-up (2026-09-17, ~12:20 UTC)
- Reasoning/thinking is never rendered now (`reasoning` events dropped, thought-process
  UI removed) — only the final structured answer shows.
- "Agent run completed" system line suppressed; status pill shows "run finishing…"
  during the 120s post-terminal grace window; any late work event flips status back
  to running, so premature idle-completions no longer present as done.
- Working indicator is now a blinking "Thinking..." (+ current tool step) with
  `.animate-think` keyframes in src/index.css (reduced-motion safe).
- Aurex panels (chat/files/terminal) are full-height: `h-[calc(100dvh-300px)]`
  with inner scroll areas (`min-h-0`), min-height fallbacks for small screens.
- Rebuilt + redeployed app container; verified /api/health ok, /admin 200.

## Hotfix (2026-09-17, ~12:35 UTC) — Aurex tab white-screen
- Symptom: `Uncaught ReferenceError: Cannot access 'I' before initialization`,
  whole admin root unmounted when opening the Aurex tab.
- Root cause: TDZ in AurexManager — `handleRunEvent = useCallback(fn,
  [appendStream, finalizeStreams, markWorking])` evaluated the `markWorking`
  binding during render, but `const markWorking` was declared later in the
  component body. Introduced in the previous edit round.
- Fix: moved `runIdRef`/`runStatusRef`/`markWorking` above `handleRunEvent`.
- Verified with headless Chromium (playwright-core + headless shell):
  login → Aurex tab → Files/Chat/Terminal all render, zero page/console errors.
- Rebuilt + redeployed app container; /api/health ok, /admin 200.

## Architecture (relevant)
- Site container (theodesmondcom-app-1, :3001) proxies /api/aurex/* → Aurex backend :4010
  via server/aurex-remote.js (service-user cookie session, AUREX_* env in .env).
- Backend emits event types: text, reasoning, tool, step_start/finish, system, error,
  message, question, question_reply, image, artifact. Run result stored on agentRun.result.

## Known backend quirk (NOT fixed — lives in /root/aurex_saas_model)
- Worker can mark a run "completed" on session idle while the agent is still working
  (reasoning deltas count as delivered text); late events (e.g. question at seq 12
  after completion at seq 6) arrive after terminal status. Frontend now tolerates this.

## Feature (2026-09-19) — message live visitors from the admin panel
- Admin: expanded a live visitor (Visits tab) now has a "Message this visitor"
  composer. `POST /api/admin/visitors/:ip/message` (requireAuth, rate-limited)
  → server persists the message and pushes it live to the visitor's open tabs.
- Delivery model (user-confirmed): PERSIST + chat reply. Message is stored in a
  conversation (auto-created, bound to the visitor's `td-visitor-key` sent in the
  presence beacon), so it shows in the admin Live Chat inbox.
- Visitor sees a popup card ("Theo" + text + Reply button); Reply opens the
  existing chat widget (`td-open-chat` window event), and because the admin
  conversation carries the same visitor_key, `/api/chat/start` reuses it — the
  whole thread continues in the Chat tab.
- Server changes (server/live.js): presence now records `visitorKey` from the
  hello/page payload; new `sendVisitorMessage()` + `findOrCreateOpenConversation()`.
  server/index.js: new admin route.
- Frontend: shared `src/lib/visitorKey.js` (getVisitorKey, used by LiveChat +
  LivePresence); LivePresence.jsx sends visitor_key and renders `admin-popup`
  toasts; useLiveVisitors.js exposes `sendMessage`; admin/InboxTables.jsx adds
  the sender. LiveChat.jsx opens on the `td-open-chat` event.
- Verified: `npm run lint` (only pre-existing vendored server/aurex/index.js
  error remains), `npm run build` OK (21 routes, SEO check no issues), plus an
  end-to-end smoke test (visitor ws → admin POST → popup delivered, conversation
  persisted, 401 on unauthenticated send); smoke row cleaned from DB.
- Deployed 2026-09-19 ~00:51 UTC: `docker compose up -d --build app`; image rebuilt
  (self-contained frontend build), container recreated. Verified /api/health 200,
  /admin 200, / 200 on :3001. Feature is NOW LIVE.

## Ops fix (2026-09-19) — orphaned crash-loop container
- `theodesmondcom-aurex-1` was a leftover from an old `docker-compose.yml` that had an
  `aurex` service (removed before the app/Dockerfile era). It had lost its network
  (empty `networks=`), so it could not resolve `db` and starred restarting with
  `getaddrinfo EAI_AGAIN db` since Sep 16.
- Rmoved via `docker compose up -d --remove-orphans`. Live backend is pm2 `aurex-api`
  :4010 (healthy); app :3001 and db healthy. Verified: /api/health 200 (3001 + 4010), / 200.

## Fixed (2026-09-19 ~01:00 UTC) — reasoning-only premature completion
- Backend gate is LIVE in the worker (tsx runtime-compiles source): processRun.ts
  `completeRunIfIdle()` only flips a run to completed when a real `text` delta or
  image trigger was delivered (`deliveredText`), never for `reasoning`-only output.
  Today's runs all completed only after text; the refuge run for this task stayed
  `running` through a long reasoning-only phase.
- Frontend confirmed rendering "running" consistently: admin AurexManager.jsx shows
  `run running` + green pulse for running; treats any terminal status as
  "finishing…" for a 120s grace and flips back via `markWorking` on late work.
  SaaS Run.tsx shows a `running` dot with "thinking"/"building"/"writing". The
  deployed :3001 bundle (container 00:51, dist 00:49) ships this.
- Factory reset (one-off re-run check, user-confirmed scope = only cmu5haj9l):
  flipped that run's row to `running` (cleared completedAt/exitCode/result/error)
  and deleted its premature "Agent run completed" event (seq 6). The worker heal
  sweep re-attached the watcher to the STILL-ALIVE host serve session
  (ses_f50c23…, /root/theodesmond.com) and replayed history incl. the pending
  question. Run has remained `running` since — no premature re-completion, gate holds.

## Run cmu5haj9l — resolution confirmed (2026-09-19)
- The observed run ("add an avatar to the logo section of my Admin Panel…") was reaped as
  `timeout` on 2026-09-19 01:15 (30m RUN_TIMEOUT_MS horizon elapsed with its pending
  question unanswered). Correct outcome — no false "completed"; the worker gate held.

## Feature (2026-09-19) — admin panel avatar (the unfinished run, done manually)
- Admin Panel logo section (src/pages/AdminPage.jsx) now renders the site avatar instead
  of the text initials:
  - `SidebarBody` brand block (desktop sidebar + mobile drawer): `branding.logoImage` ?
    `<img h-9 w-9 rounded-lg object-cover>` : `mark` fallback box.
  - Mobile top bar brand block: same pattern at h-8 w-8.
  - `AdminPage` pulls `useSiteContent()?.branding ?? defaultBranding` (same convention as
    Nav.jsx/Footer.jsx) and passes `branding` down; fallback keeps current "TD" box when
    no logoImage is set.
- Live `branding.logoImage=/uploads/1789779780510-911a408f3bd0.jpg` already set in DB, so
  the avatar now shows in the admin UI immediately.
- Verified: `npm run lint` (only pre-existing vendored server/aurex/index.js error),
  `npm run build` OK (21 routes, SEO no issues), headless Chromium login → sidebar shows
  avatar img with correct src, zero page/console errors.
- Deployed 2026-09-19 ~01:55 UTC: `docker compose up -d --build app`; container healthy,
  /api/health 200, /admin 200, / 200.

## NOT done / next
- Uncommitted working tree: the post-commit build (site content overhaul + admin panel +
  server/ + Docker deployment layer, ~63 files) is still not committed. Recommend a
  commit at the next natural checkpoint (verify nothing sensitive in .env.example first).
