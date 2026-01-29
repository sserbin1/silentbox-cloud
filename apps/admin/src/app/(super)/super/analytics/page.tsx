'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Platform-wide metrics & insights</p>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <ArrowUpRight className="h-3 w-3" />
                +0%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-slate-500">Total Tenants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <ArrowUpRight className="h-3 w-3" />
                +0%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-slate-500">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <ArrowUpRight className="h-3 w-3" />
                +0%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-slate-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <ArrowDownRight className="h-3 w-3" />
                -0%
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">0 zł</p>
              <p className="text-xs text-slate-500">Platform Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tenant Growth */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Tenant Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">Tenant growth chart</p>
                <p className="text-xs text-slate-600 mt-1">Data will appear as tenants join</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Trends */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">Booking trends chart</p>
                <p className="text-xs text-slate-600 mt-1">Data will appear as bookings are made</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Tenants */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No tenant data yet</p>
            <p className="text-xs text-slate-600 mt-1">Top performers will be listed here based on revenue and bookings</p>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">API Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Total API Calls (Today)</span>
              <span className="text-sm font-medium text-slate-300">0</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Avg Response Time</span>
              <span className="text-sm font-medium text-emerald-400">-- ms</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Error Rate</span>
              <span className="text-sm font-medium text-emerald-400">0%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
              <span className="text-sm text-white">Active Webhooks</span>
              <span className="text-sm font-medium text-slate-300">0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
