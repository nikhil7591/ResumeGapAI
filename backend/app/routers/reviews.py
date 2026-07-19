from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import InterviewPrepItem, Review, User
from app.schemas import ReviewOut, ReviewListItemOut, UsageOut
from app.services.pdf_parser import extract_text_from_pdf
from app.services.review_engine import run_review_pipeline

router = APIRouter(prefix="/reviews", tags=["reviews"])

MIN_RESUME_CHARS = 100
MAX_RESUME_CHARS = 20_000
MIN_JD_CHARS = 50
MAX_JD_CHARS = 10_000
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def _start_of_today_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _reviews_used_today(db: Session, user_id: UUID) -> int:
    return (
        db.query(Review)
        .filter(Review.user_id == user_id, Review.created_at >= _start_of_today_utc())
        .count()
    )


@router.get("/usage", response_model=UsageOut)
def get_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    used = _reviews_used_today(db, current_user.id)
    return UsageOut(used_today=used, limit=settings.free_daily_review_limit, plan=current_user.plan)


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    jd_text: str = Form(...),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.plan == "free":
        used = _reviews_used_today(db, current_user.id)
        if used >= settings.free_daily_review_limit:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    f"You've used all {settings.free_daily_review_limit} free reviews for today. "
                    "Upgrade to Pro for unlimited reviews."
                ),
            )

    if resume_file is not None:
        filename = (resume_file.filename or "").lower()
        is_pdf = resume_file.content_type == "application/pdf" or filename.endswith(".pdf")
        if not is_pdf:
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        file_bytes = resume_file.file.read()
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=400, detail="File is too large — please upload a PDF under 5 MB.")

        resolved_resume_text = extract_text_from_pdf(file_bytes)
    elif resume_text and resume_text.strip():
        resolved_resume_text = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Provide either resume_text or resume_file")

    if len(resolved_resume_text) < MIN_RESUME_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Resume text looks too short (minimum {MIN_RESUME_CHARS} characters).",
        )
    if len(resolved_resume_text) > MAX_RESUME_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Resume text is too long (maximum {MAX_RESUME_CHARS:,} characters).",
        )

    jd_text = jd_text.strip()
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job description text is required")
    if len(jd_text) < MIN_JD_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Job description looks too short (minimum {MIN_JD_CHARS} characters).",
        )
    if len(jd_text) > MAX_JD_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Job description is too long (maximum {MAX_JD_CHARS:,} characters).",
        )

    is_pro = current_user.plan == "pro"
    result = run_review_pipeline(resolved_resume_text, jd_text, is_pro=is_pro)

    review = Review(
        user_id=current_user.id,
        resume_text=resolved_resume_text,
        jd_text=jd_text,
        match_score=result["match_score"],
        gaps=result["gaps"],
        weak_areas=result["weak_areas"],
        strengths=result["strengths"],
        suggestions=result["suggestions"],
        summary=result["summary"],
        plan_at_time=current_user.plan,
        ats_score=result["ats_score"],
        readability_score=result["readability_score"],
        keyword_match_score=result["keyword_match_score"],
        impact_score=result["impact_score"],
    )
    db.add(review)
    db.flush()  # get review.id before adding children

    for item in result["interview_prep"]:
        db.add(
            InterviewPrepItem(
                review_id=review.id,
                gap=item["gap"],
                question=item["question"],
                answer_outline=item["answer_outline"],
            )
        )

    db.commit()
    db.refresh(review)
    return review


@router.get("", response_model=list[ReviewListItemOut])
def list_reviews(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )


@router.get("/{review_id}", response_model=ReviewOut)
def get_review(review_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    review = (
        db.query(Review)
        .filter(Review.id == review_id, Review.user_id == current_user.id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review
