# FocusVoid — Roadmap

Разработка разбита на этапы. Этап закрыт, когда выполнен его критерий «Готово, когда».
Метки исполнителя: **[owner]** — только владелец аккаунтов (покупки, ключи, DNS), **[dev]** — любой разработчик / Claude.

```
Этап 0        Этап 1       Этап 2           Этап 3          Этап 4       Этап 5          Этап 6
Безопасность ─► Домен ────► Регистрация ───► Командная ────► Оплата ────► Chrome Web ───► Фичи
(сейчас)       + почта      для всех         работа + CI     LemonSqueezy  Store           │
                                                                                          ▼
                                                                               Этап 7: уборка (в любой момент)
```

Этапы 2 и 3 можно вести параллельно: 2 — продуктовый, 3 — инфраструктурный.

## Параллельная работа (несколько сессий Claude / разработчиков)

Каждый поток — своя ветка и свой git worktree (отдельная папка), чтобы сессии не мешали друг другу:

```
git worktree add ../fv-verify-screen -b feat/verify-screen     # Этап 2
git worktree add ../fv-tests-ci      -b chore/tests-ci         # Этап 3
git worktree add ../fv-popup-subtasks -b feat/popup-subtasks   # Этап 6
```

| Поток | Этап | Зона файлов | Зависит от |
|---|---|---|---|
| `feat/verify-screen` | 2 | `frontend/src/pages/*`, `i18n` | — |
| `chore/tests-ci` | 3 | `backend/tests/`, `.github/workflows/` | — |
| `feat/popup-subtasks` | 6 | `extension/` | — |
| `feat/legal-pages` | 5 | новые страницы `/privacy`, `/terms` | — |
| `feat/custom-domain` | 1 | `email.py`, `config.py`, URL-ы | купленный домен |
| `feat/billing-ui` | 4 | `ProfilePage.tsx`, `billing` | ключи LemonSqueezy |

Правила:
- Один поток — одна зона файлов. Если двум потокам нужен один файл (например `i18n/index.tsx`), второй ждёт мёрджа первого и делает rebase.
- `ROADMAP.md` и раздел «Статус» в `CLAUDE.md` отмечаются в PR потока, конфликты в них решаются при мёрдже.
- Миграции Alembic — только один поток за раз (иначе две миграции с одним `down_revision`).
- Каждый поток → PR в `main`, мёрдж после зелёного CI.

---

## Этап 0. Безопасность

- [ ] **[owner]** Сменить старый пароль, который был в публичной истории `CLAUDE.md`, везде, где он использовался
- [ ] **[dev]** Force-push очищенной истории `main` (пароль вырезан из всех коммитов через `git filter-branch`)
- [ ] **[dev]** Смёрджить ветку `fix/deploy-and-resend-verification` (Dockerfile фронта, resend по email, docs)
- [ ] **[owner]** Все, у кого есть клон, клонируют заново; `Desktop\FocusVoid` больше не используется

**Готово, когда:** `git log -p -S <старый пароль>` на GitHub пуст, прод после редеплоя отвечает на `/health`.

## Этап 1. Домен и почта

- [x] **[owner]** Купить домен — **focusvoid.com** (Porkbun)
- [x] **[owner]** Railway → Settings → Custom Domain: `focusvoid.com`/`www` → frontend, `api.focusvoid.com` → backend; CNAME в DNS
- [x] **[owner]** Resend → Domains → добавить домен, прописать SPF/DKIM в DNS, дождаться Verified
- [x] **[dev]** `backend/app/services/email.py`: отправитель `FocusVoid <noreply@focusvoid.com>` вместо `onboarding@resend.dev` (вынести в настройку `EMAIL_FROM`)
- [x] **[dev]** Обновить адреса: Railway env `APP_URL`, `CORS_ORIGINS`; `frontend/Dockerfile.prod` `ARG VITE_API_URL`; `extension/api.js` `DEFAULT_URL`
- [x] **[dev]** Обновить раздел «Прод» в `CLAUDE.md`

**Готово, когда:** сайт открывается на своём домене, письмо подтверждения приходит на любой внешний ящик (Gmail, Яндекс, Mail.ru).

## Этап 2. Регистрация и основной сценарий работают для всех

