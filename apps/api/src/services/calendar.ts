// ===========================================
// Google Calendar Integration Service
// ===========================================

import { logger } from '../lib/logger.js';

interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  reminders?: {
    useDefault?: boolean;
    overrides?: { method: string; minutes: number }[];
  };
}

interface CalendarCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<CalendarCredentials | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        logger.error('Failed to exchange code for tokens');
        return null;
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    } catch (error) {
      logger.error({ error }, 'Error exchanging code for tokens');
      return null;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date } | null> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        logger.error('Failed to refresh access token');
        return null;
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    } catch (error) {
      logger.error({ error }, 'Error refreshing access token');
      return null;
    }
  }

  // Create calendar event
  async createEvent(
    accessToken: string,
    event: CalendarEvent
  ): Promise<{ eventId: string } | null> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.summary,
            description: event.description,
            location: event.location,
            start: {
              dateTime: event.start.toISOString(),
              timeZone: 'Europe/Warsaw',
            },
            end: {
              dateTime: event.end.toISOString(),
              timeZone: 'Europe/Warsaw',
            },
            reminders: event.reminders || {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 30 },
                { method: 'popup', minutes: 10 },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error }, 'Failed to create calendar event');
        return null;
      }

      const data = await response.json();
      return { eventId: data.id };
    } catch (error) {
      logger.error({ error }, 'Error creating calendar event');
      return null;
    }
  }

  // Update calendar event
  async updateEvent(
    accessToken: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<boolean> {
    try {
      const body: Record<string, unknown> = {};

      if (updates.summary) body.summary = updates.summary;
      if (updates.description) body.description = updates.description;
      if (updates.location) body.location = updates.location;
      if (updates.start) {
        body.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'Europe/Warsaw',
        };
      }
      if (updates.end) {
        body.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'Europe/Warsaw',
        };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        logger.error('Failed to update calendar event');
        return false;
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Error updating calendar event');
      return false;
    }
  }

  // Delete calendar event
  async deleteEvent(accessToken: string, eventId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok && response.status !== 404) {
        logger.error('Failed to delete calendar event');
        return false;
      }

      return true;
    } catch (error) {
      logger.error({ error }, 'Error deleting calendar event');
      return false;
    }
  }

  // Create booking event helper
  createBookingEvent(booking: {
    boothName: string;
    locationName: string;
    locationAddress: string;
    startTime: Date;
    endTime: Date;
    accessCode?: string;
  }): CalendarEvent {
    const description = `Silentbox Booking

Booth: ${booking.boothName}
Location: ${booking.locationName}
${booking.accessCode ? `\nAccess Code: ${booking.accessCode}` : ''}

Enjoy your private workspace!`;

    return {
      summary: `Silentbox: ${booking.boothName}`,
      description,
      location: booking.locationAddress,
      start: booking.startTime,
      end: booking.endTime,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };
  }
}

export const calendarService = new GoogleCalendarService();
