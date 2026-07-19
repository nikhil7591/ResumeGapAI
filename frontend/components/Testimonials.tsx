const testimonials = [
  {
    quote:
      "The gap analysis was specific enough that I actually knew what to fix — not just \"add more keywords.\"",
    name: "A. Sharma",
    role: "Software Engineer",
    initials: "AS",
  },
  {
    quote:
      "The predicted interview questions were uncannily close to what I actually got asked. Pro is worth it.",
    name: "P. Singh",
    role: "Data Analyst",
    initials: "PS",
  },
  {
    quote: "Fast, clear, and the answer outlines gave me a real starting point instead of a blank page.",
    name: "R. Verma",
    role: "Product Manager",
    initials: "RV",
  },
];

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
        What early users are saying
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="text-amber-400" aria-hidden>
              {"★★★★★"}
            </div>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {t.initials}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{t.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
