.PHONY: help install dev build test clean migrate seed docker-up docker-down docker-restart

help:
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development servers"
	@echo "  make build         - Build production bundles"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make migrate       - Run database migrations"
	@echo "  make seed          - Seed database with initial data"
	@echo "  make docker-up     - Start Docker containers"
	@echo "  make docker-down   - Stop Docker containers"
	@echo "  make docker-restart - Restart Docker containers"

install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting development servers..."
	docker-compose up

build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Build complete!"

test:
	@echo "Running tests..."
	cd backend && npm test
	cd frontend && npm test

clean:
	@echo "Cleaning build artifacts..."
	rm -rf frontend/build
	rm -rf frontend/node_modules
	rm -rf backend/node_modules
	rm -rf node_modules

migrate:
	@echo "Running migrations..."
	cd backend && npm run migrate

seed:
	@echo "Seeding database..."
	cd backend && npm run seed

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	sleep 10
	@echo "Services are ready!"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-restart:
	@echo "Restarting Docker containers..."
	docker-compose restart

docker-logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

db-reset:
	@echo "Resetting database..."
	docker-compose exec postgres psql -U postgres -d drone_light_show -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	cd backend && npm run migrate
	cd backend && npm run seed

