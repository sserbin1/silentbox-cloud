'use client';

import Link from 'next/link';
import { useTenant } from '@/app/providers';
import { Instagram, Facebook, Globe, Mail, Phone } from 'lucide-react';

export function Footer() {
  const { tenant } = useTenant();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {tenant.name.charAt(0)}
                </span>
              </div>
              <span className="text-xl font-bold text-white">
                {tenant.name}
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              {tenant.description || 'Book private workspaces instantly. Focus better, work smarter.'}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {tenant.website && (
                <a
                  href={tenant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
              {tenant.instagram && (
                <a
                  href={`https://instagram.com/${tenant.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {tenant.facebook && (
                <a
                  href={`https://facebook.com/${tenant.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
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
                <Link href="/spaces" className="hover:text-white transition-colors">
                  Browse Spaces
                </Link>
              </li>
              <li>
                <Link href="/locations" className="hover:text-white transition-colors">
                  Locations
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-white transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
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
                    className="flex items-center gap-2 hover:text-white transition-colors"
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
                    className="flex items-center gap-2 hover:text-white transition-colors"
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
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            {tenant.termsUrl && (
              <a
                href={tenant.termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </a>
            )}
            {tenant.privacyUrl && (
              <a
                href={tenant.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
            )}
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">
            Powered by{' '}
            <a
              href="https://silentbox.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 transition-colors"
            >
              Silentbox
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
