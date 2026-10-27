# FocusVoid — Project Context for Claude Code

## Что это за проект

**FocusVoid** — productivity приложение. Пользователь ставит задачу → указывает белый список сайтов → Chrome-расширение блокирует всё остальное → логирование событий → статистика → AI-анализ задач.

Репозиторий: https://github.com/Kilotas/AppDistractor (публичный — **никаких паролей и ключей в коммитах**).

## Как Claude работает в этом проекте

- **Перед началом задачи** — показать план схемой: какие слои затронуты и в каком порядке.
  ```
  Задача: <что делаем>
  [frontend] LoginPage.tsx ──► [api] client.ts ──► [backend] api/v1/auth.py ──► services/auth.py
  Шаги: 1) ...  2) ...  3) ...
  Проверка: tsc / pytest / curl на /health
  ```
- **После задачи** — короткий итог: что изменено (файлы), чем проверено, что осталось.
- План разработки по этапам — в [ROADMAP.md](ROADMAP.md). Брать задачи оттуда, отмечать выполненные `[x]`.
- После каждой заметной фичи — обновлять раздел «Статус» ниже и чекбоксы в `ROADMAP.md`.
- Секреты не читать и не печатать в чат; новые переменные окружения добавлять в `backend/.env.example` с пустым значением.

## Архитектура

```
                         ┌──────────────────────────────┐
  ┌──────────────┐  JWT  │  Backend  FastAPI  :8000     │      ┌──────────────┐
  │ Frontend     │──────►│  /api/v1/*                   │─────►│ PostgreSQL   │
  │ React + Vite │◄──────│                              │      │ (Alembic)    │
  │ :5173        │       │  api/v1  →  services  →  UoW │      └──────────────┘
  └──────────────┘       │              │       → repos │
                         │              ▼               │
  ┌──────────────┐  JWT  │  ┌────────────────────────┐  │
  │ Chrome ext.  │──────►│  │ Внешние сервисы        │  │
  │ MV3          │       │  │ • Яндекс SMTP / Resend │  │
  │ background.js│       │  │ • Claude API (insights)│  │
  └──────────────┘       │  │ • LemonSqueezy         │  │
                         │  │ • Sentry               │  │
                         │  └────────────────────────┘  │
                         │  APScheduler: routines, :00  │
                         └──────────────────────────────┘
```

Слои бэкенда (запрос идёт сверху вниз):

```
api/v1/<router>.py      HTTP, валидация (Pydantic schemas), Depends
        │
services/<name>.py      бизнес-логика, ошибки из app/exceptions.py
        │
unit_of_work/           SQLAlchemyUoW — транзакция, uow.users / uow.tasks / ...
        │
repositories/           async-запросы к БД
        │
domain/models/          SQLAlchemy модели
```

## Основные потоки

**Фокус-сессия (ядро продукта):**
```
Frontend/Popup: POST /sessions/start (task_id)
   └► background.js получает session + whitelist
        └► declarativeNetRequest по task.block_mode:
             whitelist — BLOCK_ALL (prio 1) + allow для каждого домена (prio 2)
             blacklist — редирект только для доменов из списка (ID от 1000)
             └► юзер открыл чужой сайт → редирект на blocked/blocked.html?url=...
                  └► tabs.onUpdated ловит blocked.html → POST /events (BlockedEvent, дедуп 5 сек)
Stop: POST /sessions/{id}/stop → правила снимаются → stats / focus score / insights
```

**Регистрация и подтверждение email:**
```
POST /auth/register ──► токен + письмо (verification_token)
        │                    │
        │              /verify?token=... ──► POST /auth/verify ──► is_verified=true
        ▼
неподтверждённый юзер: логин работает, но эндпоинты с проверкой verified → 403
POST /auth/resend-verification {email}   (без авторизации, тихий ответ, 3/мин)
```

