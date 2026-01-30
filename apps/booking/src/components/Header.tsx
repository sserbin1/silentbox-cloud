'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, User, Calendar, LogOut } from 'lucide-react';
import { useTenant, useAuth } from '@/app/providers';
import { cn } from '@/lib/utils';

export function Header() {
  const { tenant } = useTenant();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="container-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {tenant.logo ? (
              <Image
                src={tenant.logo}
                alt={tenant.name}
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {tenant.name.charAt(0)}
                  </span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {tenant.name}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/spaces"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Browse Spaces
            </Link>
            <Link
              href="/locations"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Locations
            </Link>
            {tenant.features.showPricing && (
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">{user?.name}</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                    <Link
                      href="/my-bookings"
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Calendar className="w-5 h-5" />
                      My Bookings
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary btn-md">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="container-page py-4 space-y-4">
            <Link
              href="/spaces"
              className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Spaces
            </Link>
            <Link
              href="/locations"
              className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Locations
            </Link>
            {tenant.features.showPricing && (
              <Link
                href="/pricing"
                className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
            )}

            <hr className="border-gray-100" />

            {isAuthenticated ? (
              <>
                <Link
                  href="/my-bookings"
                  className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <Link
                  href="/profile"
                  className="block py-2 text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block py-2 text-red-600 font-medium w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/login"
                  className="btn-secondary btn-md w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="btn-primary btn-md w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
