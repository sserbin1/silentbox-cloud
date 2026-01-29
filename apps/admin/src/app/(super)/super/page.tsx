'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, CreditCard, TrendingUp, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { usePlatformStats, usePlatformActivity } from '@/hooks/use-super-admin';
import { Button } from '@/components/ui/button';

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

        {/* Quick Stats */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-300">API Status</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-300">Database</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-slate-300">Payment Processing</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm text-slate-300">TTLock Integration</span>
              </div>
              <span className="text-sm font-medium text-amber-400">Degraded</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
