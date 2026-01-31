'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { usePlatformStats, useTenants, usePlatformActivity } from '@/hooks/use-super-admin';

// Chart colors
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = usePlatformStats();
  const { data: tenants, isLoading: tenantsLoading } = useTenants();
  const { data: activity, isLoading: activityLoading } = usePlatformActivity();

  const isLoading = statsLoading || tenantsLoading;

  // Generate mock chart data based on period (when real data is available, replace)
  const generateChartData = () => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tenants: Math.floor(Math.random() * 3) + (stats?.totalTenants || 0),
        bookings: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Tenant distribution by status
  const tenantsByStatus = tenants?.reduce((acc, tenant) => {
    acc[tenant.status] = (acc[tenant.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statusData = Object.entries(tenantsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Top tenants by revenue/bookings (mock - replace with real data)
  const topTenants = tenants?.slice(0, 5).map((tenant, i) => ({
    ...tenant,
    revenue: Math.floor(Math.random() * 10000) + 1000,
    bookings: Math.floor(Math.random() * 100) + 20,
  })) || [];

  // Country distribution
  const tenantsByCountry = tenants?.reduce((acc, tenant) => {
    const country = tenant.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const countryFlags: Record<string, string> = {
    'Poland': '🇵🇱',
    'Ukraine': '🇺🇦',
    'Germany': '🇩🇪',
    'Unknown': '🏳️',
  };

  // Error state
  if (statsError) {
    return (
      <div className="p-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Failed to load analytics</p>
              <p className="text-sm text-slate-400 mt-1">{statsError.message}</p>
              <Button variant="outline" className="mt-4 border-slate-700" onClick={() => refetchStats()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Platform-wide metrics & insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              {stats?.newTenantsThisMonth && stats.newTenantsThisMonth > 0 ? (
                <div className="flex items-center gap-1 text-emerald-400 text-xs">
                  <ArrowUpRight className="h-3 w-3" />
                  +{stats.newTenantsThisMonth}
                </div>
              ) : null}
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{stats?.totalTenants || 0}</p>
                  <p className="text-xs text-slate-500">Total Tenants ({stats?.activeTenants || 0} active)</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-slate-500">Total Users</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">{stats?.totalBookings || 0}</p>
                  <p className="text-xs text-slate-500">Total Bookings</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(stats?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-slate-500">Platform Revenue (MRR: {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(stats?.mrr || 0)})</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tenant Growth Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Tenant Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No data available</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Area type="monotone" dataKey="tenants" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTenants)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Trends Chart */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No data available</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart + Tenant Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc' }}
                      formatter={(value: number) => [`${value} PLN`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tenant Status Distribution */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Tenant Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || statusData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                ) : (
                  <div className="text-center">
                    <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">No tenants yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Tenants */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : topTenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No tenant data yet</p>
              <p className="text-xs text-slate-600 mt-1">Top performers will be listed here based on revenue and bookings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Tenant</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Bookings</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {topTenants.map((tenant, i) => (
                    <tr key={tenant.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{tenant.name}</p>
                            <p className="text-xs text-slate-500">{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tenant.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          tenant.status === 'trialing' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white">{tenant.bookings}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                        {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(tenant.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Distribution + API Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(tenantsByCountry).length === 0 ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇵🇱</span>
                    <span className="text-sm text-white">Poland</span>
                  </div>
                  <span className="text-sm text-slate-400">0 tenants</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇺🇦</span>
                    <span className="text-sm text-white">Ukraine</span>
                  </div>
                  <span className="text-sm text-slate-400">0 tenants</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🇩🇪</span>
                    <span className="text-sm text-white">Germany</span>
                  </div>
                  <span className="text-sm text-slate-400">0 tenants</span>
                </div>
              </>
            ) : (
              Object.entries(tenantsByCountry).map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{countryFlags[country] || '🏳️'}</span>
                    <span className="text-sm text-white">{country}</span>
                  </div>
                  <span className="text-sm text-slate-400">{count} tenant{count !== 1 ? 's' : ''}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Platform Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Total Booths</span>
              <span className="text-sm font-medium text-slate-300">{stats?.totalBooths || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Active Subscriptions</span>
              <span className="text-sm font-medium text-emerald-400">{stats?.activeSubscriptions || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Trial Tenants</span>
              <span className="text-sm font-medium text-amber-400">{stats?.trialTenants || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">New This Month</span>
              <span className="text-sm font-medium text-blue-400">+{stats?.newTenantsThisMonth || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : !activity || activity.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/50">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    item.type === 'tenant_created' ? 'bg-blue-500/20' :
                    item.type === 'subscription_updated' ? 'bg-amber-500/20' :
                    item.type === 'payment_received' ? 'bg-emerald-500/20' :
                    'bg-slate-500/20'
                  }`}>
                    {item.type === 'tenant_created' ? <Building2 className="h-4 w-4 text-blue-400" /> :
                     item.type === 'subscription_updated' ? <TrendingUp className="h-4 w-4 text-amber-400" /> :
                     item.type === 'payment_received' ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> :
                     <Calendar className="h-4 w-4 text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
