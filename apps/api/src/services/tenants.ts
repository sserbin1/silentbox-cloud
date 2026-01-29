// ===========================================
// Tenant Management Service (Super Admin)
// ===========================================

import { supabaseAdmin as supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

interface CreateTenantInput {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  settings?: Record<string, unknown>;
}

interface UpdateTenantInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  country?: string;
  settings?: Record<string, unknown>;
  status?: 'active' | 'suspended' | 'pending';
}

interface TenantStats {
  totalUsers: number;
  totalLocations: number;
  totalBooths: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
}

export class TenantsService {
  // Create a new tenant
  async createTenant(input: CreateTenantInput): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Generate API key for the tenant
      const apiKey = `sb_${crypto.randomBytes(32).toString('hex')}`;

      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: input.name,
          slug: input.slug,
          contact_email: input.contactEmail,
          contact_phone: input.contactPhone,
          address: input.address,
          city: input.city,
          country: input.country || 'PL',
          settings: input.settings || {},
          api_key: apiKey,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error({ error }, 'Failed to create tenant');
        return { success: false, error: error.message };
      }

      logger.info({ tenantId: data.id, slug: input.slug }, 'Tenant created');
      return { success: true, data };
    } catch (error) {
      logger.error({ error }, 'Error creating tenant');
      return { success: false, error: 'Failed to create tenant' };
    }
  }

  // Get all tenants
  async getAllTenants(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch tenants' };
    }
  }

  // Get tenant by ID
  async getTenantById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch tenant' };
    }
  }

  // Get tenant by slug
  async getTenantBySlug(slug: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to fetch tenant' };
    }
  }

  // Update tenant
  async updateTenant(
    id: string,
    input: UpdateTenantInput
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {};

      if (input.name) updateData.name = input.name;
      if (input.contactEmail) updateData.contact_email = input.contactEmail;
      if (input.contactPhone !== undefined) updateData.contact_phone = input.contactPhone;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.city !== undefined) updateData.city = input.city;
      if (input.country !== undefined) updateData.country = input.country;
      if (input.settings) updateData.settings = input.settings;
      if (input.status) updateData.status = input.status;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info({ tenantId: id }, 'Tenant updated');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update tenant' };
    }
  }

  // Activate tenant
  async activateTenant(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateTenant(id, { status: 'active' });
  }

  // Suspend tenant
  async suspendTenant(id: string): Promise<{ success: boolean; error?: string }> {
    return this.updateTenant(id, { status: 'suspended' });
  }

  // Get tenant statistics
  async getTenantStats(tenantId: string): Promise<{ success: boolean; data?: TenantStats; error?: string }> {
    try {
      // Get users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get locations count
      const { count: locationsCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get booths count
      const { count: boothsCount } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get bookings count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      // Get active bookings count
      const { count: activeBookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      // Get total revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('tenant_id', tenantId)
        .eq('type', 'credit_purchase')
        .eq('status', 'completed');

      const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

      return {
        success: true,
        data: {
          totalUsers: usersCount || 0,
          totalLocations: locationsCount || 0,
          totalBooths: boothsCount || 0,
          totalBookings: bookingsCount || 0,
          activeBookings: activeBookingsCount || 0,
          totalRevenue,
        },
      };
    } catch (error) {
      logger.error({ error, tenantId }, 'Failed to get tenant stats');
      return { success: false, error: 'Failed to get tenant statistics' };
    }
  }

  // Regenerate API key
  async regenerateApiKey(tenantId: string): Promise<{ success: boolean; apiKey?: string; error?: string }> {
    try {
      const newApiKey = `sb_${crypto.randomBytes(32).toString('hex')}`;

      const { error } = await supabase
        .from('tenants')
        .update({ api_key: newApiKey, updated_at: new Date().toISOString() })
        .eq('id', tenantId);

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info({ tenantId }, 'API key regenerated');
      return { success: true, apiKey: newApiKey };
    } catch (error) {
      return { success: false, error: 'Failed to regenerate API key' };
    }
  }

  // Delete tenant (soft delete by setting status to 'deleted')
  async deleteTenant(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info({ tenantId: id }, 'Tenant deleted');
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete tenant' };
    }
  }
}

export const tenantsService = new TenantsService();
