# Technical Requirements Document (TRD)
## AI Resume Reviewer — Technical Design

---

## 1. Architecture Overview

```
┌─────────────────────┐        ┌──────────────────────┐
│  Next.js 14 (Vercel) │  HTTPS │  FastAPI (Render)     │
│  App Router + Tailwind│──────▶│  Python backend       │
│  - Marketing pages    │◀──────│  - Auth (JWT)         │
│  - Auth pages         │        │  - Review engine      │
│  - Dashboard/App      │        │  - Stripe integration │
│  - Billing page       │        │  - Webhook handler    │
└─────────────────────┘        └───────────┬──────────┘
                                            │
                     ┌──────────────────────┼───────────────────┐
                     ▼                      ▼                   ▼
              ┌────────────┐        ┌──────────────┐   ┌────────────────┐
              │  Postgres   │        │  Groq API     │   │  Stripe (test)  │
              │  (Neon)     │        │  (LLM calls:  │   │  Checkout +     │
              │  users,     │        │  scoring,     │   │  Webhooks +     │
              │  reviews    │        │  gaps, Qs)    │   │  Subscriptions  │
              └────────────┘        └──────────────┘   └────────────────┘
```

- Frontend and backend are deployed and hosted **separately** (Vercel + Render). Frontend calls backend over HTTPS with the JWT in an `Authorization: Bearer` header.
- Stripe webhook goes **directly to the FastAPI backend** (not through Next.js) — this is the source of truth for plan state.

---

## 2. Tech Stack (confirmed from brief)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | Deployed on Vercel |
| Backend | FastAPI (Python) | Deployed on Render |
| Database | Postgres (Neon, serverless, free tier) | Accessed via SQLAlchemy + Alembic migrations |
| Auth | JWT (access + refresh pattern) | Stateless; no server session store needed |
| LLM | Groq (fast inference) | Used for scoring, gap analysis, question generation |
| Payments | Stripe (test mode) | Checkout Sessions + Webhooks + Subscriptions API |
| Deployment | Vercel (frontend) + Render (backend) | Both must expose public URLs |

---

## 3. Data Model (Postgres / SQLAlchemy)

### 3.1 `users` table
```sql
id                      SERIAL / UUID PRIMARY KEY
email                   TEXT UNIQUE NOT NULL, indexed
password_hash           TEXT NOT NULL
plan                    TEXT NOT NULL DEFAULT 'free'   -- 'free' | 'pro'
stripe_customer_id      TEXT NULL
stripe_subscription_id  TEXT NULL
subscription_status     TEXT NULL                      -- 'active' | 'canceled' | 'past_due'
created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 3.2 `reviews` table
```sql
id                     SERIAL / UUID PRIMARY KEY
user_id                FK -> users.id, indexed
created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
resume_text            TEXT NOT NULL
jd_text                TEXT NOT NULL
match_score            INTEGER NOT NULL         -- 0-100, overall fit for this role
gaps                   JSONB NOT NULL           -- array of strings, missing skills/experience
weak_areas             JSONB NOT NULL           -- array of strings, underdeveloped areas
strengths              JSONB NOT NULL           -- array of strings, clear matches to the JD
suggestions            JSONB NOT NULL           -- array of strings, concrete resume edits
summary                TEXT NOT NULL
plan_at_time           TEXT NOT NULL            -- 'free' | 'pro', tier this review ran under
ats_score              INTEGER NOT NULL DEFAULT 0  -- LLM-judged parsing/structure compatibility
readability_score      INTEGER NOT NULL DEFAULT 0  -- Flesch Reading Ease, computed deterministically
keyword_match_score    INTEGER NOT NULL DEFAULT 0  -- deterministic JD-keyword overlap %
impact_score           INTEGER NOT NULL DEFAULT 0  -- LLM-judged use of quantified achievements
```

`ats_score` and `impact_score` come from the same LLM call as `match_score`/`gaps`/`strengths`
(one extended JSON response — no extra request). `readability_score` and `keyword_match_score`
are computed with plain deterministic text processing in `services/text_metrics.py` — a real
Flesch Reading Ease formula and a real JD-keyword-overlap calculation, with **no LLM call and
no fabricated numbers**: every sub-score shown in the review workspace is either a genuine
formula result or a genuine model judgment on the actual submitted text.

### 3.3 `interview_prep_items` table
One row per gap → question/answer pair, so each item is queryable/indexable individually rather than buried in a blob.
```sql
id                SERIAL / UUID PRIMARY KEY
review_id         FK -> reviews.id, indexed
gap               TEXT NOT NULL
question          TEXT NOT NULL
answer_outline    TEXT NOT NULL
```
Rows here only exist for reviews where `plan_at_time = 'pro'`.

**Note:** `gaps`/`weak_areas` use Postgres `JSONB` columns rather than separate normalized tables — they're small, read-together, never queried individually, so JSONB keeps the schema simple without losing Postgres's native array/JSON querying if ever needed.

### 3.4 Free-tier daily cap (confirmed approach)
No separate counter table. Derive count on the fly via SQL — `SELECT COUNT(*) FROM reviews WHERE user_id = X AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')` — reset naturally at midnight UTC.

