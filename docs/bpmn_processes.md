https://mermaid.live/
# BPMN диаграммы - Бизнес-процессы системы

## 1. Процесс создания и планирования шоу

```mermaid
flowchart TB
    Start([Старт: Создание проекта])
    CreateProject[Создать проект]
    CreateShow[Создать шоу]
    GenerateAI{Использовать<br/>AI генератор?}
    AIGenerate[AI генерирует концепцию]
    ManualCreate[Ручное создание]
    AssignDrones[Назначить дроны]
    CheckDrones{Все дроны<br/>доступны?}
    CreateChoreography[Создать хореографию]
    CheckReady{Шоу готово<br/>к выполнению?}
    ApproveShow[Утвердить шоу]
    ScheduleShow[Запланировать дату/время]
    End([Шоу запланировано])
    
    Start --> CreateProject
    CreateProject --> CreateShow
    CreateShow --> GenerateAI
    GenerateAI -->|Да| AIGenerate
    GenerateAI -->|Нет| ManualCreate
    AIGenerate --> AssignDrones
    ManualCreate --> AssignDrones
    AssignDrones --> CheckDrones
    CheckDrones -->|Нет| AssignDrones
    CheckDrones -->|Да| CreateChoreography
    CreateChoreography --> CheckReady
    CheckReady -->|Нет| CreateChoreography
    CheckReady -->|Да| ApproveShow
    ApproveShow --> ScheduleShow
    ScheduleShow --> End
    
    style Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style GenerateAI fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckDrones fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckReady fill:#f59e0b,stroke:#d97706,stroke-width:2px
```

## 2. Процесс выполнения шоу

```mermaid
flowchart TB
    Start([Старт: Время начала шоу])
    PreFlightCheck[Предполетная проверка]
    CheckWeather{Погодные<br/>условия OK?}
    CheckDrones{Все дроны<br/>готовы?}
    StartShow[Запустить шоу]
    Takeoff[Взлет дронов]
    
    subgraph Monitoring[Мониторинг во время шоу]
        ReceiveTelemetry[Получение телеметрии]
        CheckAlerts{Есть<br/>алерты?}
        ProcessAlert[Обработать алерт]
        CriticalAlert{Критический<br/>алерт?}
        EmergencyLanding[Аварийная посадка]
        ContinueShow[Продолжить шоу]
        ExecuteChoreography[Выполнение хореографии]
    end
    
    CheckComplete{Шоу<br/>завершено?}
    Landing[Посадка дронов]
    UpdateStatus[Обновить статус шоу]
    GenerateReport[Создать отчет]
    End([Шоу завершено])
    
    Start --> PreFlightCheck
    PreFlightCheck --> CheckWeather
    CheckWeather -->|Нет| End
    CheckWeather -->|Да| CheckDrones
    CheckDrones -->|Нет| End
    CheckDrones -->|Да| StartShow
    StartShow --> Takeoff
    Takeoff --> Monitoring
    
    Monitoring --> ReceiveTelemetry
    ReceiveTelemetry --> CheckAlerts
    CheckAlerts -->|Да| ProcessAlert
    CheckAlerts -->|Нет| ExecuteChoreography
    ProcessAlert --> CriticalAlert
    CriticalAlert -->|Да| EmergencyLanding
    CriticalAlert -->|Нет| ContinueShow
    ContinueShow --> ExecuteChoreography
    ExecuteChoreography --> CheckComplete
    EmergencyLanding --> UpdateStatus
    
    CheckComplete -->|Нет| ReceiveTelemetry
    CheckComplete -->|Да| Landing
    Landing --> UpdateStatus
    UpdateStatus --> GenerateReport
    GenerateReport --> End
    
    style Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style CheckWeather fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckDrones fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckAlerts fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CriticalAlert fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style EmergencyLanding fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
```

## 3. Процесс технического обслуживания дрона

