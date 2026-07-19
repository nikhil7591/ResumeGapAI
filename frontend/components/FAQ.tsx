const faqs = [
  {
    question: "Is the free plan actually free?",
    answer:
      "Yes — 3 resume reviews per day with match score and gap analysis, no credit card required.",
  },
  {
    question: "What's different about the Pro plan?",
    answer:
      "Pro unlocks unlimited reviews plus the Interview Readiness Simulator: predicted interview questions and answer outlines built from your specific gaps.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancelling from the Billing page takes effect immediately — no phone calls, no waiting.",
  },
  {
    question: "Do you store my resume?",
    answer:
      "Your resume and job description text are saved with your review history so you can revisit past results — visible only to your account.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-50">
        Frequently asked questions
      </h2>
      <div className="mt-10 space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-lg border border-gray-200 bg-white p-4 open:shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900 dark:text-gray-50">
              {faq.question}
              <span className="ml-4 text-gray-400 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
