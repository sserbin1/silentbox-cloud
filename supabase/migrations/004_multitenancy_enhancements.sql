-- ===========================================
-- SILENTBOX CLOUD - Multi-tenancy Enhancements
-- ===========================================
-- Adds API keys, super admin support, and enhanced tenant management

-- Add new columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS api_key VARCHAR(100) UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'PL';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_booths_per_location INTEGER DEFAULT 5;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 100;

-- Create index for API key lookup
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Add role constraint to users (now includes super_admin)
-- Note: This is informational as we're using VARCHAR, not ENUM
COMMENT ON COLUMN users.role IS 'Possible values: user, operator, admin, super_admin';

-- ===========================================
-- PLATFORM_SETTINGS (Global platform config)
-- ===========================================
CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
    ('maintenance_mode', 'false', 'Enable platform-wide maintenance mode'),
    ('registration_enabled', 'true', 'Allow new tenant registration'),
    ('default_subscription_plan', '"free"', 'Default plan for new tenants'),
    ('supported_currencies', '["PLN", "EUR", "USD", "UAH"]', 'List of supported currencies'),
    ('supported_countries', '["PL", "UA", "DE", "CZ", "SK"]', 'List of supported countries')
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- AUDIT_LOGS (Platform-wide audit logging)
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_time ON audit_logs(created_at);

-- ===========================================
-- SUBSCRIPTION_PLANS
-- ===========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'PLN',
    max_locations INTEGER NOT NULL,
    max_booths_per_location INTEGER NOT NULL,
    max_users INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_locations, max_booths_per_location, max_users, features) VALUES
    ('Free', 'free', 'Perfect for testing', 0, 0, 1, 2, 10, '["Basic support", "1 location", "Up to 2 booths"]'),
    ('Starter', 'starter', 'For small businesses', 99, 990, 1, 5, 50, '["Email support", "1 location", "Up to 5 booths", "Basic analytics"]'),
    ('Professional', 'professional', 'For growing businesses', 299, 2990, 3, 10, 200, '["Priority support", "Up to 3 locations", "Up to 10 booths per location", "Advanced analytics", "API access"]'),
    ('Enterprise', 'enterprise', 'For large organizations', 999, 9990, 999, 999, 99999, '["Dedicated support", "Unlimited locations", "Unlimited booths", "Full analytics", "Full API access", "Custom branding", "SLA"]')
ON CONFLICT (slug) DO NOTHING;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- TENANT_INVITATIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    token VARCHAR(100) UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_tenant ON tenant_invitations(tenant_id);

-- ===========================================
-- Helper function for audit logging
-- ===========================================
CREATE OR REPLACE FUNCTION log_audit_event(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
    VALUES (p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
