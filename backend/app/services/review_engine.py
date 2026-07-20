from app.services.llm import (
    expand_jd_hyde,
    score_and_extract_gaps,
    judge_match_score,
    generate_interview_prep,
)
from app.services.text_metrics import compute_readability_score, compute_keyword_match_score, compute_ats_score


def run_review_pipeline(resume_text: str, jd_text: str, is_pro: bool) -> dict:
    """Runs the full review pipeline:
    1. HyDE-style JD expansion
    2. Score + gap/strengths/suggestions extraction (match_score, ats_score, impact_score)
    3. LLM-as-a-judge validation pass on match_score
    4. Deterministic readability + keyword-match scores (no LLM, computed from actual text)
    5. (Pro only) Interview readiness generation

    Returns a dict ready to persist.
    """
    ideal_candidate_profile = expand_jd_hyde(jd_text)

    review = score_and_extract_gaps(resume_text, jd_text, ideal_candidate_profile)
    review["match_score"] = judge_match_score(resume_text, jd_text, review)

    readability_score = compute_readability_score(resume_text)
    keyword_match_score = compute_keyword_match_score(resume_text, jd_text)
    ats_score = compute_ats_score(resume_text)

    interview_prep: list[dict] = []
    if is_pro:
        interview_prep = generate_interview_prep(resume_text, jd_text, review["gaps"])

    return {
        "match_score": review["match_score"],
        "gaps": review["gaps"],
        "weak_areas": review["weak_areas"],
        "strengths": review["strengths"],
        "suggestions": review["suggestions"],
        "summary": review["summary"],
        "ats_score": ats_score,
        "impact_score": review["impact_score"],
        "readability_score": readability_score,
        "keyword_match_score": keyword_match_score,
        "interview_prep": interview_prep,
    }
