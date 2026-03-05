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
    <header className="sticky top-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-800/50">
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
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <span className="text-white font-bold text-sm">
                    {tenant.name.charAt(0)}
                  </span>
                </div>
                <span className="text-xl font-bold text-white">
                  {tenant.name}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/spaces"
              className="text-zinc-400 hover:text-white font-medium transition-colors"
            >
              Browse Spaces
            </Link>
            <Link
              href="/locations"
              className="text-zinc-400 hover:text-white font-medium transition-colors"
            >
              Locations
            </Link>
            {tenant.features.showPricing && (
              <Link
                href="/pricing"
                className="text-zinc-400 hover:text-white font-medium transition-colors"
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-full flex items-center justify-center ring-1 ring-violet-500/30">
                    <span className="text-violet-300 font-semibold text-sm">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-zinc-300 font-medium">{user?.name}</span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 rounded-xl shadow-2xl shadow-black/50 border border-zinc-800 py-2 animate-fade-in">
                    <Link
                      href="/my-bookings"
                      className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Calendar className="w-5 h-5" />
                      My Bookings
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <hr className="my-2 border-zinc-800" />
                    <button
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
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
                  className="text-zinc-400 hover:text-white font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium text-sm hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-zinc-400" />
            ) : (
              <Menu className="w-6 h-6 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/50 bg-[#0F0F11] animate-fade-in">
          <div className="container-page py-4 space-y-4">
            <Link
              href="/spaces"
              className="block py-2 text-zinc-400 hover:text-white font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Spaces
            </Link>
            <Link
              href="/locations"
              className="block py-2 text-zinc-400 hover:text-white font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Locations
            </Link>
            {tenant.features.showPricing && (
              <Link
                href="/pricing"
                className="block py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
            )}

            <hr className="border-zinc-800" />

            {isAuthenticated ? (
              <>
                <Link
                  href="/my-bookings"
                  className="block py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <Link
                  href="/profile"
                  className="block py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block py-2 text-red-400 font-medium w-full text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link
                  href="/login"
                  className="block w-full text-center px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/25"
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
