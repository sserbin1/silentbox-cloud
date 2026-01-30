// ===========================================
// Availability Service - Real-time Updates
// ===========================================

import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import type { SocketEvents } from '../socket/index.js';

interface BoothAvailability {
  boothId: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentBookingId?: string;
  nextAvailableAt?: string;
}

interface LocationAvailability {
  locationId: string;
  totalBooths: number;
  availableBooths: number;
  occupiedBooths: number;
}

class AvailabilityService {
  private socketEvents: SocketEvents | null = null;

  setSocketEvents(socketEvents: SocketEvents) {
    this.socketEvents = socketEvents;
  }

  // Calculate booth availability status based on current time and bookings
  async getBoothStatus(boothId: string): Promise<BoothAvailability> {
    const now = new Date();

    // Check for active booking
    const { data: activeBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, end_time')
      .eq('booth_id', boothId)
      .eq('status', 'active')
      .lte('start_time', now.toISOString())
      .gte('end_time', now.toISOString())
      .single();

    if (activeBooking) {
      return {
        boothId,
        status: 'occupied',
        currentBookingId: activeBooking.id,
        nextAvailableAt: activeBooking.end_time,
      };
    }

    // Check for upcoming booking (within next 15 minutes)
    const soonThreshold = new Date(now.getTime() + 15 * 60 * 1000);
    const { data: upcomingBooking } = await supabaseAdmin
      .from('bookings')
      .select('id, start_time')
      .eq('booth_id', boothId)
      .in('status', ['confirmed'])
      .gte('start_time', now.toISOString())
      .lte('start_time', soonThreshold.toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .single();

    // Check booth status
    const { data: booth } = await supabaseAdmin
      .from('booths')
      .select('status')
      .eq('id', boothId)
      .single();

    if (booth?.status === 'maintenance') {
      return {
        boothId,
        status: 'maintenance',
      };
    }

    // Find next available time slot
    const { data: nextBooking } = await supabaseAdmin
      .from('bookings')
      .select('start_time')
      .eq('booth_id', boothId)
      .in('status', ['confirmed', 'active'])
      .gte('start_time', now.toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .single();

    return {
      boothId,
      status: 'available',
      nextAvailableAt: nextBooking?.start_time,
    };
  }

  // Get location-wide availability
  async getLocationAvailability(locationId: string): Promise<LocationAvailability> {
    const now = new Date();

    // Get all booths for this location
    const { data: booths } = await supabaseAdmin
      .from('booths')
      .select('id, status')
      .eq('location_id', locationId)
      .eq('status', 'available');

    if (!booths || booths.length === 0) {
      return {
        locationId,
        totalBooths: 0,
        availableBooths: 0,
        occupiedBooths: 0,
      };
    }

    const boothIds = booths.map((b) => b.id);

    // Get currently occupied booths
    const { data: activeBookings } = await supabaseAdmin
      .from('bookings')
      .select('booth_id')
      .in('booth_id', boothIds)
      .eq('status', 'active')
      .lte('start_time', now.toISOString())
      .gte('end_time', now.toISOString());

    const occupiedCount = activeBookings?.length || 0;

    return {
      locationId,
      totalBooths: booths.length,
      availableBooths: booths.length - occupiedCount,
      occupiedBooths: occupiedCount,
    };
  }

  // Broadcast booth status update
  async broadcastBoothUpdate(boothId: string) {
    if (!this.socketEvents) {
      logger.warn('Socket events not initialized');
      return;
    }

    try {
      const availability = await this.getBoothStatus(boothId);

      this.socketEvents.emitBoothUpdate(boothId, {
        status: availability.status,
        nextAvailable: availability.nextAvailableAt,
      });

      // Also get and broadcast location update
      const { data: booth } = await supabaseAdmin
        .from('booths')
        .select('location_id')
        .eq('id', boothId)
        .single();

      if (booth?.location_id) {
        await this.broadcastLocationUpdate(booth.location_id);
      }

      logger.debug({ boothId, availability }, 'Booth availability broadcasted');
    } catch (error) {
      logger.error({ error, boothId }, 'Failed to broadcast booth update');
    }
  }

  // Broadcast location-wide availability update
  async broadcastLocationUpdate(locationId: string) {
    if (!this.socketEvents) {
      logger.warn('Socket events not initialized');
      return;
    }

    try {
      const availability = await this.getLocationAvailability(locationId);

      this.socketEvents.emitLocationUpdate(locationId, {
        availableBooths: availability.availableBooths,
      });

      logger.debug({ locationId, availability }, 'Location availability broadcasted');
    } catch (error) {
      logger.error({ error, locationId }, 'Failed to broadcast location update');
    }
  }

  // Called when a booking is created
  async onBookingCreated(bookingId: string, boothId: string, tenantId: string) {
    await this.broadcastBoothUpdate(boothId);

    // Get booking details for operator notification
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, booths(name), users(full_name)')
      .eq('id', bookingId)
      .single();

    if (booking && this.socketEvents) {
      this.socketEvents.emitNewBooking(tenantId, {
        id: booking.id,
        boothName: booking.booths?.name || 'Unknown',
        userName: booking.users?.full_name || 'Guest',
        startTime: booking.start_time,
      });
    }
  }

  // Called when a booking starts (becomes active)
  async onBookingStarted(bookingId: string, boothId: string, userId: string) {
    await this.broadcastBoothUpdate(boothId);

    if (this.socketEvents) {
      this.socketEvents.emitBookingUpdate(userId, {
        id: bookingId,
        status: 'active',
      });
    }
  }

  // Called when a booking ends
  async onBookingEnded(bookingId: string, boothId: string, userId: string) {
    await this.broadcastBoothUpdate(boothId);

    if (this.socketEvents) {
      this.socketEvents.emitBookingUpdate(userId, {
        id: bookingId,
        status: 'completed',
      });
    }
  }

  // Called when a booking is cancelled
  async onBookingCancelled(bookingId: string, boothId: string, userId: string) {
    await this.broadcastBoothUpdate(boothId);

    if (this.socketEvents) {
      this.socketEvents.emitBookingUpdate(userId, {
        id: bookingId,
        status: 'cancelled',
      });
    }
  }

  // Called when a booking is extended
  async onBookingExtended(bookingId: string, boothId: string, userId: string, newEndTime: string) {
    await this.broadcastBoothUpdate(boothId);

    if (this.socketEvents) {
      this.socketEvents.emitBookingUpdate(userId, {
        id: bookingId,
        status: 'active',
        endTime: newEndTime,
      });
    }
  }
}

export const availabilityService = new AvailabilityService();
