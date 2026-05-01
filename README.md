# Drone Light Show Management System

Полнофункциональная информационная система для управления световыми шоу дронов. Система включает управление проектами, шоу, дронами, телеметрией, хореографией и клиентами.

## 🚀 Технологии

### Backend
- **Node.js** + **Express.js** - REST API сервер
- **PostgreSQL** - реляционная база данных
- **Sequelize** - ORM для работы с БД
- **JWT** - аутентификация и авторизация
- **WebSocket (ws)** - реальное время для телеметрии
- **Winston** - логирование
- **Swagger** - документация API

### Frontend
- **React 18** - UI библиотека
- **Redux Toolkit** - управление состоянием
- **Material-UI (MUI)** - компоненты интерфейса
- **React Router** - маршрутизация
- **Three.js** + **React Three Fiber** - 3D визуализация дронов
- **Vite** - сборщик и dev-сервер
- **Axios** - HTTP клиент

### DevOps
- **Docker** + **Docker Compose** - контейнеризация
- **Makefile** - автоматизация команд

## 📋 Требования

- Node.js >= 18.x
- PostgreSQL >= 15
- Docker и Docker Compose (опционально, для быстрого старта)
- npm или yarn

## 🛠️ Установка и настройка

### Вариант 1: Запуск через Docker (рекомендуется)

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd drone
```

2. **Запустите все сервисы:**
```bash
docker-compose up -d
```

Это автоматически:
- Создаст и запустит PostgreSQL контейнер
- Инициализирует базу данных из `database/ddl.sql`
- Запустит backend на порту 3001
- Запустит frontend на порту 3000

3. **Загрузите демо-данные:**
```bash
docker-compose exec backend npm run seed:demo
```

### Вариант 2: Локальная установка

#### 1. Установите зависимости

```bash
# Установка всех зависимостей
npm run install-all

# Или отдельно:
cd backend && npm install
cd ../frontend && npm install
```

#### 2. Настройте базу данных PostgreSQL

Создайте базу данных:
```sql
CREATE DATABASE drone_light_show;
```

Или используйте скрипт:
```bash
# Linux/Mac
./scripts/init-db.sh

# Windows
.\scripts\init-db.ps1
```

#### 3. Настройте переменные окружения

**Backend** - создайте файл `backend/.env`:
```env
NODE_ENV=development
PORT=3001
WS_PORT=3002

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drone_light_show
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Frontend** - создайте файл `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

#### 4. Инициализируйте базу данных

```bash
# Применить схему БД
cd backend
npm run migrate

# Или вручную выполните SQL скрипт:
psql -U postgres -d drone_light_show -f ../database/ddl.sql
```

#### 5. Загрузите начальные данные

```bash
# Базовые роли (из database/seed.sql)
cd backend
npm run seed

# Демо-данные (пользователи, проекты, дроны и т.д.)
npm run seed:demo
```

## 🚀 Запуск проекта

### Разработка

```bash
# Запуск всех сервисов через Docker
docker-compose up

# Или локально:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### Production

```bash
# Build frontend
cd frontend && npm run build

# Start backend
cd backend && npm start
```

## ✅ Unit-тестирование

Тесты запускаются встроенным раннером Node.js (`node --test`) и не требуют поднятия БД/серверов.

