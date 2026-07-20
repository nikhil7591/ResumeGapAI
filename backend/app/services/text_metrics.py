import re

_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "have", "will",
    "your", "you", "are", "was", "were", "has", "had", "our", "their",
    "into", "about", "than", "then", "these", "those", "such", "not",
    "can", "may", "must", "should", "would", "could", "who", "whom",
    "what", "when", "where", "which", "while", "there", "here", "also",
    "job", "role", "work", "team", "years", "year", "experience",
}

_WORD_RE = re.compile(r"[a-zA-Z]+")
_SENTENCE_SPLIT_RE = re.compile(r"[.!?]+")
_VOWEL_GROUP_RE = re.compile(r"[aeiouy]+")


def _count_syllables(word: str) -> int:
    word = word.lower()
    groups = _VOWEL_GROUP_RE.findall(word)
    count = len(groups)
    if word.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


def compute_readability_score(text: str) -> int:
    """Flesch Reading Ease, computed directly from the actual resume text — no LLM involved.
    Clamped to 0-100 for display; real Flesch scores can technically fall outside that range
    for unusual text, but resumes are short enough that clamping doesn't distort the signal."""
    words = _WORD_RE.findall(text)
    sentences = [s for s in _SENTENCE_SPLIT_RE.split(text) if s.strip()]

    word_count = len(words)
    sentence_count = max(len(sentences), 1)
    if word_count == 0:
        return 0

    syllable_count = sum(_count_syllables(w) for w in words)

    score = (
        206.835
        - 1.015 * (word_count / sentence_count)
        - 84.6 * (syllable_count / word_count)
    )
    return max(0, min(100, round(score)))


def compute_keyword_match_score(resume_text: str, jd_text: str) -> int:
    """Deterministic keyword overlap: extracts the JD's most frequent meaningful words and
    measures what fraction of them literally appear in the resume text. Complements (does
    not replace) the LLM's semantic gap analysis with a plain, explainable number."""
    jd_words = [w.lower() for w in _WORD_RE.findall(jd_text) if len(w) > 3]
    jd_keywords = [w for w in jd_words if w not in _STOPWORDS]
    if not jd_keywords:
        return 0

    seen = set()
    unique_keywords = []
    for w in jd_keywords:
        if w not in seen:
            seen.add(w)
            unique_keywords.append(w)
    top_keywords = unique_keywords[:30]

    resume_lower = resume_text.lower()
    matched = sum(1 for kw in top_keywords if kw in resume_lower)

    return round((matched / len(top_keywords)) * 100)


def compute_ats_score(resume_text: str) -> int:
    """Deterministic ATS score based on structural heuristics visible in the extracted text."""
    score = 40
    text_lower = resume_text.lower()

    # Reward standard sections
    sections = ["experience", "education", "skills", "summary", "projects", "work history", "objective"]
    found_sections = sum(1 for sec in sections if re.search(r'\b' + sec + r'\b', text_lower))
    score += min(found_sections * 5, 25)

    # Reward contact info
    if "@" in resume_text and "." in resume_text:
        score += 10
    
    # Simple regex for US/International phone numbers
    if re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text) or re.search(r'\+\d{1,3}[-.\s]?\d{4,10}', resume_text):
        score += 10
        
    # Word count heuristic (ATS prefers meaty resumes, but not too long)
    word_count = len(resume_text.split())
    if word_count > 200:
        score += 15
    elif word_count > 100:
        score += 5
    else:
        score -= 20
        
    return max(0, min(100, score))