```mermaid
flowchart TB
    Start([Старт: Триггер обслуживания])
    TriggerType{Тип триггера}
    Scheduled[Плановое обслуживание]
    AlertBased[По алерту]
    Manual[Ручной запрос]
    
    CheckDrone[Проверить состояние дрона]
    NeedsMaintenance{Требуется<br/>обслуживание?}
    CreateLog[Создать запись обслуживания]
    UpdateStatus[Обновить статус: maintenance]
    PerformMaintenance[Выполнить обслуживание]
    CheckComponents{Требуется<br/>замена компонентов?}
    ReplaceComponents[Заменить компоненты]
    TestDrone[Тестирование дрона]
    DroneOK{Дрон<br/>исправен?}
    UpdateDroneStatus[Обновить статус: active]
    ScheduleNext[Запланировать следующее обслуживание]
    UpdateLog[Обновить запись обслуживания]
    End([Обслуживание завершено])
    
    Start --> TriggerType
    TriggerType --> Scheduled
    TriggerType --> AlertBased
    TriggerType --> Manual
    
    Scheduled --> CheckDrone
    AlertBased --> CheckDrone
    Manual --> CheckDrone
    
    CheckDrone --> NeedsMaintenance
    NeedsMaintenance -->|Нет| End
    NeedsMaintenance -->|Да| CreateLog
    CreateLog --> UpdateStatus
    UpdateStatus --> PerformMaintenance
    PerformMaintenance --> CheckComponents
    CheckComponents -->|Да| ReplaceComponents
    CheckComponents -->|Нет| TestDrone
    ReplaceComponents --> TestDrone
    TestDrone --> DroneOK
    DroneOK -->|Нет| PerformMaintenance
    DroneOK -->|Да| UpdateDroneStatus
    UpdateDroneStatus --> ScheduleNext
    ScheduleNext --> UpdateLog
    UpdateLog --> End
    
    style Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style TriggerType fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px
    style NeedsMaintenance fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckComponents fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style DroneOK fill:#f59e0b,stroke:#d97706,stroke-width:2px
```

## 4. Процесс обработки телеметрии и генерации алертов

```mermaid
flowchart TB
    Start([Старт: Получение телеметрии])
    ReceiveData[Получить данные от дрона]
    ValidateData{Данные<br/>валидны?}
    SaveTelemetry[Сохранить в БД]
    CheckBattery{Батарея<br/>< 20%?}
    CheckSignal{Сигнал<br/>< 50%?}
    CheckAltitude{Высота<br/>вне диапазона?}
    CheckConnection{Соединение<br/>потеряно?}
    CheckError{Есть коды<br/>ошибок?}
    
    CreateBatteryAlert[Создать алерт: низкая батарея]
    CreateSignalAlert[Создать алерт: слабый сигнал]
    CreateAltitudeAlert[Создать алерт: высота]
    CreateConnectionAlert[Создать алерт: потеря связи]
    CreateErrorAlert[Создать алерт: ошибка]
    
    BroadcastTelemetry[Отправить телеметрию клиентам]
    BroadcastAlert[Отправить алерт клиентам]
    UpdateUI[Обновить UI]
    End([Обработка завершена])
    
    Start --> ReceiveData
    ReceiveData --> ValidateData
    ValidateData -->|Нет| End
    ValidateData -->|Да| SaveTelemetry
    SaveTelemetry --> CheckBattery
    SaveTelemetry --> CheckSignal
    SaveTelemetry --> CheckAltitude
    SaveTelemetry --> CheckConnection
    SaveTelemetry --> CheckError
    
    CheckBattery -->|Да| CreateBatteryAlert
    CheckBattery -->|Нет| CheckSignal
    CheckSignal -->|Да| CreateSignalAlert
    CheckSignal -->|Нет| CheckAltitude
    CheckAltitude -->|Да| CreateAltitudeAlert
    CheckAltitude -->|Нет| CheckConnection
    CheckConnection -->|Да| CreateConnectionAlert
    CheckConnection -->|Нет| CheckError
    CheckError -->|Да| CreateErrorAlert
    CheckError -->|Нет| BroadcastTelemetry
    
    CreateBatteryAlert --> BroadcastAlert
    CreateSignalAlert --> BroadcastAlert
    CreateAltitudeAlert --> BroadcastAlert
    CreateConnectionAlert --> BroadcastAlert
    CreateErrorAlert --> BroadcastAlert
    
    BroadcastAlert --> UpdateUI
    BroadcastTelemetry --> UpdateUI
    UpdateUI --> End
    
    style Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style ValidateData fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckBattery fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style CheckSignal fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style CheckAltitude fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style CheckConnection fill:#ef4444,stroke:#dc2626,stroke-width:2px
    style CheckError fill:#ef4444,stroke:#dc2626,stroke-width:2px
```

