import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getTenantSlug, getTenantBranding, generateBrandingCSS, DEFAULT_BRANDING } from '@/lib/tenant';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

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
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
