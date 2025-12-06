-- Ручная инициализация базы данных
-- Выполните этот скрипт в psql:
-- psql -h localhost -U postgres -f scripts/init-db-manual.sql

-- Создание базы данных (если не существует)
SELECT 'CREATE DATABASE drone_light_show'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'drone_light_show')\gexec

-- Подключение к созданной базе данных
\c drone_light_show

-- Выполнение DDL скрипта
\i database/ddl.sql

-- Проверка созданных таблиц
SELECT 
    COUNT(*) as total_tables,
    string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public';

