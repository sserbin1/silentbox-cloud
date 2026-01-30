'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

interface TenantBranding {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  features: {
    allowGuestBooking: boolean;
    requirePhone: boolean;
    showPrices: boolean;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getTenantBranding(slug: string): Promise<TenantBranding | null> {
  try {
    const res = await fetch(`${API_URL}/api/tenants/${slug}/branding`);
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch {
    return null;
  }
}

function generateBrandingCSS(branding: TenantBranding): string {
  return `
    :root {
      --color-primary-50: ${adjustColor(branding.primaryColor, 0.95)};
      --color-primary-100: ${adjustColor(branding.primaryColor, 0.9)};
      --color-primary-200: ${adjustColor(branding.primaryColor, 0.8)};
      --color-primary-300: ${adjustColor(branding.primaryColor, 0.6)};
      --color-primary-400: ${adjustColor(branding.primaryColor, 0.4)};
      --color-primary-500: ${branding.primaryColor};
      --color-primary-600: ${adjustColor(branding.primaryColor, -0.1)};
      --color-primary-700: ${adjustColor(branding.primaryColor, -0.2)};
      --color-primary-800: ${adjustColor(branding.primaryColor, -0.3)};
      --color-primary-900: ${adjustColor(branding.primaryColor, -0.4)};
    }
  `;
}

function adjustColor(hex: string, factor: number): string {
  // Simple color adjustment - lighten (positive) or darken (negative)
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, Math.round((num >> 16) + (factor > 0 ? (255 - (num >> 16)) * factor : (num >> 16) * factor))));
  const g = Math.min(255, Math.max(0, Math.round(((num >> 8) & 0x00FF) + (factor > 0 ? (255 - ((num >> 8) & 0x00FF)) * factor : ((num >> 8) & 0x00FF) * factor))));
  const b = Math.min(255, Math.max(0, Math.round((num & 0x0000FF) + (factor > 0 ? (255 - (num & 0x0000FF)) * factor : (num & 0x0000FF) * factor))));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// Create context for tenant data
import { createContext, useContext } from 'react';

interface BookingContextType {
  tenant: TenantBranding | null;
  tenantSlug: string;
  isLoading: boolean;
}

export const BookingContext = createContext<BookingContextType>({
  tenant: null,
  tenantSlug: '',
  isLoading: true,
});

export const useBookingContext = () => useContext(BookingContext);

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      const branding = await getTenantBranding(tenantSlug);
      setTenant(branding);
      setIsLoading(false);
    }
    if (tenantSlug) {
      loadTenant();
    }
  }, [tenantSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Workspace Not Found</h1>
          <p className="text-gray-600">The booking portal you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <BookingContext.Provider value={{ tenant, tenantSlug, isLoading }}>
      {/* Inject branding CSS */}
      <style dangerouslySetInnerHTML={{ __html: generateBrandingCSS(tenant) }} />

      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href={`/book/${tenantSlug}`} className="flex items-center gap-3">
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-gray-900">{tenant.name}</span>
              </Link>

              <nav className="flex items-center gap-4">
                <Link
                  href={`/book/${tenantSlug}/spaces`}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Browse Spaces
                </Link>
                <Link
                  href={`/book/${tenantSlug}/login`}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: tenant.primaryColor,
                    color: 'white'
                  }}
                >
                  Sign In
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                {tenant.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.name} className="h-6 w-auto" />
                ) : (
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: tenant.primaryColor }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                )}
                <span className="text-gray-600 text-sm">{tenant.name}</span>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                {tenant.contact?.email && (
                  <a href={`mailto:${tenant.contact.email}`} className="flex items-center gap-1 hover:text-gray-700">
                    <Mail className="w-4 h-4" />
                    {tenant.contact.email}
                  </a>
                )}
                {tenant.contact?.phone && (
                  <a href={`tel:${tenant.contact.phone}`} className="flex items-center gap-1 hover:text-gray-700">
                    <Phone className="w-4 h-4" />
                    {tenant.contact.phone}
                  </a>
                )}
              </div>

              <div className="text-sm text-gray-400">
                Powered by <a href="https://silent-box.com" className="hover:text-gray-600">Silentbox</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BookingContext.Provider>
  );
}
