import Link from "next/link";
import { Review } from "@/types";
import { WorkspaceTabId } from "@/lib/review-workspace-context";

function scoreColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Good, but needs improvement";
  if (score >= 50) return "Fair — several gaps to close";
  return "Needs significant work";
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  return (
    <div
      className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#4f46e5 ${score * 3.6}deg, #e5e7eb 0deg)` }}
    >
      <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white dark:bg-gray-900">
        <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">{score}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">/100</span>
        <span className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{label}</span>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900">
      <p className={`text-2xl font-bold ${color}`}>
        {value}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/100</span>
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function BulletList({ items, tone }: { items: string[]; tone: "gap" | "weak" | "strength" | "suggestion" }) {
  const toneMarker: Record<string, string> = {
    gap: "text-red-500",
    weak: "text-amber-500",
    strength: "text-green-500",
    suggestion: "text-brand-600",
  };
  const markerChar: Record<string, string> = {
    gap: "✕",
    weak: "!",
    strength: "✓",
    suggestion: "✓",
  };

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Nothing to show here.</p>;
  }

  return (
    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className={toneMarker[tone]}>{markerChar[tone]}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  review: Review;
  activeTab: WorkspaceTabId;
  onSelectTab: (tab: WorkspaceTabId) => void;
}

export default function ReviewWorkspaceContent({ review, activeTab, onSelectTab }: Props) {
  const isPro = review.plan_at_time === "pro";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-6 dark:border-gray-800 sm:w-64">
              <p className="self-start text-sm font-semibold text-gray-500 dark:text-gray-400">
                Overall Resume Score
              </p>
              <ScoreGauge score={review.match_score} label={scoreLabel(review.match_score)} />
            </div>

            <div className="flex-1 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Top Gaps Found</p>
              <ul className="mt-3 space-y-2 text-sm">
                {review.gaps.slice(0, 5).map((gap) => (
                  <li key={gap} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                    <span className="mt-0.5 text-red-500">●</span>
                    {gap}
                  </li>
                ))}
                {review.gaps.length === 0 && (
                  <li className="text-gray-400 dark:text-gray-500">No major gaps found.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="ATS Score" value={review.ats_score} color={scoreColor(review.ats_score)} />
            <StatTile
              label="Readability"
              value={review.readability_score}
              color={scoreColor(review.readability_score)}
            />
            <StatTile
              label="Keyword Match"
              value={review.keyword_match_score}
              color={scoreColor(review.keyword_match_score)}
            />
            <StatTile label="Impact Score" value={review.impact_score} color={scoreColor(review.impact_score)} />
          </div>

          <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              AI Suggestions Preview
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {review.suggestions.slice(0, 3).map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="text-brand-600">✓</span>
                  {s}
                </li>
              ))}
              {review.suggestions.length === 0 && (
                <li className="text-gray-400 dark:text-gray-500">No suggestions generated.</li>
              )}
            </ul>
            {review.suggestions.length > 3 && (
              <button
                onClick={() => onSelectTab("suggestions")}
                className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View All Suggestions →
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "gaps" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Gap Analysis</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Skills and experience the job description asks for that weren&apos;t found in your resume.
          </p>
          <div className="mt-4">
            <BulletList items={review.gaps} tone="gap" />
          </div>
        </div>
      )}

      {activeTab === "content" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Content Review</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Areas present in your resume but underdeveloped relative to this role.
          </p>
          <div className="mt-4">
            <BulletList items={review.weak_areas} tone="weak" />
          </div>
        </div>
      )}

      {activeTab === "ats" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">ATS Score</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            An estimate of how cleanly this resume would parse through an applicant tracking
            system, based on section structure and formatting cues visible in the text.
          </p>
          <div className="mt-6 flex items-center gap-6">
            <span className={`text-5xl font-extrabold ${scoreColor(review.ats_score)}`}>
              {review.ats_score}
              <span className="text-xl text-gray-400 dark:text-gray-500">/100</span>
            </span>
          </div>
        </div>
      )}

      {activeTab === "suggestions" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">AI Suggestions</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Concrete edits that would strengthen this resume for this specific role.
          </p>
          <div className="mt-4">
            <BulletList items={review.suggestions} tone="suggestion" />
          </div>
        </div>
      )}

      {activeTab === "strengths" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Strengths</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Where this resume already matches what the role is asking for.
          </p>
          <div className="mt-4">
            <BulletList items={review.strengths} tone="strength" />
          </div>
        </div>
      )}

      {activeTab === "interview" && isPro && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Interview Readiness Simulator
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Predicted interview questions built from your gaps, with answer outlines drawn from
            your own resume.
          </p>
          <div className="mt-4 space-y-4">
            {review.interview_prep.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-brand-100 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/60">
                <p className="font-medium text-gray-900 dark:text-gray-100">Q: {item.question}</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Answer outline: </span>
                  {item.answer_outline}
                </p>
              </div>
            ))}
            {review.interview_prep.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No gaps were significant enough to generate interview prep for.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Summary</h3>
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{review.summary}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatTile label="Match Score" value={review.match_score} color={scoreColor(review.match_score)} />
            <StatTile label="ATS Score" value={review.ats_score} color={scoreColor(review.ats_score)} />
            <StatTile
              label="Readability"
              value={review.readability_score}
              color={scoreColor(review.readability_score)}
            />
            <StatTile
              label="Keyword Match"
              value={review.keyword_match_score}
              color={scoreColor(review.keyword_match_score)}
            />
            <StatTile label="Impact Score" value={review.impact_score} color={scoreColor(review.impact_score)} />
          </div>

          {!isPro && (
            <div className="mt-6 rounded-lg border border-dashed border-brand-300 bg-brand-50 p-4 text-sm text-gray-700 dark:border-brand-700 dark:bg-brand-950/60 dark:text-gray-300">
              <span className="font-semibold text-brand-700 dark:text-brand-400">Pro feature:</span>{" "}
              unlock the Interview Readiness Simulator for predicted questions and answer outlines
              built from these gaps.{" "}
              <Link href="/billing" className="font-semibold text-brand-700 underline dark:text-brand-400">
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
