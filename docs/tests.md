# Unit-тесты

Этот документ описывает, какие части проекта покрыты unit‑тестами, и как эти тесты запускать.

## Что покрыто тестами

### Backend (`backend/`)

- **Контроллеры API**: обработка успешных сценариев и типовых ошибок (например, `404` при отсутствии сущности, проброс ошибок в `next()` при сбоях БД), а также фильтры/параметры запросов там, где они есть.
- **Сервисы**:
  - `AuthService`: регистрация/логин/refresh‑token, генерация JWT, обработка невалидных данных и ошибок внешних зависимостей.
  - `AIService`: генерация шоу, обработка разных форматов/качеств ответа (включая невалидные/частичные ответы) и fallback‑поведение без реальных сетевых вызовов.
- **Middlewares**: аутентификация/авторизация, аудит‑логирование, обработчики ошибок.
- **Утилиты**: мелкая вспомогательная логика (например, конфигурация логирования в зависимости от окружения).

Тесты сфокусированы на модульных сценариях: внешние зависимости (ORM/модели, JWT, bcrypt, сетевые вызовы, логгер) замоканы, поднятие сервера и реальной базы данных не требуется.

### Frontend (`frontend/`)

- **API слой** (`src/services/api.js`): базовая конфигурация клиента, request/response interceptors, обработка ошибок, логика работы с токенами.
- **WebSocket слой** (`src/services/websocket.js`): подключение/переподключение, подписки на события, обработка сообщений, отправка данных.
- **Redux Toolkit slices** (`src/store/slices/*.js`): reducers и async‑thunks для доменных сущностей (alerts/auth/choreography/clients/drones/flightPaths/projects/shows/telemetry), включая обработку ошибок и переходы loading/error‑состояний.

Для unit‑изоляции используются моки (`localStorage`, `window.location`, `axios`/API, `WebSocket`) — тесты не требуют запуска браузера или backend.

## Как запустить тесты

### Весь проект (backend + frontend)

Из корня репозитория:

```bash
npm test
```

### Только backend

Из корня:

```bash
npm run test:backend
```

Либо из папки `backend/`:

```bash
cd backend
npm test
```

Watch‑режим:

```bash
cd backend
npm run test:watch
```

### Только frontend

Из корня:

```bash
npm run test:frontend
```

Либо из папки `frontend/`:

```bash
cd frontend
npm test
```

Watch‑режим:

```bash
cd frontend
npm run test:watch
```

## Установка зависимостей (если нужно)

Из корня:

```bash
npm run install-all
```

или по отдельности:

```bash
cd backend && npm install
cd ../frontend && npm install
```

