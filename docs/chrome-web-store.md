# Chrome Web Store — ответы для кабинета разработчика

Готовые тексты для вкладок **Privacy practices** и **Store listing**. Поля формы стора на английском — тексты ниже вставлять как есть.
При изменении `extension/manifest.json` или того, какие данные уходят на сервер, — обновить этот файл и `frontend/src/pages/legalContent.ts`, ответы должны совпадать с политикой.

## Privacy policy URL

```
https://focusvoid.com/privacy
```

## Single purpose

```
FocusVoid helps you stay focused on one task: during a focus session you started, it blocks websites outside your whitelist (or the sites on your blacklist) and shows how often you tried to open them.
```

## Permission justification

**declarativeNetRequest**
```
Used to block websites during a focus session the user started: dynamic rules redirect main-frame navigations to sites outside the user's whitelist (or on the user's blacklist) to the extension's own "blocked" page. Rules are removed when the session ends.
```

**storage**
```
Stores the user's sign-in token, the current focus session, the whitelist/blacklist for that session and UI settings (language, sound, pomodoro timer) locally in chrome.storage.local.
```

**notifications**
```
Shows a notification when a pomodoro focus or break interval ends.
```

**Host permissions (http://*/*, https://*/*)**
```
The user decides which sites to block, so blocking must work on any http/https site: declarativeNetRequest redirect rules require host access to the blocked site. The extension does not inject scripts into pages and does not read page content. Host access is also used to call the FocusVoid API (api.focusvoid.com).
```

**Remote code**
```
No, I am not using remote code. All JavaScript is packaged with the extension; it only exchanges JSON with the FocusVoid API.
```

## Data usage

Отметить:

| Категория | Отметить | Почему |
|---|---|---|
| Personally identifiable information | ✅ | email аккаунта (вход в расширении) |
| Health information | ❌ | |
| Financial and payment information | ❌ | оплата идёт на сайте через Lemon Squeezy, не в расширении |
| Authentication information | ✅ | пароль при входе, токен в chrome.storage |
| Personal communications | ❌ | |
| Location | ❌ | |
| Web history | ✅ | URL страниц, заблокированных во время сессии, уходят на сервер |
| User activity | ❌ | клики, нажатия клавиш, скролл не отслеживаются |
| Website content | ❌ | содержимое страниц не читается |

Три подтверждения внизу — отметить все:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Test instructions (для ревьюеров)

Ревьюеру нужен аккаунт: завести на проде отдельный подтверждённый аккаунт с `plan='pro'` и вписать его сюда в кабинете (не в репозиторий):

```
1. Click the extension icon and sign in with the test account below.
2. Pick a task and press "Start session".
3. Open any site that is not in the task's whitelist (e.g. https://www.youtube.com) — you will be redirected to the FocusVoid "blocked" page.
4. Sites in the whitelist (e.g. https://github.com) open normally.
5. Press "Stop" in the popup — blocking is removed and the session stats are shown.
Test account: <email> / <password>
```
