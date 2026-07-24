from fastapi import APIRouter

from app.api.v1 import events, sessions, tasks, whitelist

router = APIRouter(prefix="/api/v1")

router.include_router(tasks.router)
router.include_router(sessions.router)
router.include_router(whitelist.router)
router.include_router(events.router)
