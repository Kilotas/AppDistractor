"""add password history

Revision ID: 6c60ed2bee3b
Revises: c9e3f1a2b5d7
Create Date: 2026-08-26

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '6c60ed2bee3b'
down_revision: Union[str, None] = 'c9e3f1a2b5d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'password_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_password_history_user_id', 'password_history', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_password_history_user_id', table_name='password_history')
    op.drop_table('password_history')
