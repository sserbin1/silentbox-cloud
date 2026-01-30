// Tenant branding configuration
export interface TenantBranding {
  id: string;
  slug: string;
  name: string;

  // Visual branding
  logo?: string;
  logoLight?: string; // For dark backgrounds
  favicon?: string;

  // Colors (hex values)
  primaryColor: string;
  primaryColorLight?: string;
  primaryColorDark?: string;
  accentColor?: string;

  // Typography
  fontFamily?: string;
  headingFontFamily?: string;

  // Content
  tagline?: string;
  description?: string;
  heroImage?: string;

  // Contact
  supportEmail?: string;
  supportPhone?: string;

  // Social
  website?: string;
  instagram?: string;
  facebook?: string;

  // Custom domain
  customDomain?: string;

  // Feature flags
  features: {
    showPricing: boolean;
    allowGuestBooking: boolean;
    requirePhone: boolean;
    showReviews: boolean;
    showMap: boolean;
  };

  // Legal
  termsUrl?: string;
  privacyUrl?: string;
}

export interface TenantContext {
  tenant: TenantBranding | null;
  isLoading: boolean;
  error: string | null;
}
