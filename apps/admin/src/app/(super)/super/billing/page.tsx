'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, FileText, TrendingUp, Calendar, Download, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useBillingStats } from '@/hooks/use-super-admin';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}

export default function BillingPage() {
  const { data: stats, isLoading, error, refetch } = useBillingStats();

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center text-red-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load billing data</p>
              <Button variant="outline" className="mt-4 border-slate-700" onClick={() => refetch()}>
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
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-slate-400 mt-1">Subscriptions, invoices & revenue</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 bg-slate-800" />
                ) : (
                  <p className="text-2xl font-bold text-white">{formatCurrency(stats?.mrr || 0)}</p>
                )}
                <p className="text-xs text-slate-500">MRR (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 bg-slate-800" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stats?.activeSubscriptions || 0}</p>
                )}
                <p className="text-xs text-slate-500">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 bg-slate-800" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stats?.pendingInvoices || 0}</p>
                )}
                <p className="text-xs text-slate-500">Pending Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-400" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12 bg-slate-800" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stats?.overdueInvoices || 0}</p>
                )}
                <p className="text-xs text-slate-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Recent Invoices</CardTitle>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No invoices yet</p>
              <p className="text-xs text-slate-600 mt-1">Invoices will appear here when tenants are billed</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div>
                <p className="font-medium text-white">Starter</p>
                <p className="text-xs text-slate-500">99 zł / month</p>
              </div>
              <span className="text-xs text-slate-400">0 tenants</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div>
                <p className="font-medium text-white">Professional</p>
                <p className="text-xs text-slate-500">299 zł / month</p>
              </div>
              <span className="text-xs text-slate-400">0 tenants</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-amber-500/30">
              <div>
                <p className="font-medium text-white">Enterprise</p>
                <p className="text-xs text-slate-500">999 zł / month</p>
              </div>
              <span className="text-xs text-amber-400">0 tenants</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue Card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {isLoading ? (
              <Skeleton className="h-12 w-48 mx-auto bg-slate-800" />
            ) : (
              <>
                <p className="text-4xl font-bold text-emerald-400">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
                <p className="text-slate-500 mt-2">All-time revenue from completed transactions</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
