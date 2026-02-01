// ===========================================
// Locations Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { createLocationSchema, updateLocationSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware, operatorMiddleware } from '../middleware/auth.js';
import { ERROR_CODES } from '@silentbox/shared';

export const locationsRoutes = async (app: FastifyInstance) => {
  // List locations (public - users can see locations)
  app.get('/', async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
    const offset = (page - 1) * limit;

    const { data: locations, error, count } = await supabaseAdmin
      .from('locations')
      .select('*', { count: 'exact' })
      .eq('tenant_id', request.tenantId)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch locations',
        },
      });
    }

    return reply.send({
      success: true,
      data: locations,
      meta: {
        page,
        limit,
        total: count || 0,
      },
    });
  });

  // Get single location
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data: location, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !location) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Location not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: location,
    });
  });

  // Create location (operator only)
  app.post('/', { preHandler: operatorMiddleware }, async (request, reply) => {
    const body = createLocationSchema.parse(request.body);

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: location, error } = await supabaseAdmin
      .from('locations')
      .insert({
        tenant_id: request.tenantId,
        name: body.name,
        slug: slug,
        address: body.address,
        city: body.city || 'Unknown',
        country: body.country || 'Poland',
        latitude: body.latitude,
        longitude: body.longitude,
        timezone: body.timezone,
        opening_hours: body.workingHours || {},
        amenities: body.amenities,
        images: body.images,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Location create error:', JSON.stringify(error));
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create location',
          details: error.message,
        },
      });
    }

    return reply.status(201).send({
      success: true,
      data: location,
    });
  });

  // Update location (operator only)
  app.patch('/:id', { preHandler: operatorMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateLocationSchema.parse(request.body);

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.workingHours !== undefined) updateData.opening_hours = body.workingHours;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.images !== undefined) updateData.images = body.images;

    const { data: location, error } = await supabaseAdmin
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error || !location) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Location not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: location,
    });
  });

  // Delete location (operator only)
  app.delete('/:id', { preHandler: operatorMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('locations')
      .update({ is_active: false })
      .eq('id', id)
      .eq('tenant_id', request.tenantId);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to delete location',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'Location deleted successfully' },
    });
  });
};
