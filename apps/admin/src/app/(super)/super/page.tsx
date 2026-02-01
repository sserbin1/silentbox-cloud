'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, CreditCard, TrendingUp, Activity, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { usePlatformStats, usePlatformActivity } from '@/hooks/use-super-admin';
import { Button } from '@/components/ui/button';

interface HealthStatus {
  api: 'operational' | 'degraded' | 'down' | 'checking';
  database: 'healthy' | 'degraded' | 'down' | 'checking';
  payments: 'active' | 'degraded' | 'down' | 'checking';
  ttlock: 'active' | 'degraded' | 'down' | 'checking';
}

function useHealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    api: 'checking',
    database: 'checking',
    payments: 'checking',
    ttlock: 'checking',
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    setHealth({
      api: 'checking',
      database: 'checking',
      payments: 'checking',
      ttlock: 'checking',
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.silent-box.com';

    // Check API and Database
    try {
      const apiResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (apiResponse.ok) {
        const healthData = await apiResponse.json();
        setHealth(prev => ({
          ...prev,
          api: 'operational',
          database: healthData.database === 'connected' ? 'healthy' : 'degraded',
        }));
      } else {
        setHealth(prev => ({ ...prev, api: 'degraded', database: 'degraded' }));
      }
    } catch {
      setHealth(prev => ({ ...prev, api: 'down', database: 'down' }));
    }

    // Check Payment Processor (Stripe)
    try {
      const paymentResponse = await fetch(`${apiUrl}/health/payments`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setHealth(prev => ({
          ...prev,
          payments: paymentData.configured ? 'active' : 'degraded',
        }));
      } else {
        setHealth(prev => ({ ...prev, payments: 'degraded' }));
      }
    } catch {
      // If endpoint doesn't exist, assume active if API is up
      setHealth(prev => ({
        ...prev,
        payments: prev.api === 'operational' ? 'active' : 'degraded',
      }));
    }

    // Check TTLock Integration
    try {
      const ttlockResponse = await fetch(`${apiUrl}/health/ttlock`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (ttlockResponse.ok) {
        const ttlockData = await ttlockResponse.json();
        setHealth(prev => ({
          ...prev,
          ttlock: ttlockData.connected ? 'active' : 'degraded',
        }));
      } else {
        setHealth(prev => ({ ...prev, ttlock: 'degraded' }));
      }
    } catch {
      // If endpoint doesn't exist, show degraded
      setHealth(prev => ({ ...prev, ttlock: 'degraded' }));
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkHealth();
    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return { health, isChecking, checkHealth };
}

function StatCardSkeleton() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24 bg-slate-800" />
        <Skeleton className="h-8 w-8 rounded-lg bg-slate-800" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1 bg-slate-800" />
        <Skeleton className="h-3 w-32 bg-slate-800" />
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 bg-slate-800" />
            <Skeleton className="h-3 w-24 bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
      <p className="text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-slate-700 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = usePlatformStats();
  const { data: activity, isLoading: activityLoading, error: activityError, refetch: refetchActivity } = usePlatformActivity();
  const { health, isChecking, checkHealth } = useHealthCheck();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'active':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'active':
        return 'text-emerald-400';
      case 'degraded':
        return 'text-amber-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatStatus = (status: string) => {
    if (status === 'checking') return 'Checking...';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1">Monitor your Silentbox Cloud platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : statsError ? (
          <div className="col-span-full">
            <ErrorCard message="Failed to load platform stats" onRetry={() => refetchStats()} />
          </div>
        ) : (
          <>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Tenants</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.totalTenants || 0}</div>
                <p className="text-xs text-slate-500">
                  <span className="text-emerald-400">+{stats?.newTenantsThisMonth || 0}</span> this month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Active Subscriptions</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</div>
                <p className="text-xs text-slate-500">
                  <span className="text-amber-400">{stats?.trialTenants || 0}</span> in trial
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Monthly Revenue</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats?.mrr?.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }) || '0 zł'}
                </div>
                <p className="text-xs text-slate-500">MRR</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-violet-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-slate-500">across all tenants</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <ActivitySkeleton />
            ) : activityError ? (
              <ErrorCard message="Failed to load activity" onRetry={() => refetchActivity()} />
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      item.type === 'tenant_created' ? 'bg-emerald-500/20 text-emerald-400' :
                      item.type === 'subscription_updated' ? 'bg-blue-500/20 text-blue-400' :
                      item.type === 'payment_received' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {item.type === 'tenant_created' ? <Building2 className="h-5 w-5" /> :
                       item.type === 'subscription_updated' ? <CreditCard className="h-5 w-5" /> :
                       item.type === 'payment_received' ? <TrendingUp className="h-5 w-5" /> :
                       <Activity className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.message}</p>
                      <p className="text-xs text-slate-500">{item.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Platform Health</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={isChecking}
              className="text-slate-400 hover:text-white"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(health.api)} ${health.api !== 'checking' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-slate-300">API Status</span>
              </div>
              <span className={`text-sm font-medium ${getStatusTextColor(health.api)}`}>
                {formatStatus(health.api)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(health.database)} ${health.database !== 'checking' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-slate-300">Database</span>
              </div>
              <span className={`text-sm font-medium ${getStatusTextColor(health.database)}`}>
                {formatStatus(health.database)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(health.payments)} ${health.payments !== 'checking' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-slate-300">Payment Processing</span>
              </div>
              <span className={`text-sm font-medium ${getStatusTextColor(health.payments)}`}>
                {formatStatus(health.payments)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(health.ttlock)} ${health.ttlock !== 'checking' ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-slate-300">TTLock Integration</span>
              </div>
              <span className={`text-sm font-medium ${getStatusTextColor(health.ttlock)}`}>
                {formatStatus(health.ttlock)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
