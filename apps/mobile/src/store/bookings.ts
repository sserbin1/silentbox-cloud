// ===========================================
// Bookings Store - Zustand
// ===========================================

import { create } from 'zustand';
import { bookingsApi, accessApi } from '../lib/api';

interface Booth {
  id: string;
  name: string;
  images?: string[];
  locations?: {
    name: string;
    address: string;
  };
}

interface Booking {
  id: string;
  boothId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  accessCode?: string;
  booth?: Booth;
}

interface BookingsState {
  bookings: Booking[];
  activeBooking: Booking | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookings: (status?: string) => Promise<void>;
  fetchActiveBooking: () => Promise<void>;
  createBooking: (
    boothId: string,
    startTime: string,
    durationMinutes: number
  ) => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  extendBooking: (
    bookingId: string,
    additionalMinutes: number
  ) => Promise<{ success: boolean; error?: string }>;
  cancelBooking: (
    bookingId: string,
    reason?: string
  ) => Promise<{ success: boolean; refundAmount?: number; error?: string }>;
  unlockDoor: (
    bookingId: string
  ) => Promise<{ success: boolean; method?: string; credentials?: any; error?: string }>;
}

export const useBookingsStore = create<BookingsState>((set, get) => ({
  bookings: [],
  activeBooking: null,
  isLoading: false,
  error: null,

  fetchBookings: async (status) => {
    set({ isLoading: true, error: null });

    try {
      const response = await bookingsApi.getAll(status);

      if (response.success && response.data) {
        set({ bookings: response.data });
      } else {
        set({ error: response.error?.message || 'Failed to fetch bookings' });
      }
    } catch (error) {
      set({ error: 'Network error. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveBooking: async () => {
    try {
      const response = await bookingsApi.getAll('active');

      if (response.success && response.data && response.data.length > 0) {
        set({ activeBooking: response.data[0] });
      } else {
        // Check for confirmed bookings starting soon
        const confirmedResponse = await bookingsApi.getAll('confirmed');
        if (confirmedResponse.success && confirmedResponse.data) {
          const now = new Date();
          const upcoming = confirmedResponse.data.find((booking: Booking) => {
            const startTime = new Date(booking.startTime);
            const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);
            return diffMinutes <= 30 && diffMinutes >= -5; // Within 30 min before to 5 min after start
          });

          if (upcoming) {
            set({ activeBooking: upcoming });
            return;
          }
        }

        set({ activeBooking: null });
      }
    } catch (error) {
      console.error('Failed to fetch active booking:', error);
    }
  },

  createBooking: async (boothId, startTime, durationMinutes) => {
    set({ isLoading: true });

    try {
      const response = await bookingsApi.create({ boothId, startTime, durationMinutes });

      if (response.success && response.data) {
        // Add to bookings list
        set((state) => ({
          bookings: [response.data, ...state.bookings],
        }));

        return { success: true, booking: response.data };
      }

      return {
        success: false,
        error: response.error?.message || 'Failed to create booking',
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      set({ isLoading: false });
    }
  },

  extendBooking: async (bookingId, additionalMinutes) => {
    try {
      const response = await bookingsApi.extend(bookingId, additionalMinutes);

      if (response.success && response.data) {
        // Update booking in list
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, ...response.data } : b
          ),
          activeBooking:
            state.activeBooking?.id === bookingId
              ? { ...state.activeBooking, ...response.data }
              : state.activeBooking,
        }));

        return { success: true };
      }

      return {
        success: false,
        error: response.error?.message || 'Failed to extend booking',
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await bookingsApi.cancel(bookingId, reason);

      if (response.success && response.data) {
        // Update booking status
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
          ),
          activeBooking:
            state.activeBooking?.id === bookingId ? null : state.activeBooking,
        }));

        return { success: true, refundAmount: response.data.refundAmount };
      }

      return {
        success: false,
        error: response.error?.message || 'Failed to cancel booking',
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  unlockDoor: async (bookingId) => {
    try {
      const response = await accessApi.unlock(bookingId);

      if (response.success && response.data) {
        return {
          success: true,
          method: response.data.method,
          credentials: response.data.bluetoothCredentials,
        };
      }

      return {
        success: false,
        error: response.error?.message || 'Failed to unlock door',
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },
}));
