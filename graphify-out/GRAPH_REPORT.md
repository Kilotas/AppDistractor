# Graph Report - .  (2026-08-31)

## Corpus Check
- Corpus is ~26,654 words - fits in a single context window. You may not need a graph.

## Summary
- 792 nodes · 1405 edges · 52 communities (48 shown, 4 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 196 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend API Client
- Task & Subtask API
- Sessions & Events API
- Domain Schemas & Repositories
- Auth & Password API
- Extension Popup UI
- Routines API
- Frontend React App Config
- Stats & Streak API
- Extension Manifest
- Frontend TypeScript Config
- Domain Models & Base Repository
- Frontend Node Config
- Extension Blocked Page
- Extension API Client
- Session Repository
- Backend API Dependencies
- Brand & Public Assets
- App Entry & Router
- Session Model & Repository
- Password History & Events
- Subtask Model & Repository
- Payment Provider
- Database Base Models
- User Model & Repository
- Whitelist Model & Repository
- Docker Compose Config
- Frontend Linting Config
- App Exceptions
- Alembic Environment
- Billing API
- Extension Icons
- Database Core
- Auth Dependencies
- App Settings Config
- Extension Blocked Logic
- SQLAlchemy Unit of Work
- Frontend TypeScript Root Config
- OxLint Documentation
- Backend Package

## God Nodes (most connected - your core abstractions)
1. `NotFoundError` - 31 edges
2. `UoWProtocol` - 29 edges
3. `AuthService` - 26 edges
4. `useT()` - 26 edges
5. `StatsService` - 24 edges
6. `TaskService` - 21 edges
7. `SQLAlchemyUoW` - 19 edges
8. `compilerOptions` - 18 edges
9. `RoutineService` - 17 edges
10. `SessionService` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Hero Design — Isometric Stacked Panels with Purple Accent` --semantically_similar_to--> `Spiral Vortex Purple-Black Logo Style`  [INFERRED] [semantically similar]
  frontend/src/assets/hero.png → extension/icons/icon128.png
- `LiveTimer()` --indirect_call--> `tick()`  [INFERRED]
  frontend/src/components/LiveTimer.tsx → extension/blocked/blocked.js
- `Docker Frontend Service` --references--> `Frontend Root Mount Point (#root)`  [INFERRED]
  docker-compose.yml → frontend/index.html
- `Hero Image — Isometric Layered Blocks` --conceptually_related_to--> `Focus App Brand Identity — Purple Spiral Vortex`  [INFERRED]
  frontend/src/assets/hero.png → extension/icons/icon128.png
- `get_current_user()` --calls--> `decode_access_token()`  [INFERRED]
  backend/app/api/deps.py → backend/app/services/auth.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three-Tier Docker Compose Architecture (db → backend → frontend)** — docker_compose_yml_db_service, docker_compose_yml_backend_service, docker_compose_yml_frontend_service [EXTRACTED 1.00]
- **Popup Screen State Machine (auth → idle → active → result)** — extension_popup_popup_screen_auth, extension_popup_popup_screen_idle, extension_popup_popup_screen_active, extension_popup_popup_screen_result [INFERRED 0.95]
- **Session Blocking Feedback Loop (active session, blocked page, blocked count)** — extension_popup_popup_screen_active, extension_blocked_blocked_blockedpage, extension_blocked_blocked_blocked_count [INFERRED 0.85]
- **Session Timer UI Cluster (session timer, ring timer, blocked page timer)** — extension_blocked_blocked_session_timer, extension_popup_popup_ring_timer, extension_blocked_blocked_blockedpage [INFERRED 0.75]

## Communities (52 total, 4 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.06
Nodes (66): api, ApiError, clearToken(), DailyActivity, DailyStats, FocusScorePoint, getToken(), isGuest() (+58 more)

### Community 1 - "Task & Subtask API"
Cohesion: 0.05
Nodes (44): create_subtask(), delete_subtask(), list_subtasks(), User, update_subtask(), create_task(), delete_task(), get_task() (+36 more)

### Community 2 - "Sessions & Events API"
Cohesion: 0.07
Nodes (26): log_blocked_event(), User, get_active_sessions(), get_session(), get_session_stats(), list_events_for_session(), list_sessions_for_task(), User (+18 more)

### Community 3 - "Domain Schemas & Repositories"
Cohesion: 0.06
Nodes (17): BaseModel, TaskInsights, BaseRepositoryProtocol, BlockedEventRepositoryProtocol, Protocol, Session, T, Task (+9 more)

### Community 4 - "Auth & Password API"
Cohesion: 0.11
Nodes (28): change_password(), forgot_password(), guest_login(), login(), me(), Request, User, register() (+20 more)

### Community 5 - "Extension Popup UI"
Cohesion: 0.13
Nodes (34): applyI18n(), els, formatDuration(), handlePhaseEnd(), hideError(), i18n(), init(), loadPomoSettings() (+26 more)

### Community 6 - "Routines API"
Cohesion: 0.10
Nodes (24): get_routine_service(), get_routines(), RoutineType, User, update_routine(), BaseModel, RoutineResponse, RoutineUpdate (+16 more)

### Community 7 - "Frontend React App Config"
Cohesion: 0.06
Nodes (33): dependencies, react, react-dom, react-router-dom, recharts, devDependencies, oxlint, @types/node (+25 more)

### Community 8 - "Stats & Streak API"
Cohesion: 0.14
Nodes (21): get_daily(), get_focus_score_history(), get_stats_service(), get_streak(), get_tasks_stats(), DailyStats, StreakStats, User (+13 more)

### Community 9 - "Extension Manifest"
Cohesion: 0.07
Nodes (28): action, default_icon, default_popup, default_title, background, service_worker, type, declarative_net_request (+20 more)

### Community 11 - "Frontend TypeScript Config"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 12 - "Domain Models & Base Repository"
Cohesion: 0.13
Nodes (10): str, Routine, RoutineType, BaseRepository, AsyncSession, T, AsyncSession, Routine (+2 more)

### Community 13 - "Frontend Node Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 14 - "Extension Blocked Page"
Cohesion: 0.12
Nodes (19): Blocked Count Display (Blocked Page), Blocked URL Display Element, Blocked Page (FocusVoid), blocked.js Script, Session Timer Display, Blocked Count Display (Active Screen), popup.css Stylesheet, Focus Score Result Display (+11 more)

### Community 15 - "Extension API Client"
Cohesion: 0.28
Nodes (15): getSession(), getTasks(), getToken(), getWhitelist(), logBlockedEvent(), login(), register(), request() (+7 more)

### Community 16 - "Session Repository"
Cohesion: 0.23
Nodes (7): Task, date, Возвращает список уникальных дат (UTC), когда у пользователя была хотя бы одна з, Возвращает (date, focus_minutes, sessions_count) за каждый день начиная с since., AsyncSession, Task, TaskRepository

### Community 17 - "Backend API Dependencies"
Cohesion: 0.26
Nodes (9): get_auth_service(), get_blocked_event_service(), get_insight_service(), get_session_service(), get_subtask_service(), get_task_service(), get_uow(), get_whitelist_service() (+1 more)

### Community 18 - "Brand & Public Assets"
Cohesion: 0.22
Nodes (13): Focus App Brand Identity — Lightning Bolt, React Framework Brand, Vite Build Tool Brand, Focus App Favicon (SVG), UI Icon Sprite Sheet (SVG), React Logo (SVG Asset), Vite Logo (SVG Asset), Bluesky Social Icon (+5 more)

### Community 19 - "App Entry & Router"
Cohesion: 0.24
Nodes (9): app_error_handler(), lifespan(), log_requests(), Request, _run_routines(), validation_error_handler(), FastAPI, JSONResponse (+1 more)

### Community 20 - "Session Model & Repository"
Cohesion: 0.24
Nodes (6): Session, AsyncSession, Session, Возвращает (task_title, focus_score, ended_at) последних N сессий с известным ск, Возвращает (task_title, total_minutes, sessions_count) топ задач по времени фоку, SessionRepository

### Community 21 - "Password History & Events"
Cohesion: 0.24
Nodes (4): PasswordHistory, BlockedEventRepository, PasswordHistoryRepository, AsyncSession

### Community 22 - "Subtask Model & Repository"
Cohesion: 0.29
Nodes (4): Subtask, AsyncSession, Subtask, SubtaskRepository

### Community 23 - "Payment Provider"
Cohesion: 0.20
Nodes (6): PaymentProvider, Protocol, Абстракция платёжного провайдера.  Чтобы поменять LemonSqueezy на Stripe/Paddle, Создаёт страницу оплаты. Возвращает URL для редиректа., Проверяет что webhook пришёл от провайдера, а не от кого попало., Разбирает тело webhook.         Возвращает user_id если это успешная оплата, ина

### Community 24 - "Database Base Models"
Cohesion: 0.25
Nodes (7): Base, Базовый класс для всех ORM-моделей., Добавляет created_at / updated_at ко всем наследникам., TimestampMixin, str, SessionStatus, DeclarativeBase

### Community 25 - "User Model & Repository"
Cohesion: 0.39
Nodes (4): User, AsyncSession, User, UserRepository

### Community 26 - "Whitelist Model & Repository"
Cohesion: 0.28
Nodes (4): WhitelistEntry, AsyncSession, WhitelistEntry, WhitelistRepository

### Community 27 - "Docker Compose Config"
Cohesion: 0.22
Nodes (9): Docker Backend Service, CORS Origins (localhost + chrome-extension), Docker db-data Volume, Docker DB Service (PostgreSQL 16), Docker Frontend Service, JWT Secret Configuration, Frontend Root Mount Point (#root), Vite + React + TypeScript Template (+1 more)

### Community 28 - "Frontend Linting Config"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 29 - "App Exceptions"
Cohesion: 0.29
Nodes (3): AppError, LemonSqueezyProvider, Exception

### Community 30 - "Alembic Environment"
Cohesion: 0.33
Nodes (6): do_run_migrations(), Alembic environment — async SQLAlchemy + читает DATABASE_URL из Settings.  В Doc, Offline mode: генерирует SQL без подключения к БД., Online mode: подключается к БД и применяет миграции., run_migrations_offline(), run_migrations_online()

### Community 31 - "Billing API"
Cohesion: 0.33
Nodes (6): create_checkout(), payment_webhook(), Request, User, get_payment_provider(), Возвращает провайдер по значению PAYMENT_PROVIDER из .env.     Чтобы добавить St

### Community 32 - "Extension Icons"
Cohesion: 0.48
Nodes (7): Focus App Brand Identity — Purple Spiral Vortex, Extension Icon 128px, Spiral Vortex Purple-Black Logo Style, Extension Icon 16px, Extension Icon 48px, Hero Design — Isometric Stacked Panels with Purple Accent, Hero Image — Isometric Layered Blocks

### Community 33 - "Database Core"
Cohesion: 0.33
Nodes (5): create_all_tables(), get_db_session(), AsyncSession, Dependency для FastAPI — открывает сессию и закрывает после запроса., Создаёт все таблицы при старте (dev). В prod используй Alembic.

### Community 34 - "Auth Dependencies"
Cohesion: 0.40
Nodes (5): get_current_user(), get_verified_user(), User, ForbiddenError, HTTPAuthorizationCredentials

### Community 35 - "App Settings Config"
Cohesion: 0.50
Nodes (3): get_settings(), Settings, BaseSettings

### Community 36 - "Extension Blocked Logic"
Cohesion: 0.50
Nodes (3): blockedUrl, params, tick()

## Knowledge Gaps
- **122 isolated node(s):** `focus-app-backend`, `params`, `blockedUrl`, `manifest_version`, `name` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UoWProtocol` connect `Domain Schemas & Repositories` to `Task & Subtask API`, `Sessions & Events API`, `Auth & Password API`, `Routines API`, `Stats & Streak API`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `SQLAlchemyUoW` connect `Backend API Dependencies` to `Auth Dependencies`, `SQLAlchemy Unit of Work`, `Routines API`, `Stats & Streak API`, `Alembic Migrations`, `App Entry & Router`, `Password History & Events`, `Billing API`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `NotFoundError` connect `Task & Subtask API` to `Sessions & Events API`, `Domain Schemas & Repositories`, `Auth & Password API`, `App Exceptions`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `NotFoundError` (e.g. with `AuthService` and `.change_password()`) actually correct?**
  _`NotFoundError` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `UoWProtocol` (e.g. with `AuthService` and `BlockedEventService`) actually correct?**
  _`UoWProtocol` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `AuthService` (e.g. with `User` and `AuthError`) actually correct?**
  _`AuthService` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `StatsService` (e.g. with `._send_end_of_day()` and `._send_morning_brief()`) actually correct?**
  _`StatsService` has 11 INFERRED edges - model-reasoned connections that need verification._