-- ============================================
-- DDL Script for Drone Light Show Management System
-- PostgreSQL Database Schema
-- Version 2.3.1
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Таблица 1: ROLES (Роли пользователей)
-- ============================================
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    permissions_json JSONB NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_role_name ON roles(role_name);

-- ============================================
-- Таблица 2: USERS (Пользователи)
-- ============================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NULL,
    role_id INTEGER REFERENCES roles(role_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- Таблица 3: BATTERIES (Аккумуляторы)
-- ============================================
CREATE TABLE batteries (
    battery_id SERIAL PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    capacity_mah INTEGER NOT NULL,
    voltage DECIMAL(4,2) NOT NULL,
    charge_cycles INTEGER DEFAULT 0,
    max_charge_cycles INTEGER NOT NULL,
    health_status VARCHAR(20) CHECK (health_status IN ('good', 'degraded', 'poor', 'replace')),
    purchase_date DATE NOT NULL,
    last_charged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_batteries_serial_number ON batteries(serial_number);
CREATE INDEX idx_batteries_health_status ON batteries(health_status);

-- ============================================
-- Таблица 4: DRONES (Дроны)
-- ============================================
CREATE TABLE drones (
    drone_id SERIAL PRIMARY KEY,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'maintenance', 'retired', 'damaged')),
    current_flight_hours DECIMAL(10,2) DEFAULT 0,
    max_flight_hours DECIMAL(10,2) NOT NULL,
    battery_id INTEGER REFERENCES batteries(battery_id) ON DELETE SET NULL,
    last_maintenance_date DATE NULL,
    next_maintenance_date DATE NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drones_serial_number ON drones(serial_number);
CREATE INDEX idx_drones_status ON drones(status);
CREATE INDEX idx_drones_battery_id ON drones(battery_id);

-- ============================================
-- Таблица 5: LED_MODULES (LED-модули)
-- ============================================
CREATE TABLE led_modules (
    led_module_id SERIAL PRIMARY KEY,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    rgb_capability BOOLEAN DEFAULT TRUE,
    brightness_level INTEGER CHECK (brightness_level >= 0 AND brightness_level <= 100),
    status VARCHAR(20) CHECK (status IN ('working', 'faulty', 'replaced')),
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_led_modules_drone_id ON led_modules(drone_id);
CREATE INDEX idx_led_modules_status ON led_modules(status);

-- ============================================
-- Таблица 6: MAINTENANCE_LOGS (Журнал обслуживания)
-- ============================================
CREATE TABLE maintenance_logs (
    maintenance_id SERIAL PRIMARY KEY,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    maintenance_type VARCHAR(20) CHECK (maintenance_type IN ('routine', 'repair', 'upgrade', 'inspection')),
    performed_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    maintenance_date DATE NOT NULL,
    cost DECIMAL(10,2) NULL,
    description TEXT NOT NULL,
    next_maintenance_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_logs_drone_id ON maintenance_logs(drone_id);
CREATE INDEX idx_maintenance_logs_performed_by ON maintenance_logs(performed_by);
CREATE INDEX idx_maintenance_logs_maintenance_date ON maintenance_logs(maintenance_date);

-- ============================================
-- Таблица 7: CLIENTS (Клиенты)
-- ============================================
CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_company_name ON clients(company_name);
CREATE INDEX idx_clients_email ON clients(email);

-- ============================================
-- Таблица 8: PROJECTS (Проекты)
-- ============================================
CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(200) NOT NULL,
    client_id INTEGER REFERENCES clients(client_id) ON DELETE CASCADE,
    created_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('planning', 'design', 'testing', 'approved', 'completed', 'cancelled')),
    start_date DATE NULL,
    end_date DATE NULL,
    budget DECIMAL(12,2) NULL,
    location TEXT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_project_name ON projects(project_name);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- ============================================
-- Таблица 9: SHOWS (Шоу/Выступления)
-- ============================================
CREATE TABLE shows (
    show_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
    show_name VARCHAR(200) NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    venue TEXT NOT NULL,
    weather_conditions VARCHAR(100) NULL,
    crowd_size INTEGER NULL,
    duration_seconds INTEGER NOT NULL,
    music_file_path TEXT NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shows_project_id ON shows(project_id);
CREATE INDEX idx_shows_show_date ON shows(show_date);
CREATE INDEX idx_shows_status ON shows(status);

-- ============================================
-- Таблица 10: CHOREOGRAPHIES (Хореографии)
-- ============================================
CREATE TABLE choreographies (
    choreography_id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(show_id) ON DELETE CASCADE,
    choreography_name VARCHAR(200) NOT NULL,
    designer_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    design_file_path TEXT NULL,
    duration_seconds INTEGER NOT NULL,
    drone_count INTEGER NOT NULL,
    scene_order INTEGER NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_choreographies_show_id ON choreographies(show_id);
CREATE INDEX idx_choreographies_designer_id ON choreographies(designer_id);
CREATE INDEX idx_choreographies_scene_order ON choreographies(show_id, scene_order);

-- ============================================
-- Таблица 11: FLIGHT_PATHS (Траектории полета)
-- ============================================
CREATE TABLE flight_paths (
    path_id SERIAL PRIMARY KEY,
    choreography_id INTEGER REFERENCES choreographies(choreography_id) ON DELETE CASCADE,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    path_data_json JSONB NOT NULL,
    start_position JSONB NOT NULL,
    end_position JSONB NOT NULL,
    max_altitude DECIMAL(6,2) NOT NULL,
    collision_check_status VARCHAR(20) CHECK (collision_check_status IN ('pending', 'passed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flight_paths_choreography_id ON flight_paths(choreography_id);
CREATE INDEX idx_flight_paths_drone_id ON flight_paths(drone_id);
CREATE INDEX idx_flight_paths_collision_check ON flight_paths(collision_check_status);

-- ============================================
-- Таблица 12: FORMATIONS (Формации)
-- ============================================
CREATE TABLE formations (
    formation_id SERIAL PRIMARY KEY,
    choreography_id INTEGER REFERENCES choreographies(choreography_id) ON DELETE CASCADE,
    formation_name VARCHAR(200) NOT NULL,
    formation_type VARCHAR(20) CHECK (formation_type IN ('2D', '3D', 'logo', 'text', 'animation')),
    timestamp_start DECIMAL(10,3) NOT NULL,
    timestamp_end DECIMAL(10,3) NOT NULL,
    coordinates_json JSONB NOT NULL,
    drone_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_formations_choreography_id ON formations(choreography_id);
CREATE INDEX idx_formations_formation_type ON formations(formation_type);

-- ============================================
-- Таблица 13: LIGHTING_SEQUENCES (Световые последовательности)
-- ============================================
CREATE TABLE lighting_sequences (
    sequence_id SERIAL PRIMARY KEY,
    choreography_id INTEGER REFERENCES choreographies(choreography_id) ON DELETE CASCADE,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    timestamp_start DECIMAL(10,3) NOT NULL,
    timestamp_end DECIMAL(10,3) NOT NULL,
    rgb_values_json JSONB NOT NULL,
    brightness_level INTEGER CHECK (brightness_level >= 0 AND brightness_level <= 100),
    effect_type VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lighting_sequences_choreography_id ON lighting_sequences(choreography_id);
CREATE INDEX idx_lighting_sequences_drone_id ON lighting_sequences(drone_id);

-- ============================================
-- Таблица 14: FLIGHTS (Полеты)
-- ============================================
CREATE TABLE flights (
    flight_id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(show_id) ON DELETE CASCADE,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    pilot_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    flight_date DATE NOT NULL,
    takeoff_time TIMESTAMP NOT NULL,
    landing_time TIMESTAMP NULL,
    flight_duration_minutes DECIMAL(6,2) NULL,
    battery_used INTEGER REFERENCES batteries(battery_id) ON DELETE SET NULL,
    status VARCHAR(20) CHECK (status IN ('successful', 'aborted', 'emergency_landing', 'failed')),
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flights_show_id ON flights(show_id);
CREATE INDEX idx_flights_drone_id ON flights(drone_id);
CREATE INDEX idx_flights_pilot_id ON flights(pilot_id);
CREATE INDEX idx_flights_flight_date ON flights(flight_date);
CREATE INDEX idx_flights_status ON flights(status);

-- ============================================
-- Таблица 15: TELEMETRY (Телеметрия)
-- ============================================
CREATE TABLE telemetry (
    telemetry_id SERIAL PRIMARY KEY,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    flight_id INTEGER REFERENCES flights(flight_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    altitude DECIMAL(6,2) NOT NULL,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    gps_signal_strength INTEGER CHECK (gps_signal_strength >= 0 AND gps_signal_strength <= 100),
    connection_status VARCHAR(20) CHECK (connection_status IN ('connected', 'weak', 'disconnected')),
    speed DECIMAL(5,2) NULL,
    heading DECIMAL(5,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_drone_id ON telemetry(drone_id);
CREATE INDEX idx_telemetry_flight_id ON telemetry(flight_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp);
CREATE INDEX idx_telemetry_drone_timestamp ON telemetry(drone_id, timestamp DESC);

-- ============================================
-- Таблица 16: SAFETY_ALERTS (Оповещения безопасности)
-- ============================================
CREATE TABLE safety_alerts (
    alert_id SERIAL PRIMARY KEY,
    flight_id INTEGER REFERENCES flights(flight_id) ON DELETE CASCADE,
    drone_id INTEGER REFERENCES drones(drone_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) CHECK (alert_type IN ('low_battery', 'connection_loss', 'collision_warning', 'geofence_breach', 'hardware_failure')),
    alert_time TIMESTAMP NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolution_time TIMESTAMP NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_alerts_flight_id ON safety_alerts(flight_id);
CREATE INDEX idx_safety_alerts_drone_id ON safety_alerts(drone_id);
CREATE INDEX idx_safety_alerts_alert_type ON safety_alerts(alert_type);
CREATE INDEX idx_safety_alerts_severity ON safety_alerts(severity);
CREATE INDEX idx_safety_alerts_resolved ON safety_alerts(resolved);
CREATE INDEX idx_safety_alerts_alert_time ON safety_alerts(alert_time DESC);

-- ============================================
-- Таблица 17: CERTIFICATIONS (Сертификаты)
-- ============================================
CREATE TABLE certifications (
    certification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    certification_type VARCHAR(50) CHECK (certification_type IN ('pilot_license', 'drone_registration', 'insurance', 'safety_training')),
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    document_path TEXT NULL,
    status VARCHAR(20) CHECK (status IN ('valid', 'expired', 'revoked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_certification_type ON certifications(certification_type);
CREATE INDEX idx_certifications_status ON certifications(status);
CREATE INDEX idx_certifications_expiration_date ON certifications(expiration_date);

-- ============================================
-- Таблица 18: GEOFENCES (Геозоны)
-- ============================================
CREATE TABLE geofences (
    geofence_id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(show_id) ON DELETE CASCADE,
    coordinates_json JSONB NOT NULL,
    max_altitude DECIMAL(6,2) NOT NULL,
    crowd_line_distance DECIMAL(6,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_geofences_show_id ON geofences(show_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drones_updated_at BEFORE UPDATE ON drones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON shows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_choreographies_updated_at BEFORE UPDATE ON choreographies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