- [ ] **[dev]** Экран «Подтвердите email» для неподтверждённого юзера вместо голых 403: кнопка «Отправить ещё раз» (`POST /auth/resend-verification {email}` уже готов) + «Сменить аккаунт»
- [ ] **[dev]** Ссылка «Не пришло письмо?» на странице логина
- [ ] **[owner]** Задать `ANTHROPIC_API_KEY` на Railway (AI insights)
- [ ] **[dev]** Сквозная проверка на проде: регистрация → письмо → подтверждение → задача → whitelist → сессия в расширении → блокировка → статистика → insights
- [ ] **[dev]** Sentry: проверить, что ошибки с прода доходят

**Готово, когда:** новый человек без помощи проходит весь сценарий выше.

## Этап 3. Командная работа и CI

- [ ] **[owner]** GitHub → Settings → Branches: защитить `main` (только через PR, 1 approve)
- [x] **[dev]** Починить локальное окружение: `pip install -e "backend[dev]"` в `.venv` (сейчас нет `sentry_sdk` и др.)
- [x] **[dev]** Первые тесты в `backend/tests` (pytest + pytest-asyncio уже в `pyproject.toml`): auth (register / verify / resend / reset), sessions (start / stop / ConflictError), whitelist
- [x] **[dev]** GitHub Actions на каждый PR: backend `pytest`, frontend `npm run lint` + `npm run build`
- [ ] **[dev]** Проверять владельца в `POST /sessions/{id}/stop`, `GET /sessions/{id}` и `DELETE /whitelist/{id}` — сейчас любой залогиненный юзер может остановить чужую сессию или удалить чужой домен. Тест `test_cannot_stop_someone_elses_session` помечен `xfail(strict=True)`: после фикса снять пометку
- [ ] **[dev]** Шаблон PR + короткий раздел «Как контрибьютить» в README

**Готово, когда:** PR в `main` нельзя смёрджить с красным CI.

## Этап 4. Оплата (LemonSqueezy)

- [ ] **[owner]** Аккаунт LemonSqueezy, магазин на своём домене, продукт «FocusVoid Pro» (вариант = тариф)
- [ ] **[owner]** На Railway: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`
- [ ] **[owner]** LemonSqueezy → Webhooks: `https://api.focusvoid.app/api/v1/billing/webhook`
- [ ] **[dev]** Кнопка «Перейти на Pro» на `/profile` и при `402 PaymentRequired` после триала
- [ ] **[dev]** Тестовая покупка в test mode → `plan=pro` в БД; тест на проверку подписи вебхука

**Готово, когда:** тестовая оплата переводит юзера в Pro без ручных действий.

## Этап 5. Публикация расширения в Chrome Web Store

- [x] **[dev]** Страницы `/privacy` и `/terms` на фронтенде
- [ ] **[dev]** Сузить `host_permissions` в `manifest.json`, если `<all_urls>` не нужен целиком (стор строже проверяет широкие права), описать обоснование прав
- [ ] **[dev]** Сборка zip расширения (скрипт или GitHub Action)
- [ ] **[owner]** Аккаунт разработчика Chrome Web Store ($5), иконки, скриншоты, описание RU/EN, отправка на ревью

**Готово, когда:** расширение ставится из стора и логинится в прод.

## Этап 6. Фичи

- [ ] **[dev]** Подзадачи в попапе расширения (`extension/popup/popup.js`, `extension/api.js`; API `subtasks` уже есть)
- [x] **[dev]** Чёрный список: `tasks.block_mode` (whitelist/blacklist), переключатель на `/tasks`, расширение блокирует только домены из списка. Доступно всем, без Pro
- [ ] **[dev]** Дневная цель с прогресс-баром (поле в User, миграция, виджет на `/tasks` и в попапе)
- [x] **[dev]** «Что отвлекает»: топ сайтов, час пика и типичная минута срыва — `GET /stats/distractions`, карточка на `/dashboard`, блок в недельном письме, факты в AI-инсайтах задачи
- [ ] Идеи на потом: экспорт статистики, расписание блокировок, мобильная версия

## Этап 7. Уборка (в любой момент)

- [ ] **[owner]** Railway: проверить и удалить 2 отключённых тома Postgres (98 и 85 MB)
- [ ] **[owner]** Удалить устаревшую копию `Desktop\FocusVoid`
- [ ] **[dev]** `backend/graphify-out/`, `graphify-out/<дата>/` — добавить в `.gitignore` или закоммитить осознанно
