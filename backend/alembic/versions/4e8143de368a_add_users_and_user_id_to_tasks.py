"""add users and user_id to tasks

Revision ID: 4e8143de368a
Revises: 6b01925dde22
Create Date: 2026-07-24

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '4e8143de368a'
down_revision: Union[str, None] = '6b01925dde22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('plan', sa.Enum('free', 'pro', name='userplan'), nullable=False, server_default='free'),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.add_column('tasks', sa.Column('user_id', sa.Integer(), nullable=False))
    op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])
    op.create_foreign_key('fk_tasks_user_id', 'tasks', 'users', ['user_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_tasks_user_id', 'tasks', type_='foreignkey')
    op.drop_index('ix_tasks_user_id', table_name='tasks')
    op.drop_column('tasks', 'user_id')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS userplan")