---

## 4. API Surface (FastAPI)

### Auth
- `POST /auth/signup` — { email, password } → creates user, returns JWT
- `POST /auth/login` — { email, password } → returns JWT
- `GET /auth/me` — returns current user (plan, email) — requires auth

### Reviews
- `POST /reviews` — { resume_text | resume_file, jd_text } → runs pipeline, enforces free-tier cap server-side, returns review object (with or without `interview_prep` depending on plan) — requires auth
- `GET /reviews` — list current user's review history (paginated) — requires auth
- `GET /reviews/{id}` — single review detail — requires auth

### Billing
- `POST /billing/create-checkout-session` — creates Stripe Checkout Session for Pro plan, returns session URL — requires auth
- `POST /billing/cancel-subscription` — cancels current user's Stripe subscription — requires auth
- `GET /billing/status` — returns current plan + renewal/cancel info — requires auth
- `POST /webhooks/stripe` — Stripe webhook receiver (no auth — verified via Stripe signature header instead)

---

## 5. Core Pipeline (Review Engine)

Implemented in `app/services/review_engine.py`, orchestrating `app/services/llm.py` (Groq calls)
and `app/services/text_metrics.py` (deterministic, non-LLM calculations):

1. **Input normalization** — if PDF uploaded, extract text server-side (`pdfplumber`); if pasted text, use as-is. Validated first (see §5a) before any LLM call is made.
2. **HyDE-style query expansion** (`expand_jd_hyde`) — generate a hypothetical "ideal candidate profile" for the JD using the LLM, then compare the actual resume against that expanded representation rather than raw JD text alone.
3. **Scoring + gap/strengths/suggestions extraction** (`score_and_extract_gaps`) — one Groq call returns `match_score`, `ats_score`, `impact_score`, `gaps`, `weak_areas`, `strengths`, `suggestions`, and `summary` together as a single JSON object.
4. **LLM-as-a-Judge validation pass** (`judge_match_score`) — a second, cheaper Groq call sanity-checks only `match_score` against the severity/count of gaps and returns a corrected integer if needed. Deliberately scoped to just this one field (not the whole review object) so a judge-call failure can never silently drop other fields — see the code comment in `llm.py` for the incident this avoided.
5. **Deterministic sub-scores** (`compute_readability_score`, `compute_keyword_match_score` in `text_metrics.py`) — Flesch Reading Ease and JD-keyword-overlap, computed directly from text with plain Python, no LLM call and no fabricated numbers.
6. **(Pro only) Interview Readiness generation** (`generate_interview_prep`) — for each gap from step 3, a further LLM call generates one interview question + one answer outline referencing actual resume content. Only invoked if `user.plan == "pro"` (checked server-side, not trusted from request).
7. **Persist** — save the full review record (steps 3-5 outputs) to `reviews`; if Pro, insert corresponding rows into `interview_prep_items`.

### 5a. Input Validation (mirrored client + server; server is authoritative)

