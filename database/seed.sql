-- ============================================
-- Seed Script for Drone Light Show Management System
-- Initial Data for Roles
-- ============================================

-- Insert default roles
INSERT INTO roles (role_name, permissions_json, description) VALUES
('admin', '{"all": true}', 'Administrator with full access'),
('manager', '{"projects": true, "shows": true, "drones": true, "users": true}', 'Manager with management access'),
('operator', '{"shows": true, "drones": true, "telemetry": true}', 'Operator with operational access'),
('pilot', '{"drones": true, "telemetry": true, "flights": true}', 'Pilot with flight access'),
('designer', '{"projects": true, "shows": true, "choreographies": true}', 'Designer with design access')
ON CONFLICT (role_name) DO NOTHING;

