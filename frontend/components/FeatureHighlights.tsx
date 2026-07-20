const features = [
  {
    title: "Instant Gap Analysis",
    description:
      "Upload your resume and a job description — get a 0-100 match score and a specific list of missing skills and weak areas in seconds.",
    icon: "🎯",
    bg: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300",
  },
  {
    title: "Interview Question Prediction",
    description:
      "Our Pro-only Interview Readiness Simulator turns every gap into a likely interview question, so nothing catches you off guard.",
    icon: "🎤",
    bg: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300",
  },
  {
    title: "Answer Outlines, Not Guesswork",
    description:
      "Each predicted question comes with a short answer outline that draws on experience already in your resume.",
    icon: "🧭",
    bg: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300",
  },
  {
    title: "Track Every Application",
    description:
      "Every review is saved to your account so you can revisit past scores, gaps, and prep before each interview.",
    icon: "🗂️",
    bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300",
  },
];

export default function FeatureHighlights() {
  return (
    <section id="features" className="mx-auto max-w-[88rem] px-6 py-20">
      <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
        Built for interview prep, not just keyword matching
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl ${f.bg}`}>
              {f.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              {f.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
