-- ===========================================
-- SILENTBOX CLOUD - Row Level Security Policies
-- ===========================================
-- Multi-tenant isolation via tenant_id

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTION: Get current tenant from JWT
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- HELPER FUNCTION: Get current user from JWT
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- HELPER FUNCTION: Get current user role
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '');
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- TENANTS POLICIES
-- ===========================================
-- Users can only see their own tenant
CREATE POLICY "tenants_select_own" ON tenants
    FOR SELECT USING (id = public.get_tenant_id());

-- Only super admins can modify tenants (via service role)

-- ===========================================
-- USERS POLICIES
-- ===========================================
-- Users can see other users in their tenant (limited fields via views)
CREATE POLICY "users_select_tenant" ON users
    FOR SELECT USING (tenant_id = public.get_tenant_id());

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = public.get_user_id() AND tenant_id = public.get_tenant_id());

-- Insert handled by service role (registration)

-- ===========================================
-- LOCATIONS POLICIES
-- ===========================================
-- Anyone in tenant can view active locations
CREATE POLICY "locations_select_tenant" ON locations
    FOR SELECT USING (tenant_id = public.get_tenant_id() AND is_active = true);

-- Admins can manage locations
CREATE POLICY "locations_admin_all" ON locations
    FOR ALL USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- ===========================================
-- BOOTHS POLICIES
-- ===========================================
-- Anyone in tenant can view active booths
CREATE POLICY "booths_select_tenant" ON booths
    FOR SELECT USING (tenant_id = public.get_tenant_id() AND is_active = true);

-- Admins can manage booths
CREATE POLICY "booths_admin_all" ON booths
    FOR ALL USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- ===========================================
-- BOOKINGS POLICIES
-- ===========================================
-- Users can see their own bookings
CREATE POLICY "bookings_select_own" ON bookings
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Users can create bookings for themselves
CREATE POLICY "bookings_insert_own" ON bookings
    FOR INSERT WITH CHECK (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Users can update their own bookings (cancel, etc.)
CREATE POLICY "bookings_update_own" ON bookings
    FOR UPDATE USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Admins can see all bookings in tenant
CREATE POLICY "bookings_admin_select" ON bookings
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- ===========================================
-- TRANSACTIONS POLICIES
-- ===========================================
-- Users can see their own transactions
CREATE POLICY "transactions_select_own" ON transactions
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Insert/update handled by service role (payment webhooks)

-- ===========================================
-- DEVICES POLICIES
-- ===========================================
-- Only admins can view devices
CREATE POLICY "devices_admin_select" ON devices
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- Admins can manage devices
CREATE POLICY "devices_admin_all" ON devices
    FOR ALL USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- ===========================================
-- ACCESS LOGS POLICIES
-- ===========================================
-- Users can see their own access logs
CREATE POLICY "access_logs_select_own" ON access_logs
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Admins can see all access logs
CREATE POLICY "access_logs_admin_select" ON access_logs
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- ===========================================
-- CREDIT PACKAGES POLICIES
-- ===========================================
-- Anyone in tenant can view active packages
CREATE POLICY "credit_packages_select_tenant" ON credit_packages
    FOR SELECT USING (tenant_id = public.get_tenant_id() AND is_active = true);

-- Admins can manage packages
CREATE POLICY "credit_packages_admin_all" ON credit_packages
    FOR ALL USING (
        tenant_id = public.get_tenant_id()
        AND public.get_user_role() IN ('admin', 'super_admin')
    );

-- ===========================================
-- FAVORITES POLICIES
-- ===========================================
-- Users can see their own favorites
CREATE POLICY "favorites_select_own" ON favorites
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Users can add/remove their own favorites
CREATE POLICY "favorites_insert_own" ON favorites
    FOR INSERT WITH CHECK (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

CREATE POLICY "favorites_delete_own" ON favorites
    FOR DELETE USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- ===========================================
-- REVIEWS POLICIES
-- ===========================================
-- Anyone can see visible reviews
CREATE POLICY "reviews_select_visible" ON reviews
    FOR SELECT USING (tenant_id = public.get_tenant_id() AND is_visible = true);

-- Users can create reviews
CREATE POLICY "reviews_insert_own" ON reviews
    FOR INSERT WITH CHECK (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Users can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
    FOR UPDATE USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- ===========================================
-- NOTIFICATIONS POLICIES
-- ===========================================
-- Users can see their own notifications
CREATE POLICY "notifications_select_own" ON notifications
    FOR SELECT USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- Users can mark their notifications as read
CREATE POLICY "notifications_update_own" ON notifications
    FOR UPDATE USING (
        tenant_id = public.get_tenant_id()
        AND user_id = public.get_user_id()
    );

-- ===========================================
-- SERVICE ROLE BYPASS
-- ===========================================
-- Note: The service role key bypasses RLS by default in Supabase
-- This is used for:
-- - User registration
-- - Payment webhook processing
-- - Background jobs
-- - Admin operations from the API
