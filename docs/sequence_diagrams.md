# Диаграммы последовательности - Процессы работы системы

## 1. Процесс аутентификации и авторизации

```mermaid
sequenceDiagram
    participant User as 👤 Пользователь
    participant Frontend as React Frontend
    participant API as Express API
    participant DB as PostgreSQL
    participant JWT as JWT Service
    
    User->>Frontend: Ввод email и password
    Frontend->>API: POST /api/auth/login<br/>{email, password}
    API->>DB: SELECT user WHERE email
    DB-->>API: User data + password_hash
    API->>API: bcrypt.compare(password, hash)
    alt Пароль верный
        API->>JWT: generateTokens(user)
        JWT-->>API: {accessToken, refreshToken}
        API-->>Frontend: 200 OK<br/>{accessToken, refreshToken, user}
        Frontend->>Frontend: Сохранить токены в localStorage
        Frontend->>Frontend: Установить Authorization header
        Frontend-->>User: Перенаправление на Dashboard
    else Пароль неверный
        API-->>Frontend: 401 Unauthorized<br/>{error: "Invalid credentials"}
        Frontend-->>User: Показать ошибку
    end
```

## 2. Процесс получения телеметрии в реальном времени

```mermaid
sequenceDiagram
    participant Drone as 🚁 Дрон
    participant WS as WebSocket Server
    participant DB as PostgreSQL
    participant Alert as Alert Generator
    participant Frontend as React Frontend
    participant User as 👤 Пользователь
    
    Drone->>WS: WebSocket Connect<br/>ws://localhost:3002
    WS->>WS: Аутентификация по токену
    
    loop Каждые 1 секунду
        Drone->>WS: Telemetry Data<br/>{droneId, lat, lon, alt, battery, ...}
        WS->>DB: INSERT INTO telemetry
        WS->>Alert: Проверить условия алертов
        
        alt Критическое условие (battery < 20%)
            Alert->>DB: INSERT INTO alerts<br/>{type: "low_battery", severity: "warning"}
            Alert->>WS: Broadcast alert
            WS->>Frontend: WebSocket Message<br/>{type: "alert", data: {...}}
            Frontend->>User: Показать уведомление
        end
        
        WS->>Frontend: Broadcast telemetry<br/>{type: "telemetry", data: {...}}
        Frontend->>Frontend: Обновить Redux store
        Frontend->>User: Обновить UI (графики, 3D визуализация)
    end
```

## 3. Процесс создания шоу через AI генератор

```mermaid
sequenceDiagram
    participant User as 👤 Пользователь
    participant Frontend as React Frontend
    participant API as Express API
    participant AIService as AI Service
    participant DB as PostgreSQL
    
    User->>Frontend: Описание шоу в AI Chat
    Frontend->>API: POST /api/shows/generate<br/>{description, venue, duration}
    API->>AIService: Генерация концепции шоу
    AIService->>AIService: AI обработка запроса
    AIService-->>API: {showName, concept, choreographyIdeas}
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO shows
    API->>DB: INSERT INTO choreographies
    API->>DB: INSERT INTO flight_paths
    API->>DB: COMMIT TRANSACTION
    API-->>Frontend: 201 Created<br/>{show, choreography, ...}
    Frontend->>Frontend: Обновить Redux store
    Frontend->>User: Показать созданное шоу<br/>Кнопка "Подтвердить и создать"
    
    User->>Frontend: Нажать "Подтвердить"
    Frontend->>API: POST /api/shows/confirm<br/>{showId}
    API->>DB: UPDATE shows SET status='approved'
    API-->>Frontend: 200 OK
    Frontend-->>User: Шоу создано и подтверждено
```

## 4. Процесс назначения дронов на шоу

```mermaid
sequenceDiagram
    participant Manager as 👔 Менеджер
    participant Frontend as React Frontend
    participant API as Express API
    participant DB as PostgreSQL
    participant Validator as Validation Service
    
    Manager->>Frontend: Выбрать шоу и дроны
    Frontend->>API: GET /api/drones?status=active
    API->>DB: SELECT * FROM drones WHERE status='active'
    DB-->>API: Список доступных дронов
    API-->>Frontend: 200 OK<br/>[{drone1}, {drone2}, ...]
    
    Manager->>Frontend: Выбрать дроны для назначения
    Frontend->>API: POST /api/shows/:id/assign-drones<br/>{droneIds: [1, 2, 3]}
    
    API->>Validator: Проверить доступность дронов
    Validator->>DB: SELECT * FROM drone_assignments<br/>WHERE drone_id IN (1,2,3) AND status='assigned'
    DB-->>Validator: Существующие назначения
    
    alt Дроны доступны
        Validator-->>API: Validation OK
        API->>DB: BEGIN TRANSACTION
        loop Для каждого дрона
            API->>DB: INSERT INTO drone_assignments<br/>{showId, droneId, status='assigned'}
            API->>DB: UPDATE drones SET status='assigned'
        end
        API->>DB: COMMIT TRANSACTION
        API-->>Frontend: 201 Created<br/>{assignments: [...]}
        Frontend->>Manager: Показать успешное назначение
    else Дроны уже назначены
        Validator-->>API: Validation Error
        API-->>Frontend: 409 Conflict<br/>{error: "Drones already assigned"}
        Frontend->>Manager: Показать ошибку
    end
```

