# Архитектура системы управления световыми шоу дронов

## 1. Общая архитектура системы (System Context)

```mermaid
graph TB
    Users[👥 Пользователи<br/>Admin, Manager, Operator, Designer, Pilot]
    Drones[🚁 Дроны<br/>Беспилотные аппараты]
    System[🎯 Система управления<br/>Drone Light Show Management]
    DB[(🗄️ PostgreSQL<br/>База данных)]
    Files[📁 Файловое хранилище<br/>Проекты, медиа]
    
    Users -->|HTTP/HTTPS<br/>REST API| System
    Drones -->|WebSocket<br/>Телеметрия| System
    System -->|Команды управления| Drones
    System <-->|CRUD операции| DB
    System <-->|Загрузка/Скачивание| Files
    
    style System fill:#0ea5e9,stroke:#0284c7,stroke-width:3px,color:#fff
    style DB fill:#336791,stroke:#1e4a6b,stroke-width:2px,color:#fff
    style Users fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Drones fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
```

## 2. Компонентная архитектура (Container Diagram)

```mermaid
graph TB
    subgraph "Frontend Layer"
        React[React Application<br/>Port: 3000<br/>Material-UI, Redux]
    end
    
    subgraph "Backend Layer"
        API[Express REST API<br/>Port: 3001<br/>JWT Auth, Swagger]
        WS[WebSocket Server<br/>Port: 3002<br/>Real-time Telemetry]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL<br/>Port: 5432<br/>Database)]
        Storage[File Storage<br/>Project Files]
    end
    
    subgraph "External Services"
        Weather[Weather API<br/>Опционально]
    end
    
    React -->|HTTP/REST<br/>JSON| API
    React -->|WebSocket<br/>JSON| WS
    API -->|Sequelize ORM| PostgreSQL
    WS -->|Sequelize ORM| PostgreSQL
    API -->|Read/Write| Storage
    API -.->|HTTP| Weather
    
    style React fill:#61dafb,stroke:#4fa8c5,stroke-width:2px
    style API fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style WS fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style PostgreSQL fill:#336791,stroke:#1e4a6b,stroke-width:2px,color:#fff
```

## 3. Слоистая архитектура (Layered Architecture)

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[React Components<br/>Pages, Forms, Charts]
        State[Redux Store<br/>State Management]
        WSClient[WebSocket Client<br/>Real-time Updates]
    end
    
    subgraph "API Layer"
        Routes[Express Routes<br/>/api/*]
        Controllers[Controllers<br/>Request Handling]
        Middleware[Middleware<br/>Auth, Validation, Error]
    end
    
    subgraph "Business Logic Layer"
        Services[Services<br/>Business Logic]
        Validators[Validators<br/>Data Validation]
        AlertGen[Alert Generator<br/>Event Processing]
    end
    
    subgraph "Data Access Layer"
        Models[Sequelize Models<br/>ORM Mapping]
        Migrations[Database Migrations<br/>Schema Management]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database)]
    end
    
    UI --> State
    UI --> WSClient
    State --> Routes
    WSClient --> Routes
    Routes --> Controllers
    Controllers --> Middleware
    Middleware --> Services
    Services --> Validators
    Services --> AlertGen
    Services --> Models
    Models --> DB
    Migrations --> DB
    
    style UI fill:#61dafb,stroke:#4fa8c5,stroke-width:2px
    style Routes fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style Services fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Models fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style DB fill:#336791,stroke:#1e4a6b,stroke-width:2px,color:#fff
```

## 4. Поток данных (Data Flow Diagram)

```mermaid
flowchart LR
    subgraph "External Entities"
        User[👤 Пользователь]
        Drone[🚁 Дрон]
    end
    
    subgraph "Processes"
        Auth[Аутентификация]
        Manage[Управление данными]
        Monitor[Мониторинг]
        Alert[Генерация алертов]
    end
    
    subgraph "Data Stores"
        DB[(База данных)]
        Files[Файлы]
    end
    
    User -->|Credentials| Auth
    Auth -->|JWT Token| User
    User -->|CRUD запросы| Manage
    Manage <-->|Read/Write| DB
    Manage <-->|Upload/Download| Files
    
    Drone -->|Телеметрия| Monitor
    Monitor -->|Сохранить| DB
    Monitor -->|Проверка условий| Alert
    Alert -->|Создать алерт| DB
    Alert -->|Уведомление| User
    
    style User fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Drone fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style DB fill:#336791,stroke:#1e4a6b,stroke-width:2px,color:#fff
```

## 5. Сетевая архитектура (Network Architecture)

```mermaid
graph TB
    subgraph "Client Network"
        Browser[🌐 Web Browser<br/>Chrome, Firefox, Safari]
    end
    
    subgraph "DMZ / Load Balancer"
        LB[⚖️ Load Balancer<br/>Nginx / HAProxy]
    end
    
    subgraph "Application Servers"
        Frontend1[Frontend Server 1<br/>React App]
        Frontend2[Frontend Server 2<br/>React App]
        Backend1[Backend API 1<br/>Node.js + Express]
        Backend2[Backend API 2<br/>Node.js + Express]
        WS1[WebSocket Server 1<br/>ws]
        WS2[WebSocket Server 2<br/>ws]
    end
    
    subgraph "Database Cluster"
        Primary[(PostgreSQL Primary<br/>Master)]
        Replica[(PostgreSQL Replica<br/>Read Replica)]
    end
    
    subgraph "Storage"
        FileStorage[📁 File Storage<br/>S3 / Local FS]
    end
    
    Browser -->|HTTPS| LB
    LB --> Frontend1
    LB --> Frontend2
    Frontend1 -->|HTTP| Backend1
    Frontend2 -->|HTTP| Backend2
    Frontend1 -->|WS| WS1
    Frontend2 -->|WS| WS2
    
    Backend1 -->|Write| Primary
    Backend2 -->|Write| Primary
    Backend1 -->|Read| Replica
    Backend2 -->|Read| Replica
    WS1 -->|Write| Primary
    WS2 -->|Write| Primary
    
    Backend1 --> FileStorage
    Backend2 --> FileStorage
    
    Primary -.->|Replication| Replica
    
    style LB fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style Primary fill:#336791,stroke:#1e4a6b,stroke-width:2px,color:#fff
    style Replica fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff
```

