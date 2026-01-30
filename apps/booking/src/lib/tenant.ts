import { headers } from 'next/headers';
import { TenantBranding } from '@/types/tenant';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get tenant slug from request context
 * Checks: subdomain, custom domain header, query param
 */
export async function getTenantSlug(): Promise<string | null> {
  const headersList = headers();

  // Check for custom domain header (set by reverse proxy like Caddy/Nginx)
  const customDomain = headersList.get('x-tenant-domain');
  if (customDomain) {
    // Resolve custom domain to tenant slug via API
    const tenant = await getTenantByCustomDomain(customDomain);
    return tenant?.slug || null;
  }

  // Check host header for subdomain
  const host = headersList.get('host') || '';

  // Pattern: {tenant}.silentbox.io or {tenant}.localhost:3002
  const subdomainMatch = host.match(/^([^.]+)\.(silentbox\.io|localhost)/);
  if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'booking') {
    return subdomainMatch[1];
  }

  // Fallback: check for tenant in URL search params (for development)
  // This would be handled by middleware in production

  return null;
}

/**
 * Fetch tenant branding from API
 */
export async function getTenantBranding(slug: string): Promise<TenantBranding | null> {
  try {
    const res = await fetch(`${API_URL}/api/tenants/${slug}/branding`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      console.error(`Failed to fetch tenant branding for ${slug}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.data as TenantBranding;
  } catch (error) {
    console.error('Error fetching tenant branding:', error);
    return null;
  }
}

/**
 * Resolve custom domain to tenant
 */
async function getTenantByCustomDomain(domain: string): Promise<TenantBranding | null> {
  try {
    const res = await fetch(`${API_URL}/api/tenants/by-domain/${encodeURIComponent(domain)}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data as TenantBranding;
  } catch (error) {
    console.error('Error resolving custom domain:', error);
    return null;
  }
}

/**
 * Generate CSS variables from tenant branding
 */
export function generateBrandingCSS(branding: TenantBranding): string {
  const { primaryColor, accentColor, fontFamily, headingFontFamily } = branding;

  // Convert hex to RGB for opacity support
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : null;
  };

  // Generate color shades (simplified - in production use a proper color library)
  const lighten = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  const darken = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  return `
    :root {
      --color-primary-50: ${lighten(primaryColor, 45)};
      --color-primary-100: ${lighten(primaryColor, 40)};
      --color-primary-200: ${lighten(primaryColor, 30)};
      --color-primary-300: ${lighten(primaryColor, 20)};
      --color-primary-400: ${lighten(primaryColor, 10)};
      --color-primary-500: ${primaryColor};
      --color-primary-600: ${darken(primaryColor, 10)};
      --color-primary-700: ${darken(primaryColor, 20)};
      --color-primary-800: ${darken(primaryColor, 30)};
      --color-primary-900: ${darken(primaryColor, 40)};
      --color-primary-rgb: ${hexToRgb(primaryColor) || '99, 102, 241'};
      ${accentColor ? `--color-accent-500: ${accentColor};` : ''}
      ${accentColor ? `--color-accent-600: ${darken(accentColor, 10)};` : ''}
      ${fontFamily ? `--font-sans: ${fontFamily};` : ''}
      ${headingFontFamily ? `--font-heading: ${headingFontFamily};` : ''}
    }
  `;
}

/**
 * Default branding for when no tenant is found (demo/preview mode)
 */
export const DEFAULT_BRANDING: TenantBranding = {
  id: 'demo',
  slug: 'demo',
  name: 'Silentbox',
  tagline: 'Book private workspaces instantly',
  description: 'Find and book quiet, private workspaces near you. Perfect for focused work, calls, or meetings.',
  primaryColor: '#6366F1',
  accentColor: '#F59E0B',
  features: {
    showPricing: true,
    allowGuestBooking: true,
    requirePhone: false,
    showReviews: true,
    showMap: true,
  },
};
