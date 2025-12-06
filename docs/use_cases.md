# Use Case диаграммы - Функциональность системы

## 1. Общая Use Case диаграмма

```mermaid
graph TB
    subgraph "Актеры"
        Admin[👑 Администратор]
        Manager[👔 Менеджер]
        Operator[👨‍💼 Оператор]
        Designer[🎨 Дизайнер/Хореограф]
        Technician[🔧 Техник]
        Pilot[✈️ Пилот]
    end
    
    subgraph "Use Cases - Управление"
        UC1[Управление пользователями]
        UC2[Управление ролями]
        UC3[Управление дронами]
        UC4[Управление аккумуляторами]
        UC5[Управление LED модулями]
        UC6[Управление клиентами]
    end
    
    subgraph "Use Cases - Проекты и шоу"
        UC7[Создание проекта]
        UC8[Создание шоу]
        UC9[AI генерация шоу]
        UC10[Назначение дронов]
        UC11[Планирование шоу]
    end
    
    subgraph "Use Cases - Хореография"
        UC12[Создание хореографии]
        UC13[Редактирование хореографии]
        UC14[Определение траекторий]
        UC15[Создание формаций]
        UC16[Настройка освещения]
    end
    
    subgraph "Use Cases - Мониторинг"
        UC17[Просмотр телеметрии]
        UC18[3D визуализация]
        UC19[Графики и аналитика]
        UC20[Управление алертами]
    end
    
    subgraph "Use Cases - Обслуживание"
        UC21[Создание записи обслуживания]
        UC22[Планирование обслуживания]
        UC23[Просмотр истории обслуживания]
    end
    
    subgraph "Use Cases - Отчеты"
        UC24[Просмотр отчетов]
        UC25[Экспорт данных]
        UC26[Аналитика проектов]
    end
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC24
    Admin --> UC25
    
    Manager --> UC3
    Manager --> UC4
    Manager --> UC5
    Manager --> UC6
    Manager --> UC7
    Manager --> UC8
    Manager --> UC9
    Manager --> UC10
    Manager --> UC11
    Manager --> UC17
    Manager --> UC20
    Manager --> UC24
    Manager --> UC26
    
    Operator --> UC7
    Operator --> UC8
    Operator --> UC9
    Operator --> UC10
    Operator --> UC11
    Operator --> UC17
    Operator --> UC18
    Operator --> UC19
    Operator --> UC20
    
    Designer --> UC12
    Designer --> UC13
    Designer --> UC14
    Designer --> UC15
    Designer --> UC16
    Designer --> UC8
    
    Technician --> UC3
    Technician --> UC4
    Technician --> UC5
    Technician --> UC21
    Technician --> UC22
    Technician --> UC23
    
    Pilot --> UC17
    Pilot --> UC18
    Pilot --> UC20
    
    style Admin fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style Manager fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style Operator fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Designer fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style Technician fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style Pilot fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
```

## 2. Use Case - Управление дронами

```mermaid
graph LR
    Admin[👑 Администратор]
    Manager[👔 Менеджер]
    Technician[🔧 Техник]
    
    UC1[Создать дрон]
    UC2[Просмотреть список дронов]
    UC3[Обновить информацию о дроне]
    UC4[Удалить дрон]
    UC5[Изменить статус дрона]
    UC6[Просмотреть историю дрона]
    UC7[Назначить аккумулятор]
    UC8[Назначить LED модуль]
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    
    Manager --> UC2
    Manager --> UC3
    Manager --> UC5
    Manager --> UC6
    Manager --> UC7
    Manager --> UC8
    
    Technician --> UC2
    Technician --> UC3
    Technician --> UC6
    Technician --> UC7
    Technician --> UC8
```

## 3. Use Case - Планирование и выполнение шоу

```mermaid
graph TB
    Manager[👔 Менеджер]
    Operator[👨‍💼 Оператор]
    Designer[🎨 Дизайнер]
    
    UC1[Создать проект]
    UC2[Создать шоу]
    UC3[AI генерация шоу]
    UC4[Назначить дроны]
    UC5[Создать хореографию]
    UC6[Проверить готовность]
    UC7[Запустить шоу]
    UC8[Мониторинг в реальном времени]
    UC9[Завершить шоу]
    UC10[Просмотреть результаты]
    
    UC1 --> UC2
    UC2 --> UC3
    UC2 --> UC4
    UC2 --> UC5
    UC4 --> UC6
    UC5 --> UC6
    UC6 --> UC7
    UC7 --> UC8
    UC8 --> UC9
    UC9 --> UC10
    
    Manager --> UC1
    Manager --> UC2
    Manager --> UC3
    Manager --> UC4
    Manager --> UC6
    Manager --> UC7
    Manager --> UC9
    Manager --> UC10
    
    Operator --> UC2
    Operator --> UC3
    Operator --> UC4
    Operator --> UC6
    Operator --> UC7
    Operator --> UC8
    Operator --> UC9
    
    Designer --> UC5
```

## 4. Use Case - Мониторинг и алерты

```mermaid
graph TB
    Admin[👑 Администратор]
    Manager[👔 Менеджер]
    Operator[👨‍💼 Оператор]
    Pilot[✈️ Пилот]
    
    UC1[Просмотр телеметрии]
    UC2[3D визуализация дронов]
    UC3[Графики параметров]
    UC4[Просмотр алертов]
    UC5[Подтвердить алерт]
    UC6[Решить алерт]
    UC7[Настройка правил алертов]
    UC8[Экспорт телеметрии]
    
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    
    Manager --> UC1
    Manager --> UC2
    Manager --> UC3
    Manager --> UC4
    Manager --> UC5
    Manager --> UC6
    Manager --> UC8
    
    Operator --> UC1
    Operator --> UC2
    Operator --> UC3
    Operator --> UC4
    Operator --> UC5
    Operator --> UC6
    
    Pilot --> UC1
    Pilot --> UC2
    Pilot --> UC4
    Pilot --> UC5
```

## 5. Use Case - Техническое обслуживание

```mermaid
graph TB
    Technician[🔧 Техник]
    Manager[👔 Менеджер]
    
    UC1[Создать запись обслуживания]
    UC2[Планировать обслуживание]
    UC3[Просмотреть историю обслуживания]
    UC4[Обновить статус обслуживания]
    UC5[Добавить стоимость обслуживания]
    UC6[Просмотреть график обслуживания]
    UC7[Создать отчет по обслуживанию]
    
    UC1 --> UC4
    UC1 --> UC5
    UC2 --> UC6
    UC3 --> UC7
    
    Technician --> UC1
    Technician --> UC2
    Technician --> UC3
    Technician --> UC4
    Technician --> UC5
    Technician --> UC6
    
    Manager --> UC3
    Manager --> UC6
    Manager --> UC7
```

