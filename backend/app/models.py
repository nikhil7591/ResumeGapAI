import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    plan = Column(String, nullable=False, default="free")  # 'free' | 'pro'

    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    subscription_status = Column(String, nullable=True)  # active | canceled | past_due

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    resume_text = Column(Text, nullable=False)
    jd_text = Column(Text, nullable=False)

    match_score = Column(Integer, nullable=False)
    gaps = Column(JSON, nullable=False, default=list)
    weak_areas = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False)
    plan_at_time = Column(String, nullable=False)  # 'free' | 'pro'

    # Sub-scores shown in the review workspace. ats_score and impact_score are LLM-judged
    # in the same pipeline pass as match_score; readability_score and keyword_match_score
    # are computed deterministically from the actual resume/JD text (no LLM call).
    ats_score = Column(Integer, nullable=False, default=0)
    readability_score = Column(Integer, nullable=False, default=0)
    keyword_match_score = Column(Integer, nullable=False, default=0)
    impact_score = Column(Integer, nullable=False, default=0)
    strengths = Column(JSON, nullable=False, default=list)
    suggestions = Column(JSON, nullable=False, default=list)

    user = relationship("User", back_populates="reviews")
    # Named to match the `interview_prep` field on ReviewOut: Pydantic's from_attributes
    # reads ORM attributes by field name, so this name must match exactly or the API
    # response silently falls back to the schema's `[]` default on every request.
    interview_prep = relationship(
        "InterviewPrepItem", back_populates="review", cascade="all, delete-orphan"
    )


class InterviewPrepItem(Base):
    __tablename__ = "interview_prep_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    review_id = Column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)

    gap = Column(Text, nullable=False)
    question = Column(Text, nullable=False)
    answer_outline = Column(Text, nullable=False)

    review = relationship("Review", back_populates="interview_prep")
