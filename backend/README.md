# Backend - Drone Light Show Management System

Backend API сервер для системы управления световыми шоу дронов.

## 🚀 Технологии

- **Node.js** 18+
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **Sequelize** - ORM
- **JWT** - аутентификация
- **WebSocket (ws)** - реальное время
- **Winston** - логирование
- **Swagger** - документация API

## 📋 Требования

- Node.js >= 18.x
- PostgreSQL >= 15
- npm или yarn

## 🛠️ Установка

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте переменные окружения

Создайте файл `.env` в корне `backend/`:

```env
NODE_ENV=development
PORT=3001
WS_PORT=3002

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drone_light_show
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Настройте базу данных

#### Вариант A: Через Docker

```bash
# Запустите PostgreSQL контейнер
docker-compose up -d postgres

# Подождите пока БД инициализируется
sleep 5
```

#### Вариант B: Локальный PostgreSQL

```sql
-- Создайте базу данных
CREATE DATABASE drone_light_show;

-- Создайте пользователя (опционально)
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE drone_light_show TO postgres;
```

### 4. Инициализируйте схему БД

```bash
# Применить схему из SQL файла
psql -U postgres -d drone_light_show -f ../database/ddl.sql

# Или через Sequelize миграции (если настроены)
npm run migrate
```

### 5. Загрузите начальные данные

```bash
# Базовые роли
npm run seed

# Демо-данные (пользователи, проекты, дроны)
npm run seed:demo
```

## 🚀 Запуск

### Development режим

```bash
npm run dev
```

Сервер запустится на `http://localhost:3001`

### Production режим

```bash
npm start
```

## 📊 Сиды (Seeds)

### Базовые роли (`database/seed.sql`)

Выполняется через `npm run seed`:

```sql
-- Создает роли:
- admin (полный доступ)
- manager (управление)
- operator (операции)
- pilot (полеты)
- designer (дизайн)
```

### Демо-данные (`src/scripts/seedDemoData.js`)

Выполняется через `npm run seed:demo`:

#### Создаваемые данные:

1. **Роли** (если не существуют):
   - admin, manager, operator, pilot, designer

2. **Пользователи** (пароль: `password123`):
   - `admin` - администратор
   - `manager` - менеджер
   - `operator` - оператор
   - `pilot` - пилот
   - `designer` - дизайнер

3. **Клиенты** (3 компании):
   - TechCorp Events
   - City Festival Committee
   - Music Festival Inc

4. **Оборудование**:
   - 20 аккумуляторов (BAT-0001 до BAT-0020)
   - 15 дронов (DRONE-0001 до DRONE-0015)
   - LED модули для каждого дрона

5. **Проекты** (3 проекта):
   - Summer Music Festival 2024
   - Corporate Product Launch
   - City Anniversary Celebration

6. **Шоу** (3 шоу):
   - Opening Night Spectacular
   - Product Reveal Show
   - Anniversary Grand Finale

7. **Хореография** (2 хореографии)

8. **Полеты** (10 полетов с телеметрией)

### Команды для работы с сидами

```bash
# Загрузить базовые роли
npm run seed

# Загрузить все демо-данные
npm run seed:demo

# Откатить базовые сиды
npm run seed:undo

# Откатить все сиды
npm run seed:undo:all
```

### Создание собственных сидов

1. Создайте файл в `src/scripts/yourSeed.js`:

```javascript
const { Model } = require('../models');
const sequelize = require('../utils/db');
const logger = require('../utils/logger');

async function seedYourData() {
  try {
    // Ваш код для создания данных
    await Model.create({ /* ... */ });
    logger.info('Data seeded successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  sequelize.authenticate()
    .then(() => seedYourData())
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Error:', error);
      process.exit(1);
    });
}

module.exports = seedYourData;
```

2. Добавьте скрипт в `package.json`:

```json
{
  "scripts": {
    "seed:your": "node src/scripts/yourSeed.js"
  }
}
```

3. Запустите:

```bash
npm run seed:your
```

## 📁 Структура проекта

