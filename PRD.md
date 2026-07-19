# Product Requirements Document (PRD)
## AI Resume Reviewer — "Know your resume's gaps, and exactly what you'll be asked about them"

---

## 1. Overview

**Product name:** AI Resume Reviewer
**One-line pitch:** Upload your resume, paste a job description — get a match score, a gap analysis, and (Pro) a set of predicted interview questions with answer outlines built specifically from your gaps.

**Problem it solves:** Most resume tools are glorified keyword checkers. They tell you what's "missing" but not what a recruiter will actually ask about it, or how to answer. This tool closes that loop — it turns a gap analysis into interview prep.

**Target user:** Job seekers actively applying — especially people applying to roles slightly outside their current experience, who want to walk into an interview prepared for the exact questions their resume gaps will invite.

**Why this wins as a hackathon submission:** It's a real, narrow, defensible feature (not "just another ATS checker"), it naturally gates well into Free vs Pro, and the core loop (upload → score → gaps → interview prep) is demoable in under 2 minutes.

---

## 2. Goals & Non-Goals

### Goals
- A stranger can land on the site, understand the value in 5 seconds, sign up, and get a real resume review with zero hand-holding.
- Free tier is genuinely useful (score + gaps) so people convert on value, not because the free tier is broken/crippled.
- Pro tier delivers a materially different, higher-value output (interview questions + answer outlines) — not just "more of the same."
- Every review is persisted and viewable as history, per user.
- Payment → plan upgrade is real and automatic (webhook-driven), no manual intervention.

