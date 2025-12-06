# Промпт для генерации диаграмм в Miro

Используйте этот промпт в Miro для создания всех необходимых диаграмм системы управления световыми шоу дронов.

---

## 1. ER-диаграмма (Entity Relationship Diagram)

**Промпт:**

```
Создай ER-диаграмму для системы управления световыми шоу дронов со следующими сущностями и связями:

СУЩНОСТИ:
1. ROLES (id, name, description, permissions)
2. USERS (id, email, password_hash, first_name, last_name, role_id FK → ROLES)
3. BATTERIES (id, serial_number, capacity_mah, voltage, health_percentage, status)
4. LED_MODULES (id, serial_number, module_type, led_count, brightness_level, status)
5. DRONES (id, serial_number, model, status, battery_id FK → BATTERIES, led_module_id FK → LED_MODULES)
6. MAINTENANCE_LOGS (id, drone_id FK → DRONES, battery_id FK → BATTERIES, led_module_id FK → LED_MODULES, performed_by FK → USERS)
7. CLIENTS (id, name, contact_person, email, created_by FK → USERS)
8. PROJECTS (id, name, client_id FK → CLIENTS, created_by FK → USERS, status)
9. SHOWS (id, project_id FK → PROJECTS, name, scheduled_date, status, created_by FK → USERS)
10. CHOREOGRAPHIES (id, show_id FK → SHOWS, name, duration_seconds)
11. FLIGHT_PATHS (id, choreography_id FK → CHOREOGRAPHIES, drone_id FK → DRONES, path_data JSONB)
12. FORMATIONS (id, choreography_id FK → CHOREOGRAPHIES, name, shape_data JSONB, drone_positions JSONB)
13. DRONE_ASSIGNMENTS (id, show_id FK → SHOWS, drone_id FK → DRONES, assigned_by FK → USERS, status)
14. TELEMETRY (id, drone_id FK → DRONES, show_id FK → SHOWS, timestamp, latitude, longitude, altitude, battery_percentage)
15. ALERTS (id, drone_id FK → DRONES, show_id FK → SHOWS, alert_type, severity, status, acknowledged_by FK → USERS)
16. PROJECT_FILES (id, project_id FK → PROJECTS, show_id FK → SHOWS, file_name, uploaded_by FK → USERS)
17. WEATHER_LOGS (id, show_id FK → SHOWS, recorded_at, temperature, wind_speed)
18. AUDIT_LOGS (id, user_id FK → USERS, action, entity_type, entity_id)
19. SYSTEM_SETTINGS (id, key, value, updated_by FK → USERS)

СВЯЗИ:
- ROLES 1:N USERS
- USERS N:1 CLIENTS (created_by)
- USERS N:1 PROJECTS (created_by)
- USERS N:1 SHOWS (created_by)
- CLIENTS 1:N PROJECTS
- PROJECTS 1:N SHOWS
- SHOWS 1:N CHOREOGRAPHIES
- SHOWS 1:N DRONE_ASSIGNMENTS
- SHOWS 1:N TELEMETRY
- SHOWS 1:N ALERTS
- SHOWS 1:N WEATHER_LOGS
- CHOREOGRAPHIES 1:N FLIGHT_PATHS
- CHOREOGRAPHIES 1:N FORMATIONS
- DRONES N:1 BATTERIES
- DRONES N:1 LED_MODULES
- DRONES 1:N FLIGHT_PATHS
- DRONES 1:N DRONE_ASSIGNMENTS
- DRONES 1:N TELEMETRY
- DRONES 1:N ALERTS
- DRONES 1:N MAINTENANCE_LOGS
- BATTERIES 1:N MAINTENANCE_LOGS
- LED_MODULES 1:N MAINTENANCE_LOGS

Используй нотацию Crow's Foot. Покажи все атрибуты, первичные ключи (PK), внешние ключи (FK), и типы данных.
```

---

## 2. Диаграмма архитектуры системы (C4 Model - Level 1)

**Промпт:**

```
Создай диаграмму архитектуры системы управления световыми шоу дронов (C4 Level 1 - System Context):

КОМПОНЕНТЫ:
1. Пользователи (Users) - внешние актеры
2. Дроны (Drones) - внешние устройства
3. Система управления световыми шоу дронов (Drone Light Show Management System) - основная система

СВЯЗИ:
- Пользователи взаимодействуют с системой через веб-интерфейс
- Дроны отправляют телеметрию в систему через WebSocket
- Система отправляет команды дронам
- Система хранит данные в PostgreSQL

Используй прямоугольники для систем и стрелки для взаимодействий.
```

---

## 3. Диаграмма потоков данных (Data Flow Diagram)

**Промпт:**

