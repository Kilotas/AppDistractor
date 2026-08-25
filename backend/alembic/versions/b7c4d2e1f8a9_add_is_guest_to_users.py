"""add is_guest to users

Revision ID: b7c4d2e1f8a9
Revises: a3f2b1c9d4e5
Create Date: 2026-08-25

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b7c4d2e1f8a9'
down_revision: Union[str, None] = 'a3f2b1c9d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_guest', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'is_guest')
