'use client';

import Link from 'next/link';
import { useTenant } from '@/app/providers';
import { Instagram, Facebook, Globe, Mail, Phone } from 'lucide-react';

export function Footer() {
  const { tenant } = useTenant();

  return (
    <footer className="bg-[#09090B] text-zinc-400">
      {/* Gradient line at top */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="border-t border-zinc-800/50">
        <div className="container-page py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <span className="text-white font-bold text-sm">
                    {tenant.name.charAt(0)}
                  </span>
                </div>
                <span className="text-xl font-bold text-white">
                  {tenant.name}
                </span>
              </div>
              <p className="text-zinc-500 mb-6 max-w-sm">
                {tenant.description || 'Book private workspaces instantly. Focus better, work smarter.'}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                {tenant.website && (
                  <a
                    href={tenant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-zinc-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {tenant.instagram && (
                  <a
                    href={`https://instagram.com/${tenant.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-zinc-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {tenant.facebook && (
                  <a
                    href={`https://facebook.com/${tenant.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center hover:bg-zinc-700 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/spaces" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    Browse Spaces
                  </Link>
                </li>
                <li>
                  <Link href="/locations" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    Locations
                  </Link>
                </li>
                <li>
                  <Link href="/my-bookings" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                {tenant.supportEmail && (
                  <li>
                    <a
                      href={`mailto:${tenant.supportEmail}`}
                      className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {tenant.supportEmail}
                    </a>
                  </li>
                )}
                {tenant.supportPhone && (
                  <li>
                    <a
                      href={`tel:${tenant.supportPhone}`}
                      className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {tenant.supportPhone}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-zinc-600 text-sm">
              &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              {tenant.termsUrl && (
                <a
                  href={tenant.termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Terms of Service
                </a>
              )}
              {tenant.privacyUrl && (
                <a
                  href={tenant.privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Privacy Policy
                </a>
              )}
            </div>
          </div>

          {/* Powered By */}
          <div className="mt-6 text-center">
            <p className="text-zinc-600 text-xs">
              Powered by{' '}
              <a
                href="https://silentbox.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Silentbox
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