```
Создай диаграмму потоков данных для системы управления световыми шоу дронов:

ПРОЦЕССЫ:
1. Аутентификация пользователя
2. Управление дронами
3. Планирование шоу
4. Создание хореографии
5. Прием телеметрии
6. Генерация алертов
7. Управление техническим обслуживанием

ХРАНИЛИЩА ДАННЫХ:
- База данных PostgreSQL
- Файловое хранилище

ВНЕШНИЕ СУЩНОСТИ:
- Пользователи
- Дроны
- Внешние API (погода)

Покажи потоки данных между процессами, хранилищами и внешними сущностями.
```

---

## 4. Use Case диаграмма

**Промпт:**

```
Создай Use Case диаграмму для системы управления световыми шоу дронов:

АКТЕРЫ:
- Администратор (Admin)
- Менеджер (Manager)
- Оператор (Operator)
- Хореограф (Choreographer)
- Техник (Technician)

USE CASES:
1. Управление пользователями (Admin)
2. Управление дронами (Admin, Manager)
3. Управление аккумуляторами (Admin, Manager, Technician)
4. Управление LED модулями (Admin, Manager, Technician)
5. Создание проекта (Manager, Operator)
6. Создание шоу (Manager, Operator)
7. Создание хореографии (Choreographer, Operator)
8. Назначение дронов на шоу (Manager, Operator)
9. Просмотр телеметрии (все роли)
10. Управление алертами (все роли)
11. Техническое обслуживание (Technician)
12. Просмотр отчетов (Manager, Admin)
13. Управление клиентами (Manager, Admin)
14. Загрузка файлов проекта (Operator, Manager)

Покажи связи между актерами и use cases, включи отношения (include, extend).
```

---

## 5. BPMN - Процесс технического обслуживания дрона

**Промпт:**

```
Создай BPMN диаграмму процесса технического обслуживания дрона:

ШАГИ:
1. Старт: Триггер обслуживания (плановое/по алерту)
2. Задача: Проверка состояния дрона
3. Шлюз: Требуется ли обслуживание?
4. Задача: Создание записи в maintenance_logs
5. Задача: Выполнение обслуживания
6. Задача: Замена компонентов (если необходимо)
7. Задача: Тестирование дрона
8. Шлюз: Дрон исправен?
9. Задача: Обновление статуса дрона
10. Задача: Планирование следующего обслуживания
11. Конец: Обслуживание завершено

Используй стандартные BPMN элементы: события, задачи, шлюзы, потоки.
```

---

## 6. BPMN - Процесс подготовки и выполнения шоу

**Промпт:**

```
Создай BPMN диаграмму процесса подготовки и выполнения шоу дронов:

ЭТАПЫ:
1. Старт: Создание проекта
2. Задача: Создание шоу
3. Задача: Создание хореографии
4. Задача: Назначение дронов
5. Задача: Проверка готовности дронов
6. Шлюз: Все дроны готовы?
7. Задача: Проверка погодных условий
8. Шлюз: Погода подходит?
9. Задача: Запуск шоу
10. Параллельный шлюз: Одновременно:
    - Мониторинг телеметрии
    - Обработка алертов
    - Выполнение хореографии
11. Шлюз: Шоу завершено успешно?
12. Задача: Посадить дроны
13. Задача: Обновление статуса шоу
14. Конец: Шоу завершено

Используй BPMN нотацию с событиями, задачами, шлюзами, параллельными потоками.
```

---

## 7. Диаграмма последовательности - Авторизация и получение телеметрии

**Промпт:**

```
Создай диаграмму последовательности для процесса авторизации и получения телеметрии:

УЧАСТНИКИ:
- Пользователь (User)
- Frontend (React App)
- Backend API (Express)
- WebSocket Server
- База данных (PostgreSQL)
- Дрон (Drone)

ПОСЛЕДОВАТЕЛЬНОСТЬ:
1. User → Frontend: Ввод credentials
2. Frontend → Backend API: POST /api/auth/login
3. Backend API → Database: Проверка пользователя
4. Database → Backend API: Данные пользователя
5. Backend API → Frontend: JWT токены
6. Frontend → WebSocket Server: Подключение с токеном
7. Drone → WebSocket Server: Отправка телеметрии
8. WebSocket Server → Database: Сохранение телеметрии
9. WebSocket Server → Frontend: Broadcast телеметрии
10. Frontend → User: Отображение данных

Используй стандартную нотацию диаграмм последовательности UML.
```

---

## Инструкции по использованию в Miro

1. Откройте Miro и создайте новую доску
2. Скопируйте нужный промпт
3. Используйте Miro AI или вставьте промпт в описание доски
4. Miro автоматически создаст диаграмму
5. При необходимости отредактируйте результат вручную

**Совет:** Для более точных результатов, создавайте диаграммы по одной, используя соответствующий промпт для каждого типа диаграммы.

