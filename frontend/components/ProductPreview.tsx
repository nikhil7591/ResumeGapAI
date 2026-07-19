const tabs = ["Overview", "Gap Analysis", "Interview Prep", "History"];

const topGaps = [
  { label: "No cloud infra experience listed", severity: "High" },
  { label: "Missing leadership examples", severity: "Medium" },
  { label: "Few quantified achievements", severity: "Medium" },
  { label: "Certifications section is thin", severity: "Low" },
];

const severityStyles: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const statTiles = [
  { label: "Match score", value: "78" },
  { label: "Gaps found", value: "4" },
  { label: "Weak areas", value: "3" },
  { label: "Interview Qs", value: "4" },
];

/** Static, decorative illustration of the product's dashboard — not a live view. */
export default function ProductPreview() {
  const score = 78;

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs text-white">
            R
          </span>
          <span className="text-gray-900 dark:text-gray-50">
            ResumeGap<span className="text-brand-600">AI</span>
          </span>
        </div>
        <span className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Sample review
        </span>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto text-xs font-medium text-gray-500 dark:text-gray-400">
        {tabs.map((tab, i) => (
          <span
            key={tab}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 ${
              i === 0
                ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                : ""
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#4f46e5 ${score * 3.6}deg, #e5e7eb 0deg)`,
          }}
        >
          <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white dark:bg-gray-900">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">
              {score}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-500">Match score</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Top gaps found
          </p>
          <ul className="mt-2 space-y-1.5">
            {topGaps.map((gap) => (
              <li key={gap.label} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-700 dark:text-gray-300">{gap.label}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${severityStyles[gap.severity]}`}
                >
                  {gap.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {statTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg bg-gray-50 p-2 text-center dark:bg-gray-800"
          >
            <p className="text-sm font-bold text-gray-900 dark:text-gray-50">{tile.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{tile.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
