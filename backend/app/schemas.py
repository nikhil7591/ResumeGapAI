from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    plan: str
    subscription_status: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------- Reviews ----------

class ReviewCreateRequest(BaseModel):
    resume_text: str = Field(min_length=1)
    jd_text: str = Field(min_length=1)


class InterviewPrepItemOut(BaseModel):
    gap: str
    question: str
    answer_outline: str

    model_config = {"from_attributes": True}


class ReviewOut(BaseModel):
    id: UUID
    created_at: datetime
    resume_text: str
    jd_text: str
    match_score: int
    gaps: list[str]
    weak_areas: list[str]
    summary: str
    plan_at_time: str
    ats_score: int
    readability_score: int
    keyword_match_score: int
    impact_score: int
    strengths: list[str]
    suggestions: list[str]
    interview_prep: list[InterviewPrepItemOut] = []

    model_config = {"from_attributes": True}


class ReviewListItemOut(BaseModel):
    id: UUID
    created_at: datetime
    match_score: int
    summary: str
    plan_at_time: str

    model_config = {"from_attributes": True}


class UsageOut(BaseModel):
    used_today: int
    limit: int
    plan: str


# ---------- Billing ----------

class CheckoutSessionOut(BaseModel):
    checkout_url: str


class BillingStatusOut(BaseModel):
    plan: str
    subscription_status: Optional[str] = None
