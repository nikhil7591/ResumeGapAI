const benefits = [
  { icon: "🎯", title: "Targeted for Real Roles", description: "Feedback tailored to the exact job you're applying for." },
  { icon: "⚡", title: "Save Time", description: "Get a full gap analysis in seconds, not hours of guesswork." },
  { icon: "🏆", title: "Stand Out", description: "Walk into interviews already knowing what you'll be asked." },
  { icon: "✅", title: "Boost Confidence", description: "Know exactly where your resume is strong — and where it isn't." },
];

export default function BenefitsBand() {
  return (
    <section className="bg-brand-50/60 py-16 dark:bg-gray-900/60">
      <div className="mx-auto max-w-[88rem] px-6">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          Why Job Seekers Choose <span className="text-brand-600">ResumeGapAI</span>
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-white text-xl dark:border-brand-800 dark:bg-gray-900">
                {b.icon}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-50">
                {b.title}
              </h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
