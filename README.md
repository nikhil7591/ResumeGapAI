# AI Resume Reviewer

Know your resume's gaps — and exactly what you'll be asked about them.

Upload a resume and a job description. Get a match score, a gap analysis, and (Pro) a
predicted set of interview questions with answer outlines built specifically from the gaps
found between your resume and the JD.

See [PRD.md](PRD.md) and [TRD.md](TRD.md) for full product and technical specs.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | Postgres (hosted on [Neon](https://neon.tech)) via SQLAlchemy + Alembic |
| Auth | JWT stored in an HttpOnly cookie |
| LLM | [Groq](https://groq.com) (fast inference) |
| Payments | Stripe (test mode) |
| Deployment | Frontend → Vercel · Backend → Render |

---

## Repository layout

```
backend/            FastAPI app
  app/
    main.py         App entrypoint, CORS, router registration
    config.py       Settings (env vars)
    database.py     SQLAlchemy engine/session
    models.py       users / reviews / interview_prep_items tables
    schemas.py      Pydantic request/response models
    security.py     Password hashing (bcrypt) + JWT
    deps.py         get_current_user auth dependency
    routers/        auth, reviews, billing, webhooks
    services/       pdf_parser, llm (Groq calls), review_engine (pipeline), text_metrics (deterministic scores)
  alembic/          DB migrations (0001 initial schema, 0002 sub-scores)
  requirements.txt
  .env.example

frontend/           Next.js app
  app/
    page.tsx                        Landing page
    login/, signup/                 Auth pages
    billing/                        Plan status, upgrade/cancel
    dashboard/
      layout.tsx                    Persistent left sidebar + auth guard for /dashboard/**
      page.tsx                      Resume + JD form only
      reviews/[id]/page.tsx         Review workspace (tab content driven by sidebar)
  components/       Navbar, Hero, PricingTable, ReviewForm, ReviewWorkspaceContent,
                    DashboardSidebar, HistoryDrawer, and marketing sections
  lib/              api client; auth/theme/review-history/review-workspace/history-drawer contexts; report.ts
  types/            Shared TypeScript types
  .env.example

PRD.md              Product requirements
TRD.md              Technical design
```

---

## 1. Prerequisites

- Node.js 18+
- Python 3.11+
- A [Neon](https://neon.tech) Postgres database (free tier)
- A [Groq](https://console.groq.com) API key
- A [Stripe](https://dashboard.stripe.com) account in **test mode**
- The [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)

---

## 2. Stripe setup (do this first — everything else references these IDs)

1. In the Stripe Dashboard (test mode), create a **Product** called "Pro Plan".
2. Add one recurring **Price** to it (e.g. $9.00/month). Copy the Price ID (`price_...`).
3. Copy your test **Secret key** (`sk_test_...`) from Developers → API keys.
4. For local development, run the Stripe CLI to forward webhooks to your local backend:
   ```bash
   stripe listen --forward-to localhost:8000/webhooks/stripe
   ```
   This prints a webhook signing secret (`whsec_...`) — use it locally.
   For production, add a webhook endpoint in the Dashboard pointing at
   `https://<your-render-backend>/webhooks/stripe`, subscribed to at least:
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

---

## 3. Backend setup (local)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
```

Fill in `backend/.env`:

```
DATABASE_URL=postgresql://...        # from Neon dashboard
JWT_SECRET=<generate a long random string>
GROQ_API_KEY=gsk_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...       # from `stripe listen` output
STRIPE_PRICE_ID_PRO=price_...
FRONTEND_URL=http://localhost:3000
```

Run migrations, then start the API:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at `/docs`).

---

## 4. Frontend setup (local)

```bash
cd frontend
npm install
copy .env.example .env.local    # Windows
# cp .env.example .env.local    # macOS/Linux
```

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## 5. Trying the full flow locally

1. Keep `stripe listen --forward-to localhost:8000/webhooks/stripe` running in a separate terminal.
2. Sign up on the landing page.
3. On the Dashboard page, hover the sidebar tabs (Gap Analysis, ATS Score, etc.) — they're
   disabled with a tooltip explaining why, since no review exists yet.
4. Paste or upload a resume (PDF, under 5 MB) + paste a job description, then click "Analyze
   resume". You're navigated to a new page (`/dashboard/reviews/{id}`) with the full result.
5. All sidebar tabs are now clickable and swap the content on that same page — no re-fetching.
6. Click "🕒 History" in the top-right of the navbar to open the history drawer and jump
   between past reviews.
7. Click "⬇ Download Report" to download a real text file of the review.
8. Run 3 reviews to hit the free-tier daily cap and confirm the form disables with an upsell message.
9. Go to Billing → Upgrade to Pro → complete Stripe Checkout using test card
   `4242 4242 4242 4242`, any future expiry date, any CVC, any postal code.
10. Confirm you're redirected back and your plan flips to Pro (webhook-driven, with a
    redirect-path confirmation fallback — see TRD §7).
11. Run another review and confirm the "Interview Prep" sidebar tab is now enabled and shows
    predicted questions with answer outlines.
12. Cancel the subscription from the Billing page and confirm it drops back to Free
    immediately, and "Interview Prep" becomes disabled again on your next review.

---

## 6. Deployment

### Backend → Render

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from the repo, root directory `backend/`.
3. Render will pick up `render.yaml` (build command, start command, and required env var
   placeholders). Fill in the actual secret values in the Render dashboard:
   `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `FRONTEND_URL`.
4. The start command runs `alembic upgrade head` automatically before starting the server.
5. Once deployed, register the production webhook endpoint in the Stripe Dashboard pointing
   at `https://<your-render-service>.onrender.com/webhooks/stripe`, and update
   `STRIPE_WEBHOOK_SECRET` in Render to match the production webhook's signing secret.

### Frontend → Vercel

1. Import the repo into Vercel, set the project root to `frontend/`.
2. Add environment variable `NEXT_PUBLIC_API_URL` = your Render backend's public URL.
3. Deploy.
4. Update `FRONTEND_URL` in the Render backend's env vars to match the deployed Vercel URL
   (needed for CORS and Stripe Checkout redirect URLs), then redeploy the backend.

---

## 7. Feature/plan gate summary

| Feature | Free | Pro |
|---|---|---|
| Resume upload (PDF) or paste + JD paste | ✅ | ✅ |
| Match score + ATS/Readability/Keyword/Impact sub-scores | ✅ | ✅ |
| Gaps, weak areas, strengths, suggestions | ✅ | ✅ |
| Reviews per day | 3 (resets midnight UTC) | Unlimited |
| Interview Readiness Simulator | ❌ (sidebar tab disabled + tooltip) | ✅ |
| Review history + History drawer | ✅ | ✅ |
| Downloadable text report | ✅ | ✅ |

All plan gating (daily cap, Pro-only output) is enforced **server-side** in
`backend/app/routers/reviews.py` — the frontend UI (disabled sidebar tabs, tooltips) only
reflects it, it does not enforce it.

---

## 8. Validation

Every input is validated both client-side (immediate feedback) and server-side (the actual
boundary — never trust the client alone):

| Input | Rule |
|---|---|
| Resume text | 100–20,000 characters |
| Job description text | 50–10,000 characters |
| Resume PDF upload | Must be a real PDF (content-type or `.pdf` extension), max 5 MB |
| Email | Valid email format |
| Password | 8–72 characters (72 = bcrypt's hard input limit) |

See TRD §5a for the exact enforcement points in code.

---

## 9. Notes

- Stripe runs in **test mode only** — no real charges occur.
- Cancellation is immediate (no end-of-period grace), per product decision in the PRD.
- The free-tier daily cap resets at midnight UTC, derived on the fly from review timestamps
  (no separate counter table).
- Two Alembic migrations ship with the repo: `0001` (initial schema) and `0002` (adds the
  ATS/readability/keyword/impact sub-scores plus strengths/suggestions columns). Run
  `alembic upgrade head` to apply both on a fresh database.
