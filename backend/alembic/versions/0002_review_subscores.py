"""add ats/readability/keyword/impact scores + strengths/suggestions to reviews

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reviews", sa.Column("ats_score", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("reviews", sa.Column("readability_score", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("reviews", sa.Column("keyword_match_score", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("reviews", sa.Column("impact_score", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("reviews", sa.Column("strengths", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("reviews", sa.Column("suggestions", sa.JSON(), nullable=False, server_default="[]"))


def downgrade() -> None:
    op.drop_column("reviews", "suggestions")
    op.drop_column("reviews", "strengths")
    op.drop_column("reviews", "impact_score")
    op.drop_column("reviews", "keyword_match_score")
    op.drop_column("reviews", "readability_score")
    op.drop_column("reviews", "ats_score")
