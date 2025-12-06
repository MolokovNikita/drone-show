# Frontend - Drone Light Show Management System

React приложение для управления световыми шоу дронов.

## 🚀 Технологии

- **React 18** - UI библиотека
- **Redux Toolkit** - управление состоянием
- **Material-UI (MUI)** - компоненты интерфейса
- **React Router** - маршрутизация
- **Three.js** + **React Three Fiber** - 3D визуализация
- **Vite** - сборщик и dev-сервер
- **Axios** - HTTP клиент
- **Recharts** - графики и диаграммы

## 📋 Требования

- Node.js >= 18.x
- npm или yarn

## 🛠️ Установка

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте переменные окружения

Создайте файл `.env` в корне `frontend/`:

```env
VITE_API_URL=http://localhost:3001/api
```

Для production:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## 🚀 Запуск

### Development режим

```bash
npm run dev
# или
npm start
```

Приложение откроется на `http://localhost:3000`

### Production build

```bash
# Собрать для production
npm run build

# Предпросмотр production build
npm run preview
```

Собранные файлы будут в `dist/`

## 📁 Структура проекта

```
frontend/
├── src/
│   ├── components/          # Переиспользуемые компоненты
│   │   ├── AIChat.jsx       # AI чат для генерации шоу
│   │   ├── DroneVisualization3D.jsx  # 3D визуализация
│   │   └── WebSocketStatus.jsx
│   ├── pages/               # Страницы приложения
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DronesPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── ShowsPage.jsx
│   │   ├── ChoreographyEditorPage.jsx
│   │   ├── TelemetryPage.jsx
│   │   └── AlertsPage.jsx
│   ├── layout/
│   │   └── Layout.jsx       # Основной layout
│   ├── services/            # API сервисы
│   │   ├── api.js           # Axios конфигурация
│   │   └── websocket.js      # WebSocket клиент
│   ├── store/               # Redux store
│   │   ├── index.js         # Store конфигурация
│   │   └── slices/          # Redux slices
│   │       ├── authSlice.js
│   │       ├── droneSlice.js
│   │       ├── projectSlice.js
│   │       └── ...
│   ├── theme.js             # MUI тема
│   ├── App.jsx              # Главный компонент
│   ├── main.jsx             # Точка входа
│   └── index.js             # Рендер приложения
├── public/                  # Статические файлы
├── Dockerfile
├── vite.config.js          # Vite конфигурация
└── package.json
```

## 🎨 Основные страницы

### Dashboard (`/`)
Главная страница с обзором системы:
- Статистика проектов и шоу
- Активные дроны
- Последние события
- Графики

### Проекты (`/projects`)
Управление проектами:
- Список проектов
- Создание/редактирование
- Фильтрация и поиск
- Статусы проектов

### Шоу (`/shows`)
Управление шоу:
- Список шоу
- Создание через AI генератор
- Планирование
- Управление статусами

### Дроны (`/drones`)
Управление дронами:
- Список дронов
- Статусы и состояние
- Батареи
- История полетов

### Хореография (`/choreography`)
Редактор хореографии:
- Визуальный редактор
- 3D предпросмотр
- Создание последовательностей
- Привязка к шоу

### Телеметрия (`/telemetry`)
Мониторинг в реальном времени:
- Данные с дронов
- Графики параметров
- WebSocket подключение
- История телеметрии

### Алерты (`/alerts`)
Уведомления и предупреждения:
- Системные алерты
- Предупреждения безопасности
- Уведомления о статусах

## 🔌 API Интеграция

### Конфигурация

API клиент настроен в `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Использование

```javascript
import api from './services/api';

// GET запрос
const projects = await api.get('/projects');

// POST запрос
const newProject = await api.post('/projects', data);

// PUT запрос
await api.put(`/projects/${id}`, data);

// DELETE запрос
await api.delete(`/projects/${id}`);
```

## 🔄 Redux Store

### Структура

```javascript
{
  auth: {
    user: null,
    token: null,
    isAuthenticated: false
  },
  drones: {
    items: [],
    loading: false,
    error: null
  },
  projects: { /* ... */ },
  shows: { /* ... */ },
  // ...
}
```

### Использование

```javascript
import { useDispatch, useSelector } from 'react-redux';
import { fetchDrones } from './store/slices/droneSlice';

function Component() {
  const dispatch = useDispatch();
  const { drones, loading } = useSelector((state) => state.drones);

  useEffect(() => {
    dispatch(fetchDrones());
  }, [dispatch]);

  return <div>{/* ... */}</div>;
}
```

## 🌐 WebSocket

WebSocket клиент для телеметрии в реальном времени:

```javascript
import { connectWebSocket, disconnectWebSocket } from './services/websocket';

// Подключение
connectWebSocket((data) => {
  console.log('Telemetry data:', data);
});

// Отключение
disconnectWebSocket();
```

## 🎨 Темизация

Тема Material-UI настроена в `src/theme.js`:

```javascript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0ea5e9',
    },
    // ...
  },
  // ...
});
```

## 📱 Адаптивность

Приложение адаптивно и работает на:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🧪 Тестирование

```bash
# Запустить тесты (если настроены)
npm test
```

## 🐛 Troubleshooting

### Ошибка подключения к API

1. Проверьте, что backend запущен на `http://localhost:3001`
2. Проверьте переменную окружения `VITE_API_URL`
3. Проверьте CORS настройки на backend

### Проблемы с WebSocket

1. Убедитесь, что WebSocket сервер запущен на порту 3002
2. Проверьте подключение в DevTools → Network → WS

### Проблемы со сборкой

```bash
# Очистить кэш и переустановить
rm -rf node_modules dist
npm install
npm run build
```

## 📦 Production Deployment

### Build

```bash
npm run build
```

### Деплой на статический хостинг

1. Соберите проект: `npm run build`
2. Загрузите содержимое `dist/` на хостинг
3. Настройте reverse proxy для API запросов

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔒 Безопасность

- Токены хранятся в `localStorage`
- Автоматическое обновление токенов
- Защита от XSS через React
- Валидация входных данных

## 📄 Лицензия

ISC

