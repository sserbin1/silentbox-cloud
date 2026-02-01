'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  FileText,
  TrendingUp,
  Calendar,
  Download,
  Plus,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useBillingStats, useInvoices, useTenants } from '@/hooks/use-super-admin';
import { toast } from 'sonner';
import { CreateInvoiceDialog } from '@/components/super/create-invoice-dialog';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  paid: {
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'Paid',
  },
  pending: {
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <Clock className="h-3 w-3" />,
    label: 'Pending',
  },
  overdue: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Overdue',
  },
  cancelled: {
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled',
  },
  draft: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <FileText className="h-3 w-3" />,
    label: 'Draft',
  },
};

export default function BillingPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: stats, isLoading, error, refetch } = useBillingStats();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: tenants } = useTenants();

  const handleExportInvoices = () => {
    if (!invoices || invoices.length === 0) {
      toast.info('No invoices to export');
      return;
    }

    const csvRows = [
      ['Invoice Export'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Invoice ID', 'Tenant', 'Amount', 'Status', 'Due Date', 'Paid Date'],
      ...invoices.map((inv) => [
        inv.invoice_number,
        inv.tenant_name,
        `${inv.amount} ${inv.currency}`,
        inv.status,
        inv.due_date,
        inv.paid_at || '-',
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Invoices exported successfully');
  };

  // Calculate subscription plan counts from tenants
  const planCounts = {
    starter: tenants?.filter((t) => t.subscription_status === 'starter').length || 0,
    professional: tenants?.filter((t) => t.subscription_status === 'professional').length || 0,
    enterprise: tenants?.filter((t) => t.subscription_status === 'enterprise').length || 0,
    trial: tenants?.filter((t) => t.status === 'trialing').length || 0,
  };

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
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => setIsCreateDialogOpen(true)}
        >
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
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={handleExportInvoices}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 bg-slate-800" />
                ))}
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice) => {
                  const config = statusConfig[invoice.status] || statusConfig.pending;
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{invoice.invoice_number}</p>
                          <p className="text-xs text-slate-500">{invoice.tenant_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{formatCurrency(invoice.amount)}</p>
                        <Badge variant="outline" className={`text-xs ${config.color}`}>
                          <span className="mr-1">{config.icon}</span>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No invoices yet</p>
                <p className="text-xs text-slate-600 mt-1">Create your first invoice to get started</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            )}
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
              <span className={`text-xs ${planCounts.starter > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {planCounts.starter} tenants
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <div>
                <p className="font-medium text-white">Professional</p>
                <p className="text-xs text-slate-500">299 zł / month</p>
              </div>
              <span className={`text-xs ${planCounts.professional > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {planCounts.professional} tenants
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-amber-500/30">
              <div>
                <p className="font-medium text-white">Enterprise</p>
                <p className="text-xs text-slate-500">999 zł / month</p>
              </div>
              <span className={`text-xs ${planCounts.enterprise > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {planCounts.enterprise} tenants
              </span>
            </div>
            {planCounts.trial > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div>
                  <p className="font-medium text-white">Trial</p>
                  <p className="text-xs text-slate-500">14 days free</p>
                </div>
                <span className="text-xs text-blue-400">{planCounts.trial} tenants</span>
              </div>
            )}
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
                <p className="text-4xl font-bold text-emerald-400">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <p className="text-slate-500 mt-2">All-time revenue from completed transactions</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  );
}
