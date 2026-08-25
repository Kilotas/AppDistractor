from fastapi import APIRouter

from app.api.v1 import auth, billing, events, sessions, stats, subtasks, tasks, whitelist

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(billing.router)
router.include_router(tasks.router)
router.include_router(sessions.router)
router.include_router(whitelist.router)
router.include_router(events.router)
router.include_router(stats.router)
router.include_router(subtasks.router)