## 5. Процесс выполнения шоу с мониторингом

```mermaid
sequenceDiagram
    participant Operator as 👨‍💼 Оператор
    participant Frontend as React Frontend
    participant API as Express API
    participant WS as WebSocket Server
    participant Drones as 🚁 Дроны
    participant DB as PostgreSQL
    participant Alert as Alert System
    
    Operator->>Frontend: Начать шоу
    Frontend->>API: POST /api/shows/:id/start
    API->>DB: UPDATE shows SET status='in_progress'
    API->>WS: Broadcast show_started
    WS->>Drones: Команда взлета
    Drones->>WS: Подтверждение взлета
    
    loop Во время шоу
        Drones->>WS: Телеметрия (каждую секунду)
        WS->>DB: Сохранить телеметрию
        WS->>Alert: Проверить алерты
        
        alt Обнаружен алерт
            Alert->>DB: INSERT alert
            Alert->>WS: Broadcast alert
            WS->>Frontend: WebSocket alert
            Frontend->>Operator: Показать уведомление
        end
        
        WS->>Frontend: Broadcast telemetry
        Frontend->>Frontend: Обновить 3D визуализацию
        Frontend->>Frontend: Обновить графики
    end
    
    Operator->>Frontend: Завершить шоу
    Frontend->>API: POST /api/shows/:id/complete
    API->>WS: Broadcast show_complete
    WS->>Drones: Команда посадки
    Drones->>WS: Подтверждение посадки
    API->>DB: UPDATE shows SET status='completed'
    API->>DB: UPDATE drones SET status='active'
    API-->>Frontend: 200 OK
    Frontend->>Operator: Показать результаты шоу
```

## 6. Процесс технического обслуживания дрона

```mermaid
sequenceDiagram
    participant Technician as 🔧 Техник
    participant Frontend as React Frontend
    participant API as Express API
    participant DB as PostgreSQL
    participant Alert as Alert System
    
    Alert->>Frontend: Алерт: "Требуется обслуживание"
    Frontend->>Technician: Уведомление
    
    Technician->>Frontend: Просмотр дрона
    Frontend->>API: GET /api/drones/:id
    API->>DB: SELECT * FROM drones WHERE drone_id=:id
    DB-->>API: Данные дрона
    API-->>Frontend: 200 OK<br/>{drone, maintenance_history}
    
    Technician->>Frontend: Создать запись обслуживания
    Frontend->>API: POST /api/maintenance<br/>{droneId, type, description}
    API->>DB: UPDATE drones SET status='maintenance'
    API->>DB: INSERT INTO maintenance_logs
    API-->>Frontend: 201 Created
    
    Technician->>Technician: Выполнить обслуживание<br/>(физически)
    
    Technician->>Frontend: Завершить обслуживание
    Frontend->>API: PUT /api/maintenance/:id/complete<br/>{cost, nextMaintenanceDate}
    API->>DB: UPDATE maintenance_logs SET completed=true
    API->>DB: UPDATE drones SET status='active',<br/>last_maintenance_date=NOW(),<br/>next_maintenance_date=:date
    API-->>Frontend: 200 OK
    Frontend->>Technician: Дрон готов к использованию
```

## 7. Процесс создания хореографии

```mermaid
sequenceDiagram
    participant Designer as 🎨 Дизайнер
    participant Frontend as React Frontend
    participant Editor as Choreography Editor
    participant API as Express API
    participant DB as PostgreSQL
    
    Designer->>Frontend: Открыть редактор хореографии
    Frontend->>API: GET /api/shows/:id
    API->>DB: SELECT * FROM shows WHERE show_id=:id
    DB-->>API: Данные шоу
    API-->>Frontend: 200 OK<br/>{show}
    
    Designer->>Editor: Создать новую хореографию
    Editor->>Editor: Визуальное проектирование<br/>(3D редактор)
    
    loop Добавление элементов
        Designer->>Editor: Добавить flight path
        Editor->>Editor: Определить траекторию
        Designer->>Editor: Добавить formation
        Editor->>Editor: Определить позиции дронов
        Designer->>Editor: Добавить lighting sequence
        Editor->>Editor: Определить цвета и эффекты
    end
    
    Designer->>Editor: Сохранить хореографию
    Editor->>Frontend: {choreographyData}
    Frontend->>API: POST /api/choreographies<br/>{showId, name, flightPaths, formations, lighting}
    
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT INTO choreographies
    loop Для каждого flight_path
        API->>DB: INSERT INTO flight_paths
    end
    loop Для каждой formation
        API->>DB: INSERT INTO formations
    end
    loop Для каждой lighting_sequence
        API->>DB: INSERT INTO lighting_sequences
    end
    API->>DB: COMMIT TRANSACTION
    
    API-->>Frontend: 201 Created<br/>{choreography}
    Frontend->>Designer: Хореография сохранена
```

