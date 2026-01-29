// ===========================================
// Booths Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { createBoothSchema, updateBoothSchema, boothFilterSchema, geoSearchSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware, operatorMiddleware } from '../middleware/auth.js';
import { ERROR_CODES } from '@silentbox/shared';

export const boothsRoutes = async (app: FastifyInstance) => {
  // List booths with filters
  app.get('/', async (request, reply) => {
    const filters = boothFilterSchema.parse(request.query);
    const offset = (filters.page - 1) * filters.limit;

    let query = supabaseAdmin
      .from('booths')
      .select('*, locations!inner(name, address, city)', { count: 'exact' })
      .eq('tenant_id', request.tenantId);

    if (filters.locationId) {
      query = query.eq('location_id', filters.locationId);
    }
    if (filters.minCapacity) {
      query = query.gte('capacity', filters.minCapacity);
    }
    if (filters.maxPrice) {
      query = query.lte('price_per_15min', filters.maxPrice);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
    }

    const { data: booths, error, count } = await query
      .range(offset, offset + filters.limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch booths',
        },
      });
    }

    return reply.send({
      success: true,
      data: booths,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
      },
    });
  });

  // Search nearby booths
  app.get('/nearby', async (request, reply) => {
    const params = geoSearchSchema.parse(request.query);
    const offset = (params.page - 1) * params.limit;

    // Use PostGIS for geo search
    const { data: booths, error, count } = await supabaseAdmin.rpc(
      'search_nearby_booths',
      {
        p_tenant_id: request.tenantId,
        p_lat: params.latitude,
        p_lng: params.longitude,
        p_radius_km: params.radiusKm,
        p_limit: params.limit,
        p_offset: offset,
      }
    );

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to search nearby booths',
        },
      });
    }

    return reply.send({
      success: true,
      data: booths,
      meta: {
        page: params.page,
        limit: params.limit,
        total: count || booths?.length || 0,
      },
    });
  });

  // Get single booth
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .select('*, locations(name, address, city, latitude, longitude, timezone, working_hours)')
      .eq('id', id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !booth) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Booth not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: booth,
    });
  });

  // Get booth availability
  app.get('/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { date } = request.query as { date: string };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Date parameter required in YYYY-MM-DD format',
        },
      });
    }

    // Get booth with location working hours
    const { data: booth, error: boothError } = await supabaseAdmin
      .from('booths')
      .select('*, locations(working_hours, timezone)')
      .eq('id', id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (boothError || !booth) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Booth not found',
        },
      });
    }

    // Get bookings for the date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('start_time, end_time')
      .eq('booth_id', id)
      .eq('tenant_id', request.tenantId)
      .in('status', ['pending', 'confirmed', 'active'])
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay);

    if (bookingsError) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch availability',
        },
      });
    }

    // Generate time slots (15-minute intervals)
    const slots = generateTimeSlots(date, booth.locations?.working_hours, bookings || []);

    return reply.send({
      success: true,
      data: {
        date,
        boothId: id,
        slots,
      },
    });
  });

  // Create booth (operator only)
  app.post('/', { preHandler: operatorMiddleware }, async (request, reply) => {
    const body = createBoothSchema.parse(request.body);

    // Verify location belongs to tenant
    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('id', body.locationId)
      .eq('tenant_id', request.tenantId)
      .single();

    if (locationError || !location) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid location',
        },
      });
    }

    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .insert({
        tenant_id: request.tenantId,
        location_id: body.locationId,
        name: body.name,
        capacity: body.capacity,
        price_per_15min: body.pricePer15Min,
        currency: body.currency,
        amenities: body.amenities,
        images: body.images,
        ttlock_lock_id: body.ttlockLockId,
        has_gateway: body.hasGateway,
        status: 'available',
      })
      .select()
      .single();

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create booth',
        },
      });
    }

    return reply.status(201).send({
      success: true,
      data: booth,
    });
  });

  // Update booth (operator only)
  app.patch('/:id', { preHandler: operatorMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateBoothSchema.parse(request.body);

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.pricePer15Min !== undefined) updateData.price_per_15min = body.pricePer15Min;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.ttlockLockId !== undefined) updateData.ttlock_lock_id = body.ttlockLockId;
    if (body.hasGateway !== undefined) updateData.has_gateway = body.hasGateway;

    const { data: booth, error } = await supabaseAdmin
      .from('booths')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error || !booth) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Booth not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: booth,
    });
  });

  // Delete booth (operator only)
  app.delete('/:id', { preHandler: operatorMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { error } = await supabaseAdmin
      .from('booths')
      .update({ status: 'maintenance' })
      .eq('id', id)
      .eq('tenant_id', request.tenantId);

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to delete booth',
        },
      });
    }

    return reply.send({
      success: true,
      data: { message: 'Booth deleted successfully' },
    });
  });
};

// Helper function to generate time slots
interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface Booking {
  start_time: string;
  end_time: string;
}

function generateTimeSlots(
  date: string,
  workingHours: Record<string, { open: string; close: string }> | null,
  bookings: Booking[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

  // Default working hours if not set
  const hours = workingHours?.[dayOfWeek] || { open: '08:00', close: '22:00' };

  const [openHour, openMin] = hours.open.split(':').map(Number);
  const [closeHour, closeMin] = hours.close.split(':').map(Number);

  let currentTime = new Date(`${date}T${hours.open}:00`);
  const endTime = new Date(`${date}T${hours.close}:00`);

  while (currentTime < endTime) {
    const slotStart = currentTime.toISOString();
    currentTime.setMinutes(currentTime.getMinutes() + 15);
    const slotEnd = currentTime.toISOString();

    // Check if slot overlaps with any booking
    const isBooked = bookings.some((booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      const slotStartDate = new Date(slotStart);
      const slotEndDate = new Date(slotEnd);

      return slotStartDate < bookingEnd && slotEndDate > bookingStart;
    });

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
      available: !isBooked,
    });
  }

  return slots;
}