### Non-Goals (explicitly out of scope for this build)
- Resume editing/rewriting (we analyze, we don't rewrite the resume for the user)
- Multi-resume comparison, team/recruiter-facing views, ATS integrations
- Real billing (only Stripe test mode — no real money)
- Mobile app — responsive web only
- Multi-language support (English resumes/JDs only for v1)
- Fine-grained analytics dashboard beyond basic review history

---

## 3. User Personas

**Primary: "Job-Hopping Jordan"** — mid-level professional applying to 5-10 roles/week, wants fast, specific feedback per application rather than generic resume advice.

**Secondary: "Career-Switcher Casey"** — moving into an adjacent role, knows they have gaps, wants to know exactly how those gaps will surface in an interview and how to talk around them.

---

## 4. User Journeys

### 4.1 First-time visitor → signup
1. Lands on marketing page, reads hero + features + pricing
2. Clicks "Get Started Free" (or "Go Pro") on pricing table — if already logged in, these CTAs skip signup and go straight to the dashboard or Stripe Checkout instead of asking them to sign up again
3. Redirected into signup form (email + password)
4. Account created, redirected to the Dashboard page

### 4.2 Free user runs a review
1. On the Dashboard page, pastes resume text or uploads a PDF (client- and server-side validated: min/max length, PDF-only, 5 MB max)
2. Pastes job description text (also length-validated)
3. Clicks "Analyze resume"
4. Redirected to a dedicated review page (`/dashboard/reviews/{id}`) showing the full workspace: match score, sub-scores (ATS, Readability, Keyword Match, Impact), gaps, weak areas, strengths, and suggestions
5. Review is saved; appears in the History drawer (opened from the navbar)
6. If they've hit 3 reviews today, the form is disabled with an upsell message instead of submitting

### 4.3 Free user upgrades to Pro
1. Clicks "Upgrade to Pro" (from app, billing page, or pricing table)
2. Redirected to Stripe Checkout (test mode)
3. Completes test payment
4. Redirected back to app with success state
5. Behind the scenes: webhook fires, user's plan flips to "pro" in DB
6. Interview Readiness Simulator is now unlocked for that user immediately (no page refresh required beyond redirect)

### 4.4 Pro user runs a review
1. Same upload/paste flow as free
2. Sees score + gap list (same as free) PLUS a new section: "Interview Readiness Simulator"
3. For each gap: one likely interview question + a short suggested answer outline drawing on their actual resume content
4. All saved to the same review record, viewable later in history

### 4.5 Managing billing
1. User goes to Billing/Account page
2. Sees current plan (Free or Pro) and subscription status
3. Can click "Cancel Subscription" → Stripe cancellation → plan downgrades to Free immediately

### 4.6 Navigating between past reviews
1. From any page, clicking "🕒 History" in the top-right of the navbar opens a right-side drawer listing past reviews (newest first, with date and score)
2. Clicking an entry opens that review's workspace page and closes the drawer
3. On the review workspace page, a persistent left sidebar lists every section (Overview, Gap Analysis, Content Review, ATS Score, Suggestions, Strengths, Interview Prep, Summary) — clicking between them swaps the content without re-fetching or navigating away
4. On the plain Dashboard page (no review currently open), all sidebar sections except "Dashboard" itself are disabled and show a tooltip on hover explaining why (run a review first, or upgrade to Pro for Interview Prep)

---

## 5. Features & Requirements (functional)

### 5.1 Marketing / Landing Page
- Hero section: headline, subheadline, primary CTA ("Get Started Free")
- Feature highlights: 3-4 short blocks (e.g. "Instant Gap Analysis," "Interview Question Prediction," "Track Every Application")
- Pricing table: Free vs Pro, feature comparison, CTA buttons that go directly into signup (Pro CTA can pre-select the Pro plan post-signup)
- No login wall to view this page

### 5.2 Authentication
- Email + password signup and login
- Logged-in session persists across page reloads/browser restarts (within token expiry)
- Logout capability
- All app pages (dashboard, review, history, billing) require auth; redirect to login if not authenticated

### 5.3 Resume Review Engine (core feature — Free + Pro)
- Input: resume (PDF upload or pasted text) + job description (pasted text)
- Output:
  - Match score (0-100) — overall fit for the role
  - ATS Score (0-100) — likely applicant-tracking-system parsing/structure compatibility
  - Readability Score (0-100) — computed with a real Flesch Reading Ease formula, no LLM involved
  - Keyword Match Score (0-100) — computed deterministically as JD-keyword overlap, no LLM involved
  - Impact Score (0-100) — how much of the resume uses quantified, outcome-driven achievements
  - Gaps — missing skills/experience relative to the JD
  - Weak areas — present but underdeveloped areas
  - Strengths — clear matches to the JD
  - Suggestions — concrete edits to strengthen the resume
  - Short overall summary line
- Every review saved per-user with timestamp, retrievable via the History drawer and the review workspace page
- Free tier: capped at 3 reviews per calendar day (server-enforced, not just UI-hidden)
- Free tier does not receive the Interview Readiness section, even if requested via direct API call
- Input validation (enforced both client- and server-side — server is authoritative):
  - Resume text: 100–20,000 characters
  - Job description text: 50–10,000 characters
  - Resume PDF upload: must be a real PDF (content-type or extension checked), max 5 MB

### 5.4 Interview Readiness Simulator (Pro-only differentiator)
- Built directly from the gaps identified in 5.3 — not a generic question bank
- For each significant gap: one realistic interview question + one answer outline suggesting how to use existing resume experience to address it
- Displayed as a clear question → answer-outline list under the score/gap section
- Persisted as part of the same review record
- Enforced server-side: a Free user hitting this feature (via UI or API) is blocked and shown an upgrade prompt, not partial/degraded output

### 5.5 History
- List of past reviews per user (date, JD snippet or title, score)
- Click into a past review to see full saved output (score, gaps, and interview questions if it was a Pro review at the time)

### 5.6 Subscriptions & Billing
- Two tiers: Free, Pro (price TBD — placeholder $9/mo or $12/mo for test mode)
- Upgrade flow via Stripe Checkout (test mode)
- Plan state lives in our DB, kept in sync via Stripe webhooks — not trusted from client
- Billing/Account page: shows current plan, upgrade CTA (if free), cancel CTA (if pro)
- Cancellation goes through Stripe, DB updates only after webhook confirms

### 5.7 Deployment
- Publicly reachable URL, no auth required to view the marketing page
- Full signup → pay → use flow must work for an anonymous stranger with a Stripe test card

---

## 6. Tiering / Feature Gate Matrix

| Feature | Free | Pro |
|---|---|---|
| Resume upload + JD paste | Yes | Yes |
| Match score + sub-scores (ATS/Readability/Keyword/Impact) | Yes | Yes |
| Gaps, weak areas, strengths, suggestions | Yes | Yes |
| Reviews per day | 3 | Unlimited |
| Interview Readiness Simulator | No | Yes |
| Review history + History drawer | Yes | Yes |
| Downloadable text report | Yes | Yes |

---

## 7. Success Criteria (for hackathon judging)

- A judge with no prior context can sign up cold, run a free review, hit the 3/day cap, upgrade with a Stripe test card, and immediately see Pro-only output — without any manual intervention from the candidate.
- Refreshing the page at any point does not log the user out or lose in-progress plan state.
- Cancelling reverts Pro features off, reflected via webhook, not just a client-side flag.
- Everything above works on the deployed public URL, not just localhost.

---

## 8. Decisions (confirmed)

1. **Pricing:** Pro at $9/mo placeholder (test mode, no real charge).
2. **Cancellation timing:** Immediate downgrade on cancel — no end-of-period grace. Simpler to build/demo; a production version would honor period end instead.
3. **Free tier daily cap reset:** Midnight UTC — server counts reviews created since start of current UTC day.
4. **Resume input:** Both PDF upload and pasted text are in scope.
5. **JD input:** Pasted text only (no file upload or URL scraping).
