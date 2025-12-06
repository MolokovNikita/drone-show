# Скрипт для инициализации базы данных (PowerShell)
# Использование: .\scripts\init-db.ps1

$DB_NAME = "drone_light_show"
$DB_USER = "postgres"
$DB_PASSWORD = "1234"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "🚀 Инициализация базы данных $DB_NAME..." -ForegroundColor Cyan

# Установка переменной окружения для пароля
$env:PGPASSWORD = $DB_PASSWORD

# Проверка подключения к PostgreSQL
Write-Host "📡 Проверка подключения к PostgreSQL..." -ForegroundColor Yellow
$connectionTest = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка: Не удалось подключиться к PostgreSQL" -ForegroundColor Red
    Write-Host "Проверьте, что PostgreSQL запущен и доступен на ${DB_HOST}:${DB_PORT}" -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

Write-Host "✅ Подключение к PostgreSQL успешно" -ForegroundColor Green

# Создание базы данных (если не существует)
Write-Host "📦 Создание базы данных $DB_NAME (если не существует)..." -ForegroundColor Yellow
$dbExists = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" 2>&1

if ($dbExists -match "1") {
    Write-Host "⚠️  База данных $DB_NAME уже существует" -ForegroundColor Yellow
} else {
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ База данных $DB_NAME создана" -ForegroundColor Green
    } else {
        Write-Host "❌ Ошибка при создании базы данных" -ForegroundColor Red
        $env:PGPASSWORD = $null
        exit 1
    }
}

# Выполнение DDL скрипта
Write-Host "📝 Выполнение DDL скрипта..." -ForegroundColor Yellow
$ddlPath = Join-Path $PSScriptRoot "..\database\ddl.sql"
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $ddlPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DDL скрипт выполнен успешно" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при выполнении DDL скрипта" -ForegroundColor Red
    $env:PGPASSWORD = $null
    exit 1
}

# Проверка созданных таблиц
Write-Host "🔍 Проверка созданных таблиц..." -ForegroundColor Yellow
$tableCount = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
Write-Host "✅ Создано таблиц: $($tableCount.Trim())" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 База данных успешно инициализирована!" -ForegroundColor Green
Write-Host "📊 База данных: $DB_NAME" -ForegroundColor Cyan
Write-Host "👤 Пользователь: $DB_USER" -ForegroundColor Cyan
Write-Host "🌐 Хост: ${DB_HOST}:${DB_PORT}" -ForegroundColor Cyan

# Сброс переменной окружения
$env:PGPASSWORD = $null