**Оплата:** `POST /billing/checkout` → LemonSqueezy checkout URL → оплата → `POST /billing/webhook` → `plan=pro`. Доступ: `user_has_access(user)` = PRO или 7-дневный триал.

**Routines:** APScheduler каждый час в :00 → `run_scheduled()` → Morning Brief / End of Day / Weekly Summary на email.

## Стек

- **Backend:** FastAPI + SQLAlchemy (async) + PostgreSQL + Alembic + APScheduler
- **Frontend:** React + Vite + TypeScript + CSS Modules
- **Extension:** Chrome Extension Manifest V3 (service worker)
- **Email:** Яндекс SMTP (`aiosmtplib`) → Resend → лог
- **AI:** Claude API (`claude-haiku-4-5-20251001`) для insights
- **Billing:** LemonSqueezy
- **Monitoring:** Sentry

## Запуск

```bash
cp backend/.env.example .env      # compose читает .env из корня; все ключи опциональны
docker compose up --build -d
# frontend: http://localhost:5173
# backend:  http://localhost:8000
```

Тесты бэкенда (нужен Postgres с базой `*_test`; команда запуска контейнера — в `backend/tests/conftest.py`):

```bash
pip install -e "backend[dev]"
cd backend && pytest            # база по умолчанию: localhost:5433/focus_test, иначе TEST_DATABASE_URL
```

CI (`.github/workflows/ci.yml`) на каждый PR и push в `main`: backend `pytest` + frontend `npm run lint` и `npm run build`.

Тестовый аккаунт: зарегистрируйся локально, затем выставь `is_verified=true`, `plan='pro'` вручную через psql.

## Прод (Railway, аккаунт kilotas234@gmail.com, проект focusvoid)

```
https://focusvoid.com, https://www.focusvoid.com  → frontend  (Dockerfile.prod: vite build → serve)
https://api.focusvoid.com                         → backend   (Dockerfile.prod: alembic upgrade head при старте)
postgres                                          Railway plugin
```
- Домен куплен на Porkbun (DNS там же): ALIAS `@` и CNAME `www`/`api` → `*.up.railway.app`, TXT `_railway-verify*`.
- Старые адреса `frontend-production-cb0f.up.railway.app` / `backend-production-506f.up.railway.app` тоже работают.
- Почта: Resend, домен focusvoid.com подтверждён, отправитель `EMAIL_FROM=FocusVoid <noreply@focusvoid.com>`.
- URL API: Railway-переменная `VITE_API_URL` у frontend (build-arg), дефолт в `frontend/Dockerfile.prod`.
- Расширение по умолчанию ходит в прод; для локальной разработки — `apiBaseUrl` в `chrome.storage.local`.
- `frontend/nginx.conf` больше не используется прод-сборкой.

## Структура проекта

```
backend/
  alembic/versions/     # миграции БД
  app/
    api/v1/             # роутеры: auth, tasks, sessions, stats, subtasks, billing, routines, events, whitelist
    core/               # config, database
    domain/
      models/           # SQLAlchemy модели
      schemas/          # Pydantic схемы
    repositories/       # репозитории (async)
    services/           # бизнес-логика
    unit_of_work/       # SQLAlchemyUoW (UoW паттерн)
    exceptions.py       # NotFoundError, ConflictError, AuthError, ForbiddenError, PaymentRequiredError
  tests/                # pytest через HTTP API на Postgres (conftest.py: БД, клиент, перехват писем)
frontend/
  src/
    api/client.ts       # все API вызовы
    components/         # AppLayout, LiveTimer, LangToggle
    pages/              # все страницы
    i18n/index.tsx      # переводы RU/EN (useT hook)
extension/
  popup/                # popup.html + popup.js
  blocked/              # blocked.html + blocked.js
  background.js         # service worker, блокировка через declarativeNetRequest
  api.js                # общение с backend
```

## Статус

