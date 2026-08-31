# FocusVoid — Project Context for Claude Code

## Что это за проект

**FocusVoid** — productivity приложение. Пользователь ставит задачу → указывает белый список сайтов → Chrome-расширение блокирует всё остальное → логирование событий → статистика → AI-анализ задач.

## Стек

- **Backend:** FastAPI + SQLAlchemy (async) + PostgreSQL + Alembic + APScheduler
- **Frontend:** React + Vite + TypeScript + CSS Modules
- **Extension:** Chrome Extension Manifest V3 (service worker)
- **Email:** Яндекс SMTP (`aiosmtplib`), `omaroff.alen@yandex.kz`
- **AI:** Claude API (`claude-haiku-4-5-20251001`) для insights
- **Billing:** LemonSqueezy
- **Monitoring:** Sentry

## Запуск

```bash
docker compose up --build -d
# frontend: http://localhost:5173
# backend:  http://localhost:8000
```

Тестовый аккаунт (локально):
- Email: `alendos87@gmail.com`
- Password: `America123`
- is_verified=true, plan=pro (установить вручную через psql)

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
frontend/
  src/
    api/client.ts       # все API вызовы
    components/         # AppLayout, LiveTimer, LangToggle
    pages/              # все страницы
    i18n/index.tsx      # переводы RU/EN (useT hook)
extension/
  popup/                # popup.html + popup.js
  blocked/              # blocked.html + blocked.js
  background.js         # service worker
  api.js                # общение с backend
```

## Всё сделано ✅

### Auth & Пользователи
- JWT авторизация, email verification, rate limiting (slowapi)
- Guest mode: `POST /auth/guest` — юзер с `is_guest=True`
- Forgot password: `POST /auth/forgot-password`, `POST /auth/reset-password`
- Change password (для залогиненного): `POST /auth/change-password`
- **Password History** — запрет повторного использования последних 5 паролей
  - Модель `PasswordHistory`, репозиторий `PasswordHistoryRepository`
  - `UoW.password_history`

### Задачи и подзадачи
- Tasks CRUD + Sessions start/stop
- Subtasks: CRUD, позиции, mini-progress в карточке (`subtask_count`, `completed_count` через LEFT JOIN)
- `GET /tasks/{id}/insights` — Claude AI анализ

### Сессии и события
- `GET /sessions/active` — все активные сессии юзера одним запросом
- WhitelistEntry с IDNA-кодированием доменов
- BlockedEvent логирование

### Stats & Streak
- `GET /stats/streak` → StreakStats (current/longest streak, total days, last active)
- `GET /stats/daily?days=30` → DailyStats (DailyActivity по дням)
- `GET /stats/focus-score-history` — история фокус-скора

### Routines (scheduled email digests)
- APScheduler в lifespan (каждый час вызывает `run_scheduled()`)
- 3 типа: Morning Brief, End of Day, Weekly Summary
- Модель `Routine`, репозиторий, сервис с HTML шаблонами
- `GET /routines`, `PATCH /routines/{type}`
- Frontend: `RoutinesPage.tsx`
- **Важно:** нужно применить миграцию `d1e2f3a4b5c6_add_routines` + добавить ссылку в nav (AppLayout)

### Billing
- LemonSqueezy: `POST /billing/checkout`, `POST /billing/webhook`
- `user_has_access(user)` — plan=PRO или 7-дневный триал

### Frontend страницы
- `/tasks` — TasksPage: список задач, streak виджет, heatmap 30 дней, today summary, live timer-таблетка
- `/dashboard` — DashboardPage: обзор статистики
- `/profile` — ProfilePage: email, план, триал, смена пароля, выход
- `/forgot-password`, `/reset-password` — flow сброса пароля
- `/routines` — настройки рутин
- `/tasks/:id/sessions`, `/sessions/:id/stats`, `/tasks/:id/insights`
- `AppLayout` — sidebar навигация

### LiveTimer
- `LiveTimer.tsx` — тикает локально через `setInterval`, без polling к API
- TasksPage: карточка подсвечивается + таймер-таблетка при активной сессии

### Chrome Extension
- Manifest V3, service worker, название FocusVoid
- Помодоро таймер: focus/break/long break, SVG кольцо, Chrome notifications
- Звуки (Web Audio API, `sounds.js`)
- RU/EN локализация (собственная MESSAGES система, переключатель в popup)
- blocked.html: тёмная тема, таймер, счётчик блокировок

### i18n
- `useT()` hook, `LanguageProvider`, хранится в localStorage
- RU/EN строки в `frontend/src/i18n/index.tsx`
- Расширение: собственная MESSAGES система (не chrome.i18n), хранится в `chrome.storage.local` key `extLang`

### Темы
- Dark/Light тема, CSS custom properties, localStorage
- Основные цвета: `#0b0f1a` фон, `#111827` карточки, `#4f7df9` акцент

## Миграции Alembic (в порядке)

| Revision | Описание |
|---|---|
| `6b01925dde22` | init |
| `4e8143de368a` | add users + user_id FK to tasks + plan + trial_ends_at |
| `a3f2b1c9d4e5` | add is_verified + verification_token |
| `b7c4d2e1f8a9` | add is_guest |
| `c9e3f1a2b5d7` | add password_reset_token + password_reset_expires_at |
| `6c60ed2bee3b` | add password_history table |
| `d1e2f3a4b5c6` | add routines (**HEAD**) |

## Следующие шаги 🔜

### Деплой
- **Railway** — нужен домен для LemonSqueezy и Resend
- Зарегистрироваться на **LemonSqueezy**, вписать ключи в `.env`
- После деплоя: `alembic upgrade head` применит все миграции

### Фичи (задуманы, не сделаны)
- Добавить ссылку на `/routines` в sidebar (AppLayout)
- Архив задач (поле `is_active` уже есть в модели Task)
- График фокус-скора на Dashboard (recharts уже в deps)
- Подзадачи в попапе Chrome-расширения
- Дневная цель с прогресс-баром

## Ключевые паттерны

- **UoW паттерн**: `SQLAlchemyUoW` через `UoWProtocol` — все сервисы получают `uow` через DI
- **DI через FastAPI Depends**: `get_auth_service`, `get_task_service` и т.д. в `api/deps.py`
- **Email приоритет**: Яндекс SMTP → Resend → лог
- **Все emails lowercase** при регистрации и поиске (`func.lower`)
- **ConflictError** при старте сессии если уже есть активная → возвращает существующую