```
backend/
├── src/
│   ├── config/
│   │   └── config.js          # Конфигурация приложения
│   ├── controllers/           # Контроллеры API
│   │   ├── authController.js
│   │   ├── droneController.js
│   │   ├── projectController.js
│   │   └── ...
│   ├── middlewares/
│   │   ├── auth.js            # JWT аутентификация
│   │   ├── errorHandler.js    # Обработка ошибок
│   │   └── validationErrorHandler.js
│   ├── models/                # Sequelize модели
│   │   ├── User.js
│   │   ├── Drone.js
│   │   ├── Project.js
│   │   └── ...
│   ├── routes/                # API маршруты
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   └── ...
│   ├── scripts/               # Скрипты
│   │   └── seedDemoData.js    # Демо-данные
│   ├── services/              # Бизнес-логика
│   │   ├── authService.js
│   │   └── aiService.js
│   ├── utils/
│   │   ├── db.js              # Sequelize подключение
│   │   ├── logger.js          # Winston логгер
│   │   └── createDatabase.js  # Создание БД
│   ├── websocket/             # WebSocket сервер
│   │   ├── index.js
│   │   └── telemetryServer.js
│   └── server.js              # Точка входа
├── logs/                      # Логи
│   ├── combined.log
│   └── error.log
├── Dockerfile
├── package.json
└── .env                       # Переменные окружения (создать)
```

## 🔌 API Endpoints

### Документация

Swagger UI доступен по адресу: **http://localhost:3001/api-docs**

### Основные эндпоинты:

#### Аутентификация
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `POST /api/auth/refresh` - обновление токена
- `POST /api/auth/logout` - выход

#### Пользователи
- `GET /api/users` - список пользователей
- `GET /api/users/:id` - пользователь по ID
- `PUT /api/users/:id` - обновить пользователя
- `DELETE /api/users/:id` - удалить пользователя

#### Проекты
- `GET /api/projects` - список проектов
- `POST /api/projects` - создать проект
- `GET /api/projects/:id` - проект по ID
- `PUT /api/projects/:id` - обновить проект
- `DELETE /api/projects/:id` - удалить проект

#### Шоу
- `GET /api/shows` - список шоу
- `POST /api/shows` - создать шоу
- `GET /api/shows/:id` - шоу по ID
- `PUT /api/shows/:id` - обновить шоу
- `DELETE /api/shows/:id` - удалить шоу

#### Дроны
- `GET /api/drones` - список дронов
- `POST /api/drones` - создать дрон
- `GET /api/drones/:id` - дрон по ID
- `PUT /api/drones/:id` - обновить дрон
- `DELETE /api/drones/:id` - удалить дрон

#### Телеметрия
- `GET /api/telemetry` - получить телеметрию
- `POST /api/telemetry` - отправить телеметрию
- `GET /api/telemetry/drone/:id` - телеметрия дрона

#### WebSocket
- `ws://localhost:3002` - WebSocket для телеметрии в реальном времени

## 🔐 Аутентификация

API использует JWT токены. После логина:

1. Получите `accessToken` и `refreshToken`
2. Добавьте в заголовки: `Authorization: Bearer <accessToken>`
3. При истечении токена используйте `refreshToken` для получения нового

## 📝 Логирование

Логи сохраняются в `logs/`:
- `combined.log` - все логи
- `error.log` - только ошибки

Уровни логирования:
- `error` - ошибки
- `warn` - предупреждения
- `info` - информация
- `debug` - отладка

## 🧪 Тестирование

```bash
# Запустить тесты (если настроены)
npm test
```

## 🐛 Troubleshooting

### Ошибка подключения к БД

```bash
# Проверьте, что PostgreSQL запущен
psql -U postgres -c "SELECT version();"

# Проверьте переменные окружения
cat .env

# Проверьте подключение
node -e "require('./src/utils/db').authenticate().then(() => console.log('OK')).catch(console.error)"
```

### Порт уже занят

Измените `PORT` в `.env` или остановите процесс на порту 3001:

```bash
# Найти процесс
lsof -i :3001

# Убить процесс
kill -9 <PID>
```

### Проблемы с миграциями

```bash
# Откатить последнюю миграцию
npm run migrate:undo

# Применить все миграции заново
npm run migrate
```

## 📦 Production Deployment

1. Установите переменные окружения для production
2. Соберите проект: `npm install --production`
3. Используйте PM2 или systemd для запуска
4. Настройте reverse proxy (nginx)
5. Включите HTTPS
6. Настройте мониторинг и логирование

## 📄 Лицензия

ISC

