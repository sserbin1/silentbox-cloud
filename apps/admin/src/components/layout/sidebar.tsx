'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Box,
  Calendar,
  Users,
  CreditCard,
  Settings,
  Lock,
  LogOut,
  Bell,
  ChevronRight,
  Zap,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/translations';

interface NavItem {
  nameKey: TranslationKey;
  fallbackName: string;
  href: string;
  icon: typeof LayoutDashboard;
  descriptionKey?: TranslationKey;
  fallbackDescription?: string;
}

const navigation: NavItem[] = [
  {
    nameKey: 'admin.nav.dashboard',
    fallbackName: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    fallbackDescription: 'Overview & analytics'
  },
  {
    nameKey: 'admin.nav.locations',
    fallbackName: 'Locations',
    href: '/locations',
    icon: MapPin,
    fallbackDescription: 'Manage venues'
  },
  {
    nameKey: 'admin.nav.booths',
    fallbackName: 'Booths',
    href: '/booths',
    icon: Box,
    fallbackDescription: 'Booth inventory'
  },
  {
    nameKey: 'admin.nav.bookings',
    fallbackName: 'Bookings',
    href: '/bookings',
    icon: Calendar,
    fallbackDescription: 'Reservations'
  },
  {
    nameKey: 'admin.nav.users',
    fallbackName: 'Users',
    href: '/users',
    icon: Users,
    fallbackDescription: 'Customer management'
  },
  {
    nameKey: 'admin.nav.pricing',
    fallbackName: 'Pricing',
    href: '/pricing',
    icon: DollarSign,
    fallbackDescription: 'Rates & packages'
  },
  {
    nameKey: 'admin.nav.devices',
    fallbackName: 'Devices',
    href: '/devices',
    icon: Lock,
    fallbackDescription: 'Smart locks'
  },
];

const secondaryNav: NavItem[] = [
  { nameKey: 'admin.nav.settings', fallbackName: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="flex h-full w-72 flex-col bg-card/50 backdrop-blur-xl border-r border-border/50">
      {/* Logo & Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Box className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight">Silentbox</span>
          <span className="text-xs text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Today</span>
            </div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs text-muted-foreground">Active bookings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">+12%</p>
              <p className="text-xs text-muted-foreground">vs yesterday</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main Menu
        </p>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const name = t(item.nameKey) || item.fallbackName;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-foreground/20'
                  : 'bg-muted/50 group-hover:bg-muted'
              )}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'truncate',
                  isActive ? 'font-semibold' : ''
                )}>{name}</p>
                {!isActive && item.fallbackDescription && (
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {item.fallbackDescription}
                  </p>
                )}
              </div>
              {isActive && (
                <ChevronRight className="h-4 w-4 opacity-70" />
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            System
          </p>
          {secondaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const name = t(item.nameKey) || item.fallbackName;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted/50 group-hover:bg-muted'
                )}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <span>{name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-border/50 p-4 space-y-3">
        {/* Language Switcher */}
        <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">{t('admin.settings.language')}</span>
          <LanguageSwitcher variant="compact" />
        </div>

        {/* Notifications */}
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              3
            </span>
          </div>
          <span>Notifications</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin User</p>
            <p className="text-xs text-muted-foreground truncate">admin@silentbox.io</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
