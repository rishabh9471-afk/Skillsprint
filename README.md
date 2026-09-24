# SkillSprint — AI coach for PM interviews

A guest writes an answer to a product-management scenario, gets rubric-based AI feedback with a rewrite of their weakest paragraph, revises or faces two interviewer follow-ups, and ends with a verdict and XP. A weekly leaderboard and a private metrics dashboard are included.

📄 **[Product requirements (PRD)](PRD.md)** · 🔗 **[Live app](https://skillsprint-kappa.vercel.app)**

**Runs entirely on free tiers:** Vercel (hosting + serverless functions), Google Gemini (AI grading), Groq (AI fallback) and Supabase (database).

---

## Setup — about 30 minutes, no coding needed

You'll create four free accounts, paste a few keys into Vercel, and deploy.

### 1. Get a Gemini API key (the AI grader)

1. Go to **aistudio.google.com** and sign in with a Google account.
2. Click **Get API key → Create API key**. Copy it somewhere safe.

### 2. Get a Groq API key (backup AI, used automatically if Gemini is busy)

1. Go to **console.groq.com** and sign up (no card needed).
2. Open **API Keys → Create API Key**. Copy it.

> Optional but recommended. Without it, the app still works; it just has no fallback when Gemini hits its free limit.

### 3. Create the database on Supabase

1. Go to **supabase.com**, sign up, and click **New project**. Pick any name and a strong database password; choose the region closest to your users (e.g. Mumbai).
2. When the project is ready, open **SQL Editor → New query**, paste the whole contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. You should see "Success".
3. Open **Project Settings → API** (or **API Keys**) and copy:
   - the **Project URL** (looks like `https://abcd1234.supabase.co`)
   - the **secret key** (`sb_secret_…`) or, on older projects, the **service_role** key.
   Keep this key private. It only ever lives in Vercel, never in the browser.

### 4. Put the code on GitHub

1. Unzip this project.
2. On **github.com**, create a new repository (e.g. `skillsprint`). Public is fine; no secrets are in the code.
3. Upload the files: on the empty repo page click **uploading an existing file**, drag in everything from the unzipped folder, and commit. (Or use `git push` if you're comfortable with Git.)

### 5. Deploy on Vercel

1. On **vercel.com**, sign in with GitHub and click **Add New → Project**, then import your repository. Vercel detects **Vite** automatically.
2. Before clicking Deploy, open **Environment Variables** and add:

| Name | Value |
| --- | --- |
| `GEMINI_API_KEY` | from step 1 |
| `GROQ_API_KEY` | from step 2 (optional) |
| `SUPABASE_URL` | Project URL from step 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | secret / service_role key from step 3 |
| `SESSION_SECRET` | any long random text, e.g. 40 random characters |
| `DASHBOARD_PASSWORD` | a password for your `/dashboard` page |

3. Click **Deploy**. After a minute you get a live URL like `skillsprint.vercel.app`.

> If you add or change a variable later, redeploy (Deployments → ⋯ → Redeploy) for it to take effect.

### 6. Check everything works

1. Open `https://<your-site>/api/ping` — it should show `"ok":true,"storage":"supabase"`. If it says `memory`, the Supabase variables are missing.
2. Open your site, pick a nickname and complete one scenario end to end.
3. Open `https://<your-site>/dashboard`, enter your dashboard password, and you should see that session in the numbers.

That's it — the app is live.

---

## Settings you can change (Vercel → Environment Variables)

| Variable | Default | What it does |
| --- | --- | --- |
| `DAILY_SCENARIO_LIMIT` | `3` | New scenarios each visitor can start per day (IST). Revisions and follow-ups inside a started scenario don't count. |
| `GLOBAL_DAILY_AI_CAP` | `1200` | Max AI requests per day across all users. Keep it below Gemini's free daily quota. New sessions pause at the cap; sessions in progress can still finish. |
| `GEMINI_MODEL` | `gemini-flash-latest` | Always points to Google's current Flash model. Pin a specific model if you want stable results. |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Fallback model on Groq. |

A full session uses 2–4 AI requests (1 for feedback, 1 per revision, 1 for the verdict), so the defaults support roughly 300+ sessions a day.

---

## How it works

```
Browser (React)                     Vercel functions (/api)                 Free services
─────────────────                   ───────────────────────                 ─────────────
nickname, drafts, session state ──► /api/visitor, /api/recover   ────────► Supabase: visitors
saved in the browser                /api/grade    → Gemini, else Groq ──► AI providers
                                    /api/verdict  → Gemini, else Groq       Supabase: sessions, usage
analytics events (queued) ────────► /api/events                  ────────► Supabase: events
                                    /api/leaderboard, /api/me    ◄───────
/dashboard (password) ────────────► /api/dashboard               ◄──────── Supabase
                                    /api/ping (daily, keeps Supabase awake)
```

- **No login.** A guest gets a random visitor id saved in their browser, a nickname with a short tag (e.g. `Riya#4821`), and a **recovery code** (`SPRINT-7K2P9X`) to restore progress on another device.
- **Trustworthy scores.** After each grading the server returns a signed token recording the score, revision number and follow-up questions. Revisions, verdicts and XP must present that token, so they can't be faked from the browser.
- **Quotes are checked.** Every evidence quote the AI returns is verified against the user's answer; quotes that aren't really there are dropped.
- **Fails soft.** If the AI is busy, the answer is kept and the user can retry. If the database is down or paused, practice still works; only the leaderboard and logging pause.
- **Keeps Supabase awake.** A daily Vercel Cron job calls `/api/ping` so the free project isn't paused for inactivity.

### Edge cases handled

Short or over-long answers · gibberish, off-topic or pasted-scenario answers ("not an answer", doesn't use a revision) · prompt-injection attempts · double-clicks · Gemini rate-limited (automatic Groq fallback) · both providers down (answer saved, retry) · broken AI output (one silent retry) · offline while writing (draft kept, submit waits) · refresh or closing mid-session (resumes at the same step) · unchanged resubmission · third revision · skipped follow-ups · leaving mid-interview · daily limit · global cap · replaying a completed scenario (no XP) · browser storage blocked · database unavailable · offensive nicknames · small screens.

---

## The metrics dashboard (`/dashboard`)

Password-protected. Pick Today / 7 / 30 / 90 days.

- **Coached sessions** (north star), unique visitors, completion rate, returning visitors, feedback helpful rate, score lift on revision, average final score, XP awarded
- **Journey funnel**: opened → submitted → saw feedback → revised or interviewed → verdict
- **Path after feedback**: revised vs straight to interview vs left
- **Daily activity** chart, **per-scenario table**, **AI health** (requests vs cap, fallback rate, success rate, p90 response time, limit hits)

All raw data is in Supabase (`events`, `sessions`), so you can answer any other question with SQL in **Supabase → SQL Editor**.

---

## Evaluating the AI grader (the "golden set")

A golden set is a fixed set of sample answers that **you** grade once; every time you change the prompt or model, the AI grades the same answers and you check it agrees with you.

1. Open [`evals/golden-set.json`](evals/golden-set.json). It has 8 starter answers (strong, average, weak, plus an injection attempt and an off-topic answer) with *suggested* grades. **Regrade each one yourself** — 4 scores from 1–10 in the rubric order in [`server/rubrics.js`](server/rubrics.js).
2. Add your keys to a local `.env` (see below), then run:
   ```bash
   npm install
   npm run eval                       # one pass
   npm run eval -- --repeat 3         # also checks consistency
   npm run eval -- --provider groq    # test the fallback model alone
   ```
3. A report is saved to `evals/reports/`. Launch bars: ≥ 80% of overall scores within ±1 of yours, rank order strong > average > weak holds, ≥ 95% of quotes found in the answer.

The script waits between requests to stay inside the free per-minute limit, so a full run takes a minute or two. Keep the reports — they're your evidence that the grader is reliable.

---

## Running locally (optional)

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env      # then fill in the values you have
npm run dev               # http://localhost:5173
```

- No keys yet? Set `MOCK_AI=true` in `.env` to use fake grading for testing the flow. **Never set this on Vercel.**
- No Supabase variables locally? Data is kept in memory and resets when you stop the server.

---

## Changing content

| What | Where |
| --- | --- |
| Scenario text (title, context, question, difficulty) | `src/shared/scenarios.js` |
| Rubrics and "what a strong answer covers" | `server/rubrics.js` (server only, not visible to users) |
| Grading and verdict prompts | `server/prompts.js` — bump `PROMPT_VERSION` in `server/config.js` and re-run the eval after changes |
| Word limits, revision count | `src/shared/limits.js` |
| XP and verdict rules | `server/scoring.js` |
| Colors and layout | `src/styles.css` (tokens at the top; dark mode included) |

To add a scenario, add it to `scenarios.js` with a new `id`, and add matching `keyPoints` in `rubrics.js`.

---

## Project structure

```
api/                 Vercel serverless functions (one file = one endpoint)
server/              Shared server code: AI providers, prompts, rubrics, database, scoring, metrics
src/                 React app
  components/        Onboarding, Home, Writer, Feedback, Interview, Verdict, Leaderboard…
  dashboard/         /dashboard page and its charts
  shared/            Scenarios and limits (used by both browser and server)
supabase/schema.sql  Database tables — run once in Supabase
evals/               Golden set and eval reports
scripts/eval.mjs     Grader evaluation script
vercel.json          SPA routing, function timeout, daily keep-alive cron
```

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "The AI coach isn't configured yet" | `GEMINI_API_KEY` missing in Vercel, or you didn't redeploy after adding it. |
| "The coach is busy right now" on every try | Check the key is valid. In the dashboard's AI health panel, a 0% success rate means every call is failing. If you pinned `GEMINI_MODEL`, the model name may have been retired; remove the variable to use the default. |
| Dashboard says "Database not connected" | Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and make sure `schema.sql` was run. |
| Dashboard says it can't reach the database | The free Supabase project was paused. Open Supabase and click **Resume project** — data is kept. |
| Recovery code says "couldn't find that code" | The code was created while the database was unavailable, or it was mistyped (codes use no 0/O or 1/I). |

---

## Privacy note

Answers are graded by free AI tiers that may use submissions to improve their models. The app tells users not to include personal or confidential information, stores no names, emails or phone numbers, and shows only nicknames publicly.
