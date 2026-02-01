'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Moon, Sun, Command, User, Settings, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

// Mock notifications - in production, this would come from an API
const mockNotifications = [
  { id: '1', title: 'New booking', message: 'Booth A1 booked for tomorrow', time: '5 min ago', read: false },
  { id: '2', title: 'Low battery', message: 'Device #42 battery at 15%', time: '1 hour ago', read: false },
  { id: '3', title: 'Payment received', message: '€250.00 from John Doe', time: '2 hours ago', read: true },
];

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [notifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API errors
    }
    // Always clear local state and redirect
    logout();
    router.push('/login');
    toast.success(t('admin.header.logout'));
  };

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'AD';
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin':
        return t('admin.header.admin');
      case 'operator':
        return t('admin.header.operator');
      case 'super_admin':
        return 'Super Admin';
      default:
        return t('admin.header.owner');
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
      {/* Title Section */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('admin.header.search')}
            className="w-72 pl-9 pr-12 h-10 bg-muted/50 border-border/50 focus:bg-background transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Quick Actions - commented out until /bookings/new page is created */}
        {/* <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          onClick={() => router.push('/bookings/new')}
        >
          <Plus className="h-4 w-4" />
          <span>{t('admin.header.newBooking')}</span>
        </Button> */}

        <div className="flex items-center gap-1 ml-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{t('admin.header.notifications')}</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                <>
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-medium text-sm">{notification.title}</span>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-amber-500 ml-auto" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{notification.message}</span>
                      <span className="text-xs text-muted-foreground/60">{notification.time}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-center text-sm text-primary cursor-pointer justify-center"
                    onClick={() => router.push('/notifications')}
                  >
                    {t('admin.header.viewAll')}
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('admin.header.noNotifications')}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-border/50 mx-2" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-semibold text-primary-foreground">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">{user?.full_name || user?.email || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              {t('admin.header.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              {t('admin.header.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              {t('admin.header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
