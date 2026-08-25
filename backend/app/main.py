import logging
import time
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request

sentry_sdk.init(
    dsn="https://0f25ceebc1b118b8a99a3032cd085958@o4511966616158208.ingest.de.sentry.io/4511966629658704",
    send_default_pii=True,
    traces_sample_rate=0.1,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import create_all_tables
from app.exceptions import AppError

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Focus App API (env=%s)", settings.APP_ENV)
    await create_all_tables()
    logger.info("Database ready")
    yield
    logger.info("Focus App API shutting down")


app = FastAPI(
    title="Focus App API",
    version="0.1.0",
    debug=settings.APP_DEBUG,
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info("%s %s → %d (%.1fms)", request.method, request.url.path, response.status_code, elapsed)
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    if exc.status_code >= 500:
        logger.error("AppError %d on %s %s: %s", exc.status_code, request.method, request.url.path, exc.detail)
    else:
        logger.warning("AppError %d on %s %s: %s", exc.status_code, request.method, request.url.path, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Берём первую ошибку и возвращаем её msg как строку — удобно для фронта
    first = exc.errors()[0]
    detail = first.get("msg", "Ошибка валидации")
    # Pydantic добавляет "Value error, " префикс к model_validator ошибкам
    detail = detail.removeprefix("Value error, ")
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, detail)
    return JSONResponse(status_code=422, content={"detail": detail})


from app.api.v1 import router as v1_router  # noqa: E402
app.include_router(v1_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "env": settings.APP_ENV}
