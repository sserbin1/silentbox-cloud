-- ===========================================
-- SILENTBOX CLOUD - Tenant Billing Schema
-- ===========================================
-- Tables for tenant subscriptions, invoices, and platform billing

-- ===========================================
-- SUPER ADMINS (Platform Level)
-- ===========================================
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'super_admin', -- super_admin, platform_support
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_super_admins_email ON super_admins(email);

-- ===========================================
-- SUBSCRIPTION PLANS
-- ===========================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'PLN',
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{
        "max_locations": 5,
        "max_booths": 20,
        "max_users": 100,
        "max_api_calls_per_day": 10000
    }',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, limits, sort_order) VALUES
('Starter', 'starter', 'Perfect for small operators', 99.00, 999.00,
 '{"max_locations": 2, "max_booths": 5, "max_users": 50, "max_api_calls_per_day": 5000}', 1),
('Professional', 'professional', 'For growing networks', 299.00, 2999.00,
 '{"max_locations": 10, "max_booths": 50, "max_users": 500, "max_api_calls_per_day": 50000}', 2),
('Enterprise', 'enterprise', 'Unlimited scale', 999.00, 9999.00,
 '{"max_locations": -1, "max_booths": -1, "max_users": -1, "max_api_calls_per_day": -1}', 3);

-- ===========================================
-- TENANT SUBSCRIPTIONS
-- ===========================================
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, past_due, trialing
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    payment_method_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT one_active_subscription_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX idx_tenant_subscriptions_period_end ON tenant_subscriptions(current_period_end);

-- ===========================================
-- TENANT INVOICES
-- ===========================================
CREATE TABLE tenant_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending, paid, void, uncollectible
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PLN',
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    line_items JSONB DEFAULT '[]',
    notes TEXT,
    payment_provider VARCHAR(50),
    provider_invoice_id VARCHAR(255),
    pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_invoices_tenant ON tenant_invoices(tenant_id);
CREATE INDEX idx_tenant_invoices_status ON tenant_invoices(status);
CREATE INDEX idx_tenant_invoices_due_date ON tenant_invoices(due_date);

-- Generate invoice number sequence
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
    BEFORE INSERT ON tenant_invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- ===========================================
-- PLATFORM USAGE METRICS
-- ===========================================
CREATE TABLE tenant_usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_tenant_metric_date UNIQUE (tenant_id, metric_date)
);

CREATE INDEX idx_tenant_usage_tenant ON tenant_usage_metrics(tenant_id);
CREATE INDEX idx_tenant_usage_date ON tenant_usage_metrics(metric_date);

-- ===========================================
-- PLATFORM SETTINGS
-- ===========================================
CREATE TABLE platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES super_admins(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
('platform_commission_rate', '{"rate": 0.05, "min": 0, "max": 100}', 'Platform commission percentage on transactions'),
('trial_period_days', '{"days": 14}', 'Default trial period for new tenants'),
('support_email', '{"email": "support@silentbox.cloud"}', 'Support email address'),
('maintenance_mode', '{"enabled": false, "message": null}', 'Platform maintenance mode settings');

-- ===========================================
-- Add subscription_id to tenants table
-- ===========================================
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trialing',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}';

-- ===========================================
-- TRIGGERS
-- ===========================================
CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
    BEFORE UPDATE ON tenant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_invoices_updated_at
    BEFORE UPDATE ON tenant_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
