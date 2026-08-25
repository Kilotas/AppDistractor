"""add email verification fields

Revision ID: a3f2b1c9d4e5
Revises: 4e8143de368a
Create Date: 2026-07-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a3f2b1c9d4e5'
down_revision: Union[str, None] = '4e8143de368a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('verification_token', sa.String(64), nullable=True))
    op.create_index('ix_users_verification_token', 'users', ['verification_token'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_verification_token', table_name='users')
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'is_verified')
