"""add password reset fields to users

Revision ID: c9e3f1a2b5d7
Revises: b7c4d2e1f8a9
Create Date: 2026-08-25

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c9e3f1a2b5d7'
down_revision: Union[str, None] = 'b7c4d2e1f8a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('password_reset_token', sa.String(64), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index('ix_users_password_reset_token', 'users', ['password_reset_token'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_password_reset_token', table_name='users')
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_token')