```
Готово ✅                         В работе / не хватает ⚠️               Не начато ⬜
───────────────────────────────  ─────────────────────────────────────  ─────────────────────────────
Auth, guest, reset, history      ANTHROPIC_API_KEY не задан на Railway  Подзадачи в попапе расширения
Tasks / subtasks / sessions                                             Дневная цель с прогресс-баром
Whitelist / blacklist + блокировка
Stats, streak, focus score
AI insights (код)
Домен focusvoid.com + SSL
Почта с noreply@focusvoid.com
Routines + ссылка в sidebar      LEMONSQUEEZY_* не заданы на Railway
Архив задач                      2 отключённых тома Postgres в Railway
График фокус-скора (recharts)      (проверить и удалить)
Billing (код)
Деплой на Railway (3 сервиса)
resend-verification по email
Тесты backend + GitHub Actions CI
«Что отвлекает» (дашборд, письмо)
```

### Детали готовых фич

- **Auth:** JWT, email verification, rate limiting (slowapi), guest mode (`POST /auth/guest`, `is_guest=True`), forgot/reset/change password, запрет последних 5 паролей (`PasswordHistory`, `UoW.password_history`).
- **Задачи:** CRUD, архив (`is_active`), подзадачи с позициями и mini-progress (`subtask_count`, `completed_count` через LEFT JOIN), `GET /tasks/{id}/insights`.
- **Сессии:** `GET /sessions/active` — все активные сессии одним запросом; WhitelistEntry с IDNA-кодированием; BlockedEvent.
- **Stats:** `GET /stats/streak`, `GET /stats/daily?days=30`, `GET /stats/focus-score-history`, `GET /stats/distractions?days=30&tz_offset_minutes=180` (топ доменов, попытки по часам в поясе юзера, медиана `session_minute`; считается из `BlockedEvent`). Тот же расчёт идёт в недельное письмо (пояс из `Routine.timezone_offset`) и в промпт AI-инсайтов задачи.
- **Frontend страницы:** `/tasks`, `/dashboard`, `/profile`, `/forgot-password`, `/reset-password`, `/routines`, `/tasks/:id/sessions`, `/sessions/:id/stats`, `/tasks/:id/insights`; `AppLayout` — sidebar.
- **LiveTimer:** тикает локально через `setInterval`, без polling.
- **Расширение:** помодоро (focus/break/long break, SVG кольцо, notifications), звуки (Web Audio, `sounds.js`), RU/EN (своя MESSAGES система, `chrome.storage.local` key `extLang`), тёмная blocked.html со счётчиком.
- **i18n:** `useT()`, `LanguageProvider`, localStorage, строки в `frontend/src/i18n/index.tsx`.
- **Темы:** dark/light через CSS custom properties; `#0b0f1a` фон, `#111827` карточки, `#4f7df9` акцент.

## Миграции Alembic (в порядке)

| Revision | Описание |
|---|---|
| `6b01925dde22` | init |
| `4e8143de368a` | add users + user_id FK to tasks + plan + trial_ends_at |
| `a3f2b1c9d4e5` | add is_verified + verification_token |
| `b7c4d2e1f8a9` | add is_guest |
| `c9e3f1a2b5d7` | add password_reset_token + password_reset_expires_at |
| `6c60ed2bee3b` | add password_history table |
| `d1e2f3a4b5c6` | add routines |
| `e5f6a7b8c9d0` | add tasks.block_mode (**HEAD**) |

## Ключевые паттерны

- **UoW паттерн**: `SQLAlchemyUoW` через `UoWProtocol` — все сервисы получают `uow` через DI
- **DI через FastAPI Depends**: `get_auth_service`, `get_task_service` и т.д. в `api/deps.py`
- **Email приоритет**: Яндекс SMTP → Resend → лог
- **Все emails lowercase** при регистрации и поиске (`func.lower`)
- **Не раскрываем существование email**: forgot-password и resend-verification всегда отвечают одинаково
- **ConflictError** при старте сессии если уже есть активная → возвращает существующую