## 5. Процесс создания хореографии

```mermaid
flowchart TB
    Start([Старт: Создание хореографии])
    SelectShow[Выбрать шоу]
    CreateChoreography[Создать хореографию]
    AddFlightPaths[Добавить траектории полета]
    DefinePath[Определить путь для каждого дрона]
    CheckCollisions{Проверка<br/>столкновений}
    AddFormations[Добавить формации]
    DefinePositions[Определить позиции дронов]
    AddLighting[Добавить освещение]
    DefineColors[Определить цвета и эффекты]
    Preview3D[3D предпросмотр]
    PreviewOK{Предпросмотр<br/>OK?}
    SaveChoreography[Сохранить хореографию]
    ApproveChoreography{Утвердить<br/>хореографию?}
    End([Хореография готова])
    
    Start --> SelectShow
    SelectShow --> CreateChoreography
    CreateChoreography --> AddFlightPaths
    AddFlightPaths --> DefinePath
    DefinePath --> CheckCollisions
    CheckCollisions -->|Есть столкновения| DefinePath
    CheckCollisions -->|Нет столкновений| AddFormations
    AddFormations --> DefinePositions
    DefinePositions --> AddLighting
    AddLighting --> DefineColors
    DefineColors --> Preview3D
    Preview3D --> PreviewOK
    PreviewOK -->|Нет| AddFlightPaths
    PreviewOK -->|Да| SaveChoreography
    SaveChoreography --> ApproveChoreography
    ApproveChoreography -->|Нет| AddFlightPaths
    ApproveChoreography -->|Да| End
    
    style Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style End fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style CheckCollisions fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style PreviewOK fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style ApproveChoreography fill:#f59e0b,stroke:#d97706,stroke-width:2px
```

## 6. Процесс аутентификации и авторизации

```mermaid
flowchart TB
    Start([Старт: Запрос доступа])
    EnterCredentials[Ввод email и password]
    SendRequest[Отправить запрос на /api/auth/login]
    ValidateInput{Валидация<br/>входных данных}
    FindUser[Найти пользователя в БД]
    UserExists{Пользователь<br/>существует?}
    CheckPassword[Проверить пароль bcrypt]
    PasswordOK{Пароль<br/>верный?}
    CheckActive{Пользователь<br/>активен?}
    GenerateTokens[Сгенерировать JWT токены]
    SaveTokens[Сохранить токены в localStorage]
    SetAuthHeader[Установить Authorization header]
    Redirect[Перенаправление на Dashboard]
    Success([Успешная авторизация])
    
    Error401[Ошибка 401: Неверные данные]
    Error403[Ошибка 403: Пользователь неактивен]
    Error400[Ошибка 400: Невалидные данные]
    Fail([Ошибка авторизации])
    
    Start --> EnterCredentials
    EnterCredentials --> SendRequest
    SendRequest --> ValidateInput
    ValidateInput -->|Нет| Error400
    ValidateInput -->|Да| FindUser
    FindUser --> UserExists
    UserExists -->|Нет| Error401
    UserExists -->|Да| CheckPassword
    CheckPassword --> PasswordOK
    PasswordOK -->|Нет| Error401
    PasswordOK -->|Да| CheckActive
    CheckActive -->|Нет| Error403
    CheckActive -->|Да| GenerateTokens
    GenerateTokens --> SaveTokens
    SaveTokens --> SetAuthHeader
    SetAuthHeader --> Redirect
    Redirect --> Success
    
    Error400 --> Fail
    Error401 --> Fail
    Error403 --> Fail
    
    style Start fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Success fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style Fail fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style ValidateInput fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style UserExists fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style PasswordOK fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style CheckActive fill:#f59e0b,stroke:#d97706,stroke-width:2px
```

