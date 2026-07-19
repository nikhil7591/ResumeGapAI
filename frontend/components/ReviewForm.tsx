"use client";

import { useState } from "react";
import api, { ApiError } from "@/lib/api";
import { Review } from "@/types";

interface Props {
  onCreated: (review: Review) => void;
  disabled: boolean;
  disabledReason?: string;
}

const MIN_RESUME_CHARS = 100;
const MAX_RESUME_CHARS = 20000;
const MIN_JD_CHARS = 50;
const MAX_JD_CHARS = 10000;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ReviewForm({ onCreated, disabled, disabledReason }: Props) {
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setResumeFile(null);
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("Only PDF files are supported.");
      setResumeFile(null);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File is too large — please upload a PDF under 5 MB.");
      setResumeFile(null);
      e.target.value = "";
      return;
    }

    setResumeFile(file);
  };

  const validate = (): string | null => {
    if (inputMode === "paste") {
      const trimmed = resumeText.trim();
      if (!trimmed) return "Please paste your resume text.";
      if (trimmed.length < MIN_RESUME_CHARS) {
        return `Resume text looks too short (minimum ${MIN_RESUME_CHARS} characters) — please paste your full resume.`;
      }
      if (trimmed.length > MAX_RESUME_CHARS) {
        return `Resume text is too long (maximum ${MAX_RESUME_CHARS.toLocaleString()} characters).`;
      }
    } else if (!resumeFile) {
      return "Please choose a PDF file.";
    }

    const trimmedJd = jdText.trim();
    if (!trimmedJd) return "Please paste the job description.";
    if (trimmedJd.length < MIN_JD_CHARS) {
      return `Job description looks too short (minimum ${MIN_JD_CHARS} characters).`;
    }
    if (trimmedJd.length > MAX_JD_CHARS) {
      return `Job description is too long (maximum ${MAX_JD_CHARS.toLocaleString()} characters).`;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("jd_text", jdText.trim());
      if (inputMode === "paste") {
        formData.append("resume_text", resumeText.trim());
      } else if (resumeFile) {
        formData.append("resume_file", resumeFile);
      }

      const review = await api.postForm<Review>("/reviews", formData);
      onCreated(review);
      setResumeText("");
      setResumeFile(null);
      setJdText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setInputMode("paste")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              inputMode === "paste"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Paste resume text
          </button>
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              inputMode === "upload"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Upload PDF
          </button>
        </div>

        {inputMode === "paste" ? (
          <>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={8}
              maxLength={MAX_RESUME_CHARS}
              placeholder="Paste your resume text here..."
              className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
            <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
              {resumeText.trim().length}/{MAX_RESUME_CHARS} characters
              {resumeText.trim().length > 0 && resumeText.trim().length < MIN_RESUME_CHARS && (
                <span className="text-amber-600 dark:text-amber-400">
                  {" "}
                  (minimum {MIN_RESUME_CHARS})
                </span>
              )}
            </p>
          </>
        ) : (
          <>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="mt-3 block w-full text-sm text-gray-700 dark:text-gray-300"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">PDF only, up to 5 MB.</p>
            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
            {resumeFile && !fileError && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                ✓ {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Job description
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={8}
          maxLength={MAX_JD_CHARS}
          placeholder="Paste the job description here..."
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
        />
        <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
          {jdText.trim().length}/{MAX_JD_CHARS} characters
          {jdText.trim().length > 0 && jdText.trim().length < MIN_JD_CHARS && (
            <span className="text-amber-600 dark:text-amber-400"> (minimum {MIN_JD_CHARS})</span>
          )}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {disabled && disabledReason && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          {disabledReason}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Analyzing..." : "Analyze resume"}
      </button>
    </form>
  );
}
