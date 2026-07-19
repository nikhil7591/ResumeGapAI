"""initial schema: users, reviews, interview_prep_items

Revision ID: 0001
Revises:
Create Date: 2026-07-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("plan", sa.String(), nullable=False, server_default="free"),
        sa.Column("stripe_customer_id", sa.String(), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(), nullable=True),
        sa.Column("subscription_status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resume_text", sa.Text(), nullable=False),
        sa.Column("jd_text", sa.Text(), nullable=False),
        sa.Column("match_score", sa.Integer(), nullable=False),
        sa.Column("gaps", sa.JSON(), nullable=False),
        sa.Column("weak_areas", sa.JSON(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("plan_at_time", sa.String(), nullable=False),
    )
    op.create_index("ix_reviews_user_id", "reviews", ["user_id"])

    op.create_table(
        "interview_prep_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("gap", sa.Text(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer_outline", sa.Text(), nullable=False),
    )
    op.create_index("ix_interview_prep_items_review_id", "interview_prep_items", ["review_id"])


def downgrade() -> None:
    op.drop_index("ix_interview_prep_items_review_id", table_name="interview_prep_items")
    op.drop_table("interview_prep_items")
    op.drop_index("ix_reviews_user_id", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
