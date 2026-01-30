import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getTenantSlug, getTenantBranding, generateBrandingCSS, DEFAULT_BRANDING } from '@/lib/tenant';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from './providers';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const viewport: Viewport = {
  themeColor: '#6366F1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getTenantSlug();
  const branding = slug ? await getTenantBranding(slug) : DEFAULT_BRANDING;

  return {
    title: {
      default: branding?.name || 'Silentbox',
      template: `%s | ${branding?.name || 'Silentbox'}`,
    },
    description: branding?.description || 'Book private workspaces instantly',
    icons: branding?.favicon ? [{ url: branding.favicon }] : undefined,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: branding?.name || 'Silentbox',
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const slug = await getTenantSlug();
  const branding = slug ? await getTenantBranding(slug) : DEFAULT_BRANDING;
  const tenant = branding || DEFAULT_BRANDING;

  // Generate CSS variables for tenant branding
  const brandingCSS = generateBrandingCSS(tenant);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandingCSS }} />
        {/* Load custom font if specified */}
        {tenant.fontFamily && tenant.fontFamily !== 'Inter' && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(tenant.fontFamily)}:wght@400;500;600;700&display=swap`}
            rel="stylesheet"
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <Providers tenant={tenant}>
          <ServiceWorkerRegistration />
          <PWAInstallPrompt />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
