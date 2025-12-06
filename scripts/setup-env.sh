#!/bin/bash

# Скрипт для создания .env файла с правильными параметрами

ENV_FILE="backend/.env"

echo "📝 Создание файла .env..."

cat > $ENV_FILE << EOF
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=drone_light_show
DB_USER=postgres
DB_PASSWORD=1234
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
WS_PORT=3002
EOF

echo "✅ Файл $ENV_FILE создан"
echo ""
echo "📋 Содержимое:"
cat $ENV_FILE

