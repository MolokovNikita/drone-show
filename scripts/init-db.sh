#!/bin/bash

# Скрипт для инициализации базы данных
# Использование: ./scripts/init-db.sh

DB_NAME="drone_light_show"
DB_USER="postgres"
DB_PASSWORD="1234"
DB_HOST="localhost"
DB_PORT="5432"

echo "🚀 Инициализация базы данных $DB_NAME..."

# Установка переменной окружения для пароля
export PGPASSWORD=$DB_PASSWORD

# Проверка подключения к PostgreSQL
echo "📡 Проверка подключения к PostgreSQL..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Ошибка: Не удалось подключиться к PostgreSQL"
    echo "Проверьте, что PostgreSQL запущен и доступен на $DB_HOST:$DB_PORT"
    exit 1
fi

echo "✅ Подключение к PostgreSQL успешно"

# Создание базы данных (если не существует)
echo "📦 Создание базы данных $DB_NAME (если не существует)..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ База данных $DB_NAME готова"
else
    echo "⚠️  База данных $DB_NAME уже существует или произошла ошибка"
fi

# Выполнение DDL скрипта
echo "📝 Выполнение DDL скрипта..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/ddl.sql

if [ $? -eq 0 ]; then
    echo "✅ DDL скрипт выполнен успешно"
else
    echo "❌ Ошибка при выполнении DDL скрипта"
    exit 1
fi

# Проверка созданных таблиц
echo "🔍 Проверка созданных таблиц..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Создано таблиц: $TABLE_COUNT"

echo ""
echo "🎉 База данных успешно инициализирована!"
echo "📊 База данных: $DB_NAME"
echo "👤 Пользователь: $DB_USER"
echo "🌐 Хост: $DB_HOST:$DB_PORT"

# Сброс переменной окружения
unset PGPASSWORD