```bash
# Все тесты (backend + frontend)
npm test

# Только backend
npm run test:backend

# Только frontend
npm run test:frontend

# Watch режим
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

## 📊 Дефолтные данные (Seeds)

### Базовые роли (`database/seed.sql`)

Система создает следующие роли:
- **admin** - полный доступ ко всем функциям
- **manager** - управление проектами, шоу, дронами, пользователями
- **operator** - управление шоу, дронами, телеметрией
- **pilot** - управление дронами, телеметрией, полетами
- **designer** - управление проектами, шоу, хореографией

### Демо-данные (`backend/src/scripts/seedDemoData.js`)

Скрипт `seed:demo` создает:

#### Пользователи (все с паролем `password123`):
- `admin` - администратор
- `manager` - менеджер
- `operator` - оператор
- `pilot` - пилот
- `designer` - дизайнер

#### Клиенты:
- TechCorp Events
- City Festival Committee
- Music Festival Inc

#### Оборудование:
- 20 аккумуляторов (BAT-0001 до BAT-0020)
- 15 дронов (DRONE-0001 до DRONE-0015)
- LED модули для каждого дрона

#### Проекты и шоу:
- 3 проекта с различными статусами
- 3 шоу с хореографией
- 10 полетов с телеметрией

### Загрузка данных

```bash
# Только базовые роли
cd backend && npm run seed

# Полные демо-данные
cd backend && npm run seed:demo

# Откат сидов
cd backend && npm run seed:undo
```

## 📁 Структура проекта

```
drone/
├── backend/              # Backend приложение
│   ├── src/
│   │   ├── config/      # Конфигурация
│   │   ├── controllers/ # Контроллеры API
│   │   ├── middlewares/ # Middleware
│   │   ├── models/      # Sequelize модели
│   │   ├── routes/      # API маршруты
│   │   ├── scripts/     # Скрипты (seed и т.д.)
│   │   ├── services/    # Бизнес-логика
│   │   ├── utils/       # Утилиты
│   │   ├── websocket/   # WebSocket сервер
│   │   └── server.js    # Точка входа
│   ├── Dockerfile
│   └── package.json
├── frontend/            # Frontend приложение
│   ├── src/
│   │   ├── components/ # React компоненты
│   │   ├── pages/      # Страницы
│   │   ├── services/   # API сервисы
│   │   ├── store/      # Redux store
│   │   └── theme.js    # MUI тема
│   ├── Dockerfile
│   └── package.json
├── database/            # SQL скрипты
│   ├── ddl.sql         # Схема БД
│   └── seed.sql        # Базовые сиды
├── docker-compose.yml   # Docker конфигурация
├── Makefile            # Команды автоматизации
└── README.md
```

## 🔧 Полезные команды

```bash
# Docker
make docker-up          # Запустить контейнеры
make docker-down        # Остановить контейнеры
make docker-restart     # Перезапустить
make docker-logs        # Показать логи

# База данных
make migrate            # Применить миграции
make seed               # Загрузить базовые сиды
make db-reset           # Сбросить и пересоздать БД

# Разработка
make install            # Установить зависимости
make dev                # Запустить dev серверы
make build              # Собрать production
```

## 🌐 API Endpoints

После запуска backend, документация Swagger доступна по адресу:
- **http://localhost:3001/api-docs**

Основные эндпоинты:
- `/api/auth/*` - аутентификация
- `/api/users/*` - управление пользователями
- `/api/projects/*` - проекты
- `/api/shows/*` - шоу
- `/api/drones/*` - дроны
- `/api/telemetry/*` - телеметрия
- `/api/choreographies/*` - хореография

## 🔐 Безопасность

- JWT токены для аутентификации
- Хеширование паролей (bcrypt)
- Rate limiting на API
- Валидация входных данных
- CORS настройки

**⚠️ ВАЖНО:** В production обязательно измените:
- `JWT_SECRET` и `JWT_REFRESH_SECRET`
- Пароли БД
- CORS настройки

## 📝 Логирование

Логи сохраняются в:
- `backend/logs/combined.log` - все логи
- `backend/logs/error.log` - только ошибки

## 🐛 Troubleshooting

### Проблемы с подключением к БД
```bash
# Проверьте, что PostgreSQL запущен
docker-compose ps

# Проверьте логи
docker-compose logs postgres
docker-compose logs backend
```

### Проблемы с портами
Убедитесь, что порты 3000, 3001, 3002, 5432 свободны.

### Сброс БД
```bash
make db-reset
```

## 📄 Лицензия

ISC

## 👥 Авторы

Drone Light Show Management Team

# drone-show