| Input | Rule | Enforced in |
|---|---|---|
| Resume text | 100–20,000 characters | `ReviewForm.tsx` (client) + `routers/reviews.py` (server) |
| Job description text | 50–10,000 characters | Same as above |
| Resume PDF upload | Must be `application/pdf` or `.pdf` filename; max 5 MB | Same as above |
| Email | Valid email format | `EMAIL_REGEX` client-side + Pydantic `EmailStr` server-side |
| Password | 8–72 characters | Client `minLength`/`maxLength` + Pydantic `Field` server-side (72 = bcrypt's hard input limit) |

Client-side checks exist purely for immediate feedback (character counters, inline errors); every
rule is re-checked server-side because the client can never be trusted as the actual boundary.

---

## 6. Auth Design

- Password hashing: `bcrypt` library directly (not `passlib` — `passlib` 1.7.4 is unmaintained and breaks against `bcrypt>=4.1`, which removed an internal attribute passlib probes for; see `app/security.py`). Passwords are truncated to bcrypt's 72-byte input limit before hashing.
- JWT: access token (short-lived, e.g. 24h) signed with `JWT_SECRET`
- Persistence across reload: store JWT in an HttpOnly cookie (preferred over localStorage for basic XSS protection) set by backend on login/signup response; frontend reads auth state via `/auth/me` on load
- Middleware: FastAPI dependency (`get_current_user`) applied to all protected routes; missing/invalid token → 401

**Confirmed:** HttpOnly cookie, set with `SameSite=None; Secure` since frontend and backend are on different domains (Vercel vs Render).

---

## 7. Stripe Integration Design

### Products/Prices
- One Stripe Product ("Pro Plan"), one recurring Price (monthly, test mode) — Price ID stored in backend env var, not hardcoded in code.

### Checkout Flow
1. Frontend calls `POST /billing/create-checkout-session`
2. Backend creates/retrieves `stripe_customer_id` for user (create on first checkout if absent), creates a Stripe Checkout Session in `subscription` mode with `success_url` (includes `{CHECKOUT_SESSION_ID}` placeholder) / `cancel_url` pointing back to the app's billing page
3. Frontend redirects browser to returned Checkout URL
4. User pays with Stripe test card (e.g. `4242 4242 4242 4242`)
5. Stripe redirects back to `success_url` with `session_id` in the query string

### Webhook Handling (`POST /webhooks/stripe`)
- Verify signature using `STRIPE_WEBHOOK_SECRET`
- Handle `checkout.session.completed`: extract customer + subscription ID, set `user.plan = "pro"`, store `stripe_subscription_id`, `subscription_status = "active"`
- Handle `invoice.paid`: reaffirm active status (covers renewals)
- Handle `customer.subscription.deleted` / `updated` (status = canceled): set `user.plan = "free"`, update `subscription_status`
- This remains the **authoritative** path for state changes with no user in the loop (renewals, cancellations initiated from the Stripe dashboard, disputes, etc).

### Redirect-Path Confirmation (`POST /billing/confirm-session`) — reliability fallback
- The webhook alone is fragile in local development: it only fires if `stripe listen` is actively forwarding events, and even in production it can lag the checkout redirect by a few seconds, leaving the UI showing a stale "Upgrade" button right after a successful payment.
- To close that gap, the billing page calls `POST /billing/confirm-session?session_id=...` immediately after the Stripe redirect. The backend retrieves the Checkout Session directly from Stripe's API (server-side, using the secret key), verifies `client_reference_id`/`metadata.user_id` matches the logged-in user and `payment_status == "paid"`, and applies the same upgrade the webhook would.
- This does **not** replace the webhook requirement — the webhook still independently handles `checkout.session.completed`/`invoice.paid`/subscription changes and is what a production deployment relies on for anything outside the redirect flow. The confirm-session call is additive redundancy for the one moment the brief cares most about demoing live: checkout → immediate reflected upgrade.

### Cancellation Flow
1. User clicks "Cancel" on billing page
2. `POST /billing/cancel-subscription` calls Stripe API to cancel the subscription **immediately** (`stripe.Subscription.delete`, not `cancel_at_period_end`) — confirmed decision, no grace period
3. Stripe fires `customer.subscription.deleted`, webhook handler downgrades user in DB
4. Billing page reflects new state on next `/billing/status` fetch

### Server-Side Gating (critical correctness point)
- Every request to Pro-gated functionality (Interview Readiness Simulator) re-checks `user.plan` from the DB at request time — never trusts a client-sent flag or a stale JWT claim.

---

## 8. Environment Variables

**Backend (Render):**
```
DATABASE_URL=            # Neon Postgres connection string
JWT_SECRET=
GROQ_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
FRONTEND_URL=            # for CORS + Checkout success/cancel URLs
```

**Frontend (Vercel):**
```
NEXT_PUBLIC_API_URL=     # points to Render backend
```

---

## 9. Deployment Plan

- Backend: FastAPI app on Render (Web Service), Postgres on Neon (free tier, serverless, separate service)
- Frontend: Next.js on Vercel
- Alembic migrations run against the Neon `DATABASE_URL` as part of backend deploy/setup
- Stripe webhook endpoint registered in Stripe Dashboard (test mode) pointing at the Render backend's public URL + `/webhooks/stripe`
- CORS configured on FastAPI to allow only the deployed Vercel origin (plus localhost during dev)

---

## 10. Non-Functional Requirements

- Groq chosen specifically for low-latency responses so the review pipeline feels responsive during a live demo (target: full pipeline under ~10s for a Free review, under ~15s including interview prep for Pro).
- All Pro-gating and daily-cap logic enforced server-side; frontend UI restrictions are cosmetic only, not the actual security boundary.
- Webhook endpoint must be idempotent-safe (Stripe may retry the same event) — check `subscription_status`/plan before re-applying identical updates, or rely on Stripe event ID de-dup if time allows.

---

## 11. Frontend Architecture (App Router, contexts, dashboard UX)

### 11.1 Route structure
```
app/
  page.tsx                        Landing page (Hero, Features, Pricing, FAQ, CTA)
  login/page.tsx, signup/page.tsx Auth forms
  billing/page.tsx                Plan status, upgrade/cancel
  dashboard/
    layout.tsx                    Wraps /dashboard/** in ProtectedRoute + ReviewWorkspaceProvider
                                   + the persistent left DashboardSidebar
    page.tsx                      Resume + JD form only — no result shown here
    reviews/[id]/page.tsx         The review workspace: header, JD detail, tab content
```

### 11.2 Context providers (in mount order, root → leaf)
- `ThemeProvider` — light/dark, class-based, persisted to `localStorage`, no-flash inline script in `<head>`.
- `AuthProvider` — current user, session persistence via `/auth/me`, login/signup/logout.
- `ReviewHistoryProvider` — the review list, fetched only when `user` is truthy (re-fetches on login/logout). Lives at the **root** layout (not inside `/dashboard`) because the Navbar's History button needs it on every route.
- `HistoryDrawerProvider` — just `isOpen`/`open`/`close`/`toggle` for the right-side history drawer, decoupled from the data itself.
- `ReviewWorkspaceProvider` — `currentReview` + `activeTab`, scoped to the `/dashboard` layout only. This is what lets the persistent left sidebar and the `/dashboard/reviews/[id]` page stay in sync without prop-drilling: the sidebar sets `activeTab`/navigates, the page reads `activeTab` to decide which panel to render.

### 11.3 Dashboard UX flow
1. Landing on `/dashboard` clears `currentReview` (via an effect) — this is what makes every sidebar tab except "Dashboard" disabled and hover-tooltipped ("Run a resume review from Dashboard first...").
2. Submitting the form creates the review, sets `currentReview` + `activeTab = "overview"` in context, refreshes the history list, and **navigates** to `/dashboard/reviews/{id}` (a real route change, not an inline reveal).
3. On that page, `currentReview` is non-null, so every sidebar tab is enabled; clicking one just calls `setActiveTab` (same page, no navigation) — except "Interview Prep", which stays disabled with a tooltip ("Upgrade to Pro...") if `currentReview.plan_at_time !== "pro"`.
4. Opening the History drawer (from the Navbar, available everywhere) and picking a different past review navigates to that review's `/dashboard/reviews/{id}`, which resets `activeTab` to `"overview"` on `id` change and re-fetches into `currentReview`.
5. The disabled-tab tooltips are implemented with `aria-disabled` (not the native `disabled` attribute) plus a `group-hover` CSS tooltip — native `disabled` buttons don't reliably fire hover/`title` events in most browsers, which would silently break the "why can't I click this" affordance.

### 11.4 Key components
- `components/DashboardSidebar.tsx` — the persistent left nav described above.
- `components/HistoryDrawer.tsx` — the right-side slide-in panel, backdrop-dismissible.
- `components/ReviewWorkspaceContent.tsx` — pure, props-driven (`review`, `activeTab`, `onSelectTab`) panel renderer; holds no navigation state itself, so it can be reused wherever a review needs to be displayed.
- `components/ReviewForm.tsx` — resume/JD input with the validation rules from §5a, live character counters, and file-type/size checks before the request is even sent.
- `lib/report.ts` — builds and downloads a plain-text report client-side (`Blob` + anchor `download`) — genuinely functional, not a decorative button.

---

## 12. Remaining Open Technical Decision

1. **Exact Groq model name(s)** to use for scoring vs. judging vs. question generation — can use the same model for all three, or a faster/cheaper one for the judge pass. To be decided when wiring up the LLM calls.

All other technical decisions (DB choice, JWT storage, PDF parsing scope, cancellation timing, cap reset) are confirmed above.
