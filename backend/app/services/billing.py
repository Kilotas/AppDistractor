from datetime import datetime, timezone

from app.domain.models.user import User, UserPlan


def user_has_access(user: User) -> bool:
    """Возвращает True если у пользователя есть доступ к Pro-фичам (plan=pro или активный триал)."""
    if user.plan == UserPlan.PRO:
        return True
    if user.trial_ends_at is not None:
        return datetime.now(timezone.utc) < user.trial_ends_at
    return False
