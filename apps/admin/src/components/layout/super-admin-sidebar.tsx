'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const navigation = [
  {
    name: 'Platform Overview',
    href: '/super',
    icon: LayoutDashboard,
    description: 'Platform metrics'
  },
  {
    name: 'Tenants',
    href: '/super/tenants',
    icon: Building2,
    description: 'Manage operators'
  },
  {
    name: 'Billing',
    href: '/super/billing',
    icon: CreditCard,
    description: 'Subscriptions & invoices'
  },
  {
    name: 'Analytics',
    href: '/super/analytics',
    icon: BarChart3,
    description: 'Platform analytics'
  },
];

const secondaryNav = [
  { name: 'Platform Settings', href: '/super/settings', icon: Settings },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API errors
    }
    logout();
    router.push('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex h-full w-72 flex-col bg-slate-900 text-slate-100">
      {/* Logo & Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-6">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight">Silentbox</span>
          <span className="text-xs text-amber-400">Super Admin</span>
        </div>
      </div>

      {/* Back to Tenant Admin */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tenant Admin
          </Button>
        </Link>
      </div>

      {/* Platform Stats */}
      <div className="px-4 py-4 border-b border-slate-700/50">
        <div className="rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">Platform</span>
            </div>
            <span className="text-xs text-slate-400">Live</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-bold">--</p>
              <p className="text-xs text-slate-400">Active tenants</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">--</p>
              <p className="text-xs text-slate-400">MRR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Platform Management
        </p>
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/super' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-white/20'
                  : 'bg-slate-800 group-hover:bg-slate-700'
              )}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'truncate',
                  isActive ? 'font-semibold' : ''
                )}>{item.name}</p>
                {!isActive && (
                  <p className="text-xs text-slate-500 truncate">
                    {item.description}
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
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            System
          </p>
          {secondaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-white/20'
                    : 'bg-slate-800 group-hover:bg-slate-700'
                )}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-700/50 p-4 space-y-3">
        {/* Notifications */}
        <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              5
            </span>
          </div>
          <span>Alerts</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-semibold text-white">
            {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SA'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'Super Admin'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@silentbox.cloud'}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
