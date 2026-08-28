"""add routines

Revision ID: d1e2f3a4b5c6
Revises: 6c60ed2bee3b
Create Date: 2026-08-28

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, None] = '6c60ed2bee3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'routines',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('morning_brief', 'end_of_day', 'weekly_summary', name='routinetype'), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('hour', sa.Integer(), nullable=False, server_default='7'),
        sa.Column('timezone_offset', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('weekday', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'type', name='uq_routine_user_type'),
    )
    op.create_index('ix_routines_user_id', 'routines', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_routines_user_id', table_name='routines')
    op.drop_table('routines')
    op.execute("DROP TYPE IF EXISTS routinetype")
