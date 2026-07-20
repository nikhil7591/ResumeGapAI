const steps = [
  { step: "1", title: "Upload Resume", description: "Upload your resume in PDF, or paste the text directly.", icon: "⬆️" },
  { step: "2", title: "AI Analysis", description: "Our AI compares it against the job description you're targeting.", icon: "🔍" },
  { step: "3", title: "Get Your Report", description: "See your match score, gaps, and weak areas in seconds.", icon: "📄" },
  { step: "4", title: "Prep & Apply", description: "Pro unlocks the exact interview questions your gaps will invite.", icon: "🚀" },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-gray-100 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div className="mx-auto max-w-[88rem] px-6">
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
          How <span className="text-brand-600">ResumeGapAI</span> Works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-600 dark:text-gray-400">
          Simple steps to a sharper resume and more interviews.
        </p>

        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-gray-300 dark:border-gray-700 sm:block" />
          {steps.map((s) => (
            <div key={s.step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-200 bg-white text-xl shadow-sm dark:border-brand-800 dark:bg-gray-900">
                {s.icon}
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {s.step}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-50">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
