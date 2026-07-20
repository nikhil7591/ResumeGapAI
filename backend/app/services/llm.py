import json
import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)

_client = Groq(api_key=settings.groq_api_key)


def _chat_json(model: str, system_prompt: str, user_prompt: str) -> dict:
    """Call Groq chat completion, forcing JSON-object output, with one retry on parse failure."""
    for attempt in range(2):
        response = _client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        raw = response.choices[0].message.content
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError) as exc:
            logger.warning("LLM JSON parse failed (attempt %s): %s", attempt + 1, exc)
            if attempt == 1:
                raise ValueError(f"LLM did not return valid JSON after retry: {raw!r}") from exc
    raise AssertionError("unreachable")


def expand_jd_hyde(jd_text: str) -> str:
    """HyDE-style expansion: generate a hypothetical ideal-candidate profile for this JD,
    used as a richer comparison target than the raw JD text alone."""
    system_prompt = (
        "You are an expert technical recruiter. Given a job description, write a detailed "
        "profile (skills, tools, years of experience, achievements) describing the ideal "
        "candidate who would be a perfect match for this role. Be specific and concrete. "
        "Respond with plain text only, no preamble."
    )
    response = _client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": jd_text},
        ],
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()


def score_and_extract_gaps(resume_text: str, jd_text: str, ideal_candidate_profile: str) -> dict:
    system_prompt = (
        "You are an expert resume reviewer. Compare a candidate's resume against a job "
        "description and an 'ideal candidate profile' (a hypothetical perfect-match "
        "profile for this role). Respond ONLY with a JSON object with this exact shape:\n"
        "{\n"
        '  "match_score": <integer 0-100>,       // overall fit for this specific role\n'
        '  "gaps": [<string>, ...],              // specific missing skills/experience, max 6\n'
        '  "weak_areas": [<string>, ...],        // areas present but underdeveloped, max 6\n'
        '  "strengths": [<string>, ...],         // areas where the resume clearly matches, max 6\n'
        '  "suggestions": [<string>, ...],       // concrete edits to improve the resume, max 6\n'
        '  "impact_score": <integer 0-100>,      // how much of the resume uses quantified, '
        "outcome-driven achievements (numbers, %, scale) versus vague duty statements\n"
        '  "summary": <string>                   // one or two sentence overall summary\n'
        "}"
    )
    user_prompt = (
        f"JOB DESCRIPTION:\n{jd_text}\n\n"
        f"IDEAL CANDIDATE PROFILE:\n{ideal_candidate_profile}\n\n"
        f"CANDIDATE RESUME:\n{resume_text}"
    )
    result = _chat_json(settings.groq_model, system_prompt, user_prompt)

    def _clamped_score(key: str) -> int:
        return max(0, min(100, int(result.get(key, 0))))

    result["match_score"] = _clamped_score("match_score")
    result["impact_score"] = _clamped_score("impact_score")
    result["gaps"] = list(result.get("gaps") or [])[:6]
    result["weak_areas"] = list(result.get("weak_areas") or [])[:6]
    result["strengths"] = list(result.get("strengths") or [])[:6]
    result["suggestions"] = list(result.get("suggestions") or [])[:6]
    result["summary"] = str(result.get("summary") or "").strip()
    return result


def judge_match_score(resume_text: str, jd_text: str, review: dict) -> int:
    """LLM-as-a-judge pass: sanity-check match_score against the listed gaps/weak areas.
    Returns only the (possibly corrected) match_score — the judge never touches the other
    fields, so the caller merges this back into the original review dict rather than risking
    a second LLM call silently dropping fields it wasn't asked to reproduce."""
    system_prompt = (
        "You are a strict quality-control reviewer for an automated resume-scoring system. "
        "You will be given a resume, a job description, and a proposed score/gaps/summary. "
        "Check whether the match_score is consistent with the severity and number of gaps "
        "listed (more/severe gaps should mean a lower score). Respond ONLY with a JSON object "
        "of this exact shape:\n"
        "{\n"
        '  "match_score": <integer 0-100>  // unchanged if already consistent, corrected if not\n'
        "}"
    )
    user_prompt = (
        f"JOB DESCRIPTION:\n{jd_text}\n\n"
        f"CANDIDATE RESUME:\n{resume_text}\n\n"
        f"PROPOSED REVIEW:\n{json.dumps(review)}"
    )
    try:
        judged = _chat_json(settings.groq_judge_model, system_prompt, user_prompt)
        return max(0, min(100, int(judged.get("match_score", review["match_score"]))))
    except (ValueError, TypeError):
        logger.warning("Judge pass failed to return valid JSON; keeping unjudged match_score.")
        return review["match_score"]


def generate_interview_prep(resume_text: str, jd_text: str, gaps: list[str]) -> list[dict]:
    """Pro-only: generate five likely interview questions and answer outlines that draw on
    the candidate's actual resume content and the target job description."""
    system_prompt = (
        "You are an experienced interview coach. Generate EXACTLY 5 realistic interview "
        "questions a recruiter would ask, each paired with a short answer outline (2-4 "
        "sentences). Use the candidate's resume, the job description, and the listed gaps. "
        "If there are gaps, formulate questions around them. Also formulate questions around "
        "the candidate's strengths relevant to the job description. For each answer outline, suggest "
        "how the candidate could bridge any gap or highlight their strengths using related "
        "experience actually present in their resume. Respond ONLY with a JSON object of "
        "this exact shape:\n"
        "{\n"
        '  "items": [\n'
        '    {"gap": <string, use "N/A" if based on strength rather than a gap>, "question": <string>, "answer_outline": <string>},\n'
        "    ... exactly 5 total items ...\n"
        "  ]\n"
        "}"
    )
    
    gaps_text = "\n".join(f"- {g}" for g in gaps) if gaps else "None (Candidate is a strong match)"
    
    user_prompt = (
        f"JOB DESCRIPTION:\n{jd_text}\n\n"
        f"CANDIDATE RESUME:\n{resume_text}\n\n"
        f"GAPS:\n{gaps_text}"
    )

    result = _chat_json(settings.groq_model, system_prompt, user_prompt)
    items = result.get("items") or []
    cleaned = []
    for item in items:
        gap = str(item.get("gap") or "").strip()
        question = str(item.get("question") or "").strip()
        answer_outline = str(item.get("answer_outline") or "").strip()
        if gap and question and answer_outline:
            cleaned.append({"gap": gap, "question": question, "answer_outline": answer_outline})
    return cleaned[:5]
