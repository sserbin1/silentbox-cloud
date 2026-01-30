// ===========================================
// Public Tenant API Routes (for Booking Portal)
// ===========================================
// These routes are public or require only customer auth
// Accessible via subdomain/custom domain

import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { supabaseAdmin as supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

// Type for decoded JWT payload
interface JWTPayload {
  sub: string;
  email: string;
  tenantId: string;
  iat: number;
  exp: number;
}

// Helper to optionally verify JWT (doesn't fail if no token)
async function optionalAuth(request: FastifyRequest): Promise<JWTPayload | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await request.server.jwt.verify<JWTPayload>(token);
    return decoded;
  } catch {
    return null;
  }
}

// Helper to get tenant by slug
async function getTenantBySlug(slug: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

// Helper to get tenant by custom domain
async function getTenantByDomain(domain: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('custom_domain', domain)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

export const tenantsPublicRoutes: FastifyPluginAsync = async (app) => {
  // ===========================================
  // Tenant Branding (Public)
  // ===========================================

  // Get tenant branding by slug
  app.get<{ Params: { slug: string } }>(
    '/tenants/:slug/branding',
    async (request, reply) => {
      const { slug } = request.params;

      try {
        const tenant = await getTenantBySlug(slug);

        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        // Return branding information
        const branding = {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,

          // Visual branding
          logo: tenant.logo_url,
          logoLight: tenant.logo_light_url,
          favicon: tenant.favicon_url,

          // Colors
          primaryColor: tenant.primary_color || '#6366F1',
          primaryColorLight: tenant.primary_color_light,
          primaryColorDark: tenant.primary_color_dark,
          accentColor: tenant.accent_color || '#F59E0B',

          // Typography
          fontFamily: tenant.font_family,
          headingFontFamily: tenant.heading_font_family,

          // Content
          tagline: tenant.tagline,
          description: tenant.description,
          heroImage: tenant.hero_image_url,

          // Contact
          supportEmail: tenant.support_email,
          supportPhone: tenant.support_phone,

          // Social
          website: tenant.website_url,
          instagram: tenant.instagram_handle,
          facebook: tenant.facebook_handle,

          // Custom domain
          customDomain: tenant.custom_domain,

          // Feature flags
          features: {
            showPricing: tenant.feature_show_pricing ?? true,
            allowGuestBooking: tenant.feature_allow_guest_booking ?? true,
            requirePhone: tenant.feature_require_phone ?? false,
            showReviews: tenant.feature_show_reviews ?? true,
            showMap: tenant.feature_show_map ?? true,
          },

          // Legal
          termsUrl: tenant.terms_url,
          privacyUrl: tenant.privacy_url,
        };

        return reply.send({
          success: true,
          data: branding,
        });
      } catch (error) {
        logger.error('Error fetching tenant branding:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch tenant branding',
        });
      }
    }
  );

  // Get tenant by custom domain
  app.get<{ Params: { domain: string } }>(
    '/tenants/by-domain/:domain',
    async (request, reply) => {
      const { domain } = request.params;

      try {
        const tenant = await getTenantByDomain(domain);

        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found for this domain',
          });
        }

        // Return minimal branding info
        return reply.send({
          success: true,
          data: {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
          },
        });
      } catch (error) {
        logger.error('Error fetching tenant by domain:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch tenant',
        });
      }
    }
  );

  // ===========================================
  // Public Booths (by tenant slug)
  // ===========================================

  // List booths for a tenant
  app.get<{
    Params: { slug: string };
    Querystring: {
      locationId?: string;
      type?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
    };
  }>('/tenants/:slug/booths', async (request, reply) => {
    const { slug } = request.params;
    const { locationId, type, date, startTime, endTime } = request.query;

    try {
      const tenant = await getTenantBySlug(slug);
      if (!tenant) {
        return reply.code(404).send({
          success: false,
          error: 'Tenant not found',
        });
      }

      let query = supabase
        .from('booths')
        .select(
          `
          *,
          location:locations!booths_location_id_fkey(id, name, address, city, latitude, longitude)
        `
        )
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data: booths, error } = await query;

      if (error) {
        logger.error('Error fetching booths:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch booths',
        });
      }

      // Transform to API format
      const transformedBooths = booths?.map((booth) => ({
        id: booth.id,
        tenantId: booth.tenant_id,
        locationId: booth.location_id,
        name: booth.name,
        description: booth.description,
        type: booth.type,
        capacity: booth.capacity,
        pricePerHour: booth.price_per_hour,
        currency: booth.currency || 'PLN',
        amenities: booth.amenities || [],
        images: booth.images || [],
        isActive: booth.is_active,
        location: booth.location
          ? {
              id: booth.location.id,
              name: booth.location.name,
              address: booth.location.address,
              city: booth.location.city,
              latitude: booth.location.latitude,
              longitude: booth.location.longitude,
            }
          : undefined,
        averageRating: booth.average_rating,
        reviewCount: booth.review_count,
      }));

      return reply.send({
        success: true,
        data: transformedBooths,
      });
    } catch (error) {
      logger.error('Error in booths endpoint:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch booths',
      });
    }
  });

  // Get single booth
  app.get<{ Params: { slug: string; boothId: string } }>(
    '/tenants/:slug/booths/:boothId',
    async (request, reply) => {
      const { slug, boothId } = request.params;

      try {
        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        const { data: booth, error } = await supabase
          .from('booths')
          .select(
            `
            *,
            location:locations!booths_location_id_fkey(*)
          `
          )
          .eq('id', boothId)
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .single();

        if (error || !booth) {
          return reply.code(404).send({
            success: false,
            error: 'Booth not found',
          });
        }

        return reply.send({
          success: true,
          data: {
            id: booth.id,
            tenantId: booth.tenant_id,
            locationId: booth.location_id,
            name: booth.name,
            description: booth.description,
            type: booth.type,
            capacity: booth.capacity,
            pricePerHour: booth.price_per_hour,
            currency: booth.currency || 'PLN',
            amenities: booth.amenities || [],
            images: booth.images || [],
            isActive: booth.is_active,
            location: booth.location
              ? {
                  id: booth.location.id,
                  name: booth.location.name,
                  address: booth.location.address,
                  city: booth.location.city,
                  latitude: booth.location.latitude,
                  longitude: booth.location.longitude,
                  timezone: booth.location.timezone,
                }
              : undefined,
            averageRating: booth.average_rating,
            reviewCount: booth.review_count,
          },
        });
      } catch (error) {
        logger.error('Error fetching booth:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch booth',
        });
      }
    }
  );

  // ===========================================
  // Public Locations (by tenant slug)
  // ===========================================

  app.get<{ Params: { slug: string } }>(
    '/tenants/:slug/locations',
    async (request, reply) => {
      const { slug } = request.params;

      try {
        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        const { data: locations, error } = await supabase
          .from('locations')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('name');

        if (error) {
          logger.error('Error fetching locations:', error);
          return reply.code(500).send({
            success: false,
            error: 'Failed to fetch locations',
          });
        }

        // Get booth counts per location
        const locationIds = locations?.map((l) => l.id) || [];
        const { data: boothCounts } = await supabase
          .from('booths')
          .select('location_id')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .in('location_id', locationIds);

        const countMap = boothCounts?.reduce((acc: Record<string, number>, booth) => {
          acc[booth.location_id] = (acc[booth.location_id] || 0) + 1;
          return acc;
        }, {});

        const transformedLocations = locations?.map((loc) => ({
          id: loc.id,
          tenantId: loc.tenant_id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          country: loc.country,
          postalCode: loc.postal_code,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timezone: loc.timezone,
          openingHours: loc.opening_hours,
          images: loc.images,
          boothCount: countMap?.[loc.id] || 0,
        }));

        return reply.send({
          success: true,
          data: transformedLocations,
        });
      } catch (error) {
        logger.error('Error in locations endpoint:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch locations',
        });
      }
    }
  );

  // ===========================================
  // Reviews (by booth)
  // ===========================================

  app.get<{ Params: { slug: string; boothId: string } }>(
    '/tenants/:slug/booths/:boothId/reviews',
    async (request, reply) => {
      const { slug, boothId } = request.params;

      try {
        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        const { data: reviews, error } = await supabase
          .from('reviews')
          .select(
            `
            id,
            rating,
            comment,
            created_at,
            user:users!reviews_user_id_fkey(id, name)
          `
          )
          .eq('booth_id', boothId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          logger.error('Error fetching reviews:', error);
          return reply.code(500).send({
            success: false,
            error: 'Failed to fetch reviews',
          });
        }

        const transformedReviews = reviews?.map((review) => {
          // Supabase returns joined data as array, get first element
          const userData = Array.isArray(review.user) ? review.user[0] : review.user;
          return {
            id: review.id,
            boothId,
            userId: userData?.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.created_at,
            user: userData
              ? {
                  name: userData.name,
                }
              : undefined,
          };
        });

        return reply.send({
          success: true,
          data: transformedReviews,
        });
      } catch (error) {
        logger.error('Error in reviews endpoint:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch reviews',
        });
      }
    }
  );

  // ===========================================
  // Guest Booking (no auth required)
  // ===========================================

  app.post<{
    Params: { slug: string };
    Body: {
      boothId: string;
      date: string;
      startTime: string;
      endTime: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
    };
  }>('/tenants/:slug/bookings', async (request, reply) => {
    const { slug } = request.params;
    const { boothId, date, startTime, endTime, customerName, customerEmail, customerPhone, notes } =
      request.body;

    try {
      // Optionally get authenticated user
      const user = await optionalAuth(request);

      const tenant = await getTenantBySlug(slug);
      if (!tenant) {
        return reply.code(404).send({
          success: false,
          error: 'Tenant not found',
        });
      }

      // Check if guest booking is allowed
      if (!tenant.feature_allow_guest_booking && !user) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required for booking',
        });
      }

      // Get booth to calculate price
      const { data: booth, error: boothError } = await supabase
        .from('booths')
        .select('*')
        .eq('id', boothId)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .single();

      if (boothError || !booth) {
        return reply.code(404).send({
          success: false,
          error: 'Booth not found',
        });
      }

      // Calculate duration and price
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const durationHours =
        (endHours * 60 + endMinutes - (startHours * 60 + startMinutes)) / 60;
      const totalPrice = booth.price_per_hour * durationHours;

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('booth_id', boothId)
        .eq('date', date)
        .not('status', 'in', '("cancelled","completed")')
        .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

      if (conflicts && conflicts.length > 0) {
        return reply.code(409).send({
          success: false,
          error: 'This time slot is not available',
        });
      }

      // Create booking
      const bookingData = {
        tenant_id: tenant.id,
        booth_id: boothId,
        user_id: user?.sub || null,
        date,
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice,
        currency: booth.currency || 'PLN',
        status: 'pending',
        guest_name: customerName,
        guest_email: customerEmail,
        guest_phone: customerPhone,
        notes,
      };

      const { data: booking, error: createError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (createError || !booking) {
        logger.error('Error creating booking:', createError);
        return reply.code(500).send({
          success: false,
          error: 'Failed to create booking',
        });
      }

      return reply.code(201).send({
        success: true,
        data: {
          id: booking.id,
          boothId: booking.booth_id,
          tenantId: booking.tenant_id,
          status: booking.status,
          date: booking.date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          totalPrice: booking.total_price,
          currency: booking.currency,
          createdAt: booking.created_at,
        },
      });
    } catch (error) {
      logger.error('Error creating booking:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create booking',
      });
    }
  });

  // ===========================================
  // Customer Authentication (tenant-scoped)
  // ===========================================

  // Login
  app.post<{
    Params: { slug: string };
    Body: { email: string; password: string };
  }>('/tenants/:slug/auth/login', async (request, reply) => {
    const { slug } = request.params;
    const { email, password } = request.body;

    try {
      const tenant = await getTenantBySlug(slug);
      if (!tenant) {
        return reply.code(404).send({
          success: false,
          error: 'Tenant not found',
        });
      }

      // Find user by email and tenant
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('tenant_id', tenant.id)
        .single();

      if (error || !user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = app.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          tenantId: tenant.id,
          role: user.role || 'customer',
        },
        { expiresIn: '7d' }
      );

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Error during login:', error);
      return reply.code(500).send({
        success: false,
        error: 'Login failed',
      });
    }
  });

  // Register
  app.post<{
    Params: { slug: string };
    Body: { email: string; password: string; name: string; phone?: string };
  }>('/tenants/:slug/auth/register', async (request, reply) => {
    const { slug } = request.params;
    const { email, password, name, phone } = request.body;

    try {
      const tenant = await getTenantBySlug(slug);
      if (!tenant) {
        return reply.code(404).send({
          success: false,
          error: 'Tenant not found',
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('tenant_id', tenant.id)
        .single();

      if (existingUser) {
        return reply.code(409).send({
          success: false,
          error: 'An account with this email already exists',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          tenant_id: tenant.id,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name,
          phone,
          role: 'customer',
        })
        .select()
        .single();

      if (error || !user) {
        logger.error('Error creating user:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to create account',
        });
      }

      // Generate JWT token
      const token = app.jwt.sign(
        {
          sub: user.id,
          email: user.email,
          tenantId: tenant.id,
          role: user.role,
        },
        { expiresIn: '7d' }
      );

      return reply.code(201).send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
          },
          token,
        },
      });
    } catch (error) {
      logger.error('Error during registration:', error);
      return reply.code(500).send({
        success: false,
        error: 'Registration failed',
      });
    }
  });

  // Get current user
  app.get<{ Params: { slug: string } }>(
    '/tenants/:slug/auth/me',
    async (request, reply) => {
      const { slug } = request.params;

      try {
        // Verify JWT
        await request.jwtVerify();

        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, phone')
          .eq('id', (request as any).user.sub)
          .eq('tenant_id', tenant.id)
          .single();

        if (error || !user) {
          return reply.code(404).send({
            success: false,
            error: 'User not found',
          });
        }

        return reply.send({
          success: true,
          data: user,
        });
      } catch (err) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }
    }
  );

  // Get user's bookings
  app.get<{ Params: { slug: string } }>(
    '/tenants/:slug/bookings/my',
    async (request, reply) => {
      const { slug } = request.params;

      try {
        // Verify JWT
        await request.jwtVerify();

        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        const { data: bookings, error } = await supabase
          .from('bookings')
          .select(`
            *,
            booth:booths!bookings_booth_id_fkey(
              id, name, type, images,
              location:locations!booths_location_id_fkey(id, name, city)
            )
          `)
          .eq('user_id', (request as any).user.sub)
          .eq('tenant_id', tenant.id)
          .order('date', { ascending: false })
          .order('start_time', { ascending: false });

        if (error) {
          logger.error('Error fetching bookings:', error);
          return reply.code(500).send({
            success: false,
            error: 'Failed to fetch bookings',
          });
        }

        const transformedBookings = bookings?.map((b) => ({
          id: b.id,
          boothId: b.booth_id,
          tenantId: b.tenant_id,
          userId: b.user_id,
          status: b.status,
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          totalPrice: b.total_price,
          currency: b.currency,
          accessCode: b.access_code,
          booth: b.booth ? {
            id: b.booth.id,
            name: b.booth.name,
            type: b.booth.type,
            images: b.booth.images,
            location: b.booth.location,
          } : undefined,
          createdAt: b.created_at,
        }));

        return reply.send({
          success: true,
          data: transformedBookings,
        });
      } catch (err) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }
    }
  );

  // Get single booking
  app.get<{ Params: { slug: string; bookingId: string } }>(
    '/tenants/:slug/bookings/:bookingId',
    async (request, reply) => {
      const { slug, bookingId } = request.params;

      try {
        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        // Try to verify JWT (optional for guest bookings)
        let userId: string | null = null;
        try {
          await request.jwtVerify();
          userId = (request as any).user?.sub;
        } catch {
          // Guest access
        }

        const { data: booking, error } = await supabase
          .from('bookings')
          .select(`
            *,
            booth:booths!bookings_booth_id_fkey(
              id, name, type, description, images, price_per_hour, currency, amenities,
              location:locations!booths_location_id_fkey(id, name, address, city)
            )
          `)
          .eq('id', bookingId)
          .eq('tenant_id', tenant.id)
          .single();

        if (error || !booking) {
          return reply.code(404).send({
            success: false,
            error: 'Booking not found',
          });
        }

        // Verify ownership (user_id or guest email match)
        if (booking.user_id && booking.user_id !== userId) {
          return reply.code(403).send({
            success: false,
            error: 'Access denied',
          });
        }

        return reply.send({
          success: true,
          data: {
            id: booking.id,
            boothId: booking.booth_id,
            tenantId: booking.tenant_id,
            userId: booking.user_id,
            status: booking.status,
            date: booking.date,
            startTime: booking.start_time,
            endTime: booking.end_time,
            totalPrice: booking.total_price,
            currency: booking.currency,
            accessCode: booking.access_code,
            booth: booking.booth ? {
              id: booking.booth.id,
              name: booking.booth.name,
              type: booking.booth.type,
              description: booking.booth.description,
              images: booking.booth.images,
              pricePerHour: booking.booth.price_per_hour,
              currency: booking.booth.currency,
              amenities: booking.booth.amenities,
              location: booking.booth.location,
            } : undefined,
            createdAt: booking.created_at,
          },
        });
      } catch (error) {
        logger.error('Error fetching booking:', error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to fetch booking',
        });
      }
    }
  );

  // Cancel booking
  app.post<{ Params: { slug: string; bookingId: string } }>(
    '/tenants/:slug/bookings/:bookingId/cancel',
    async (request, reply) => {
      const { slug, bookingId } = request.params;

      try {
        // Verify JWT
        await request.jwtVerify();

        const tenant = await getTenantBySlug(slug);
        if (!tenant) {
          return reply.code(404).send({
            success: false,
            error: 'Tenant not found',
          });
        }

        // Get booking
        const { data: booking, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .eq('tenant_id', tenant.id)
          .eq('user_id', (request as any).user.sub)
          .single();

        if (error || !booking) {
          return reply.code(404).send({
            success: false,
            error: 'Booking not found',
          });
        }

        // Check if cancellable
        if (!['pending', 'confirmed'].includes(booking.status)) {
          return reply.code(400).send({
            success: false,
            error: 'This booking cannot be cancelled',
          });
        }

        // Cancel
        const { data: updated, error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
          .select()
          .single();

        if (updateError || !updated) {
          return reply.code(500).send({
            success: false,
            error: 'Failed to cancel booking',
          });
        }

        return reply.send({
          success: true,
          data: {
            id: updated.id,
            status: updated.status,
          },
        });
      } catch (err) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }
    }
  );
};
