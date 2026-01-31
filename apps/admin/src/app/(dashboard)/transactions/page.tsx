'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTransactions, useTransactionsExport } from '@/hooks/use-transactions';
import { TransactionsParams } from '@/lib/api';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const typeLabels: Record<string, string> = {
  credit_purchase: 'Credit Purchase',
  booking_payment: 'Booking Payment',
  refund: 'Refund',
};

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Build query params
  const params: TransactionsParams = {
    page,
    limit: pageSize,
    ...(searchQuery && { search: searchQuery }),
    ...(typeFilter !== 'all' && { type: typeFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  };

  const { data, isLoading, error, refetch } = useTransactions(params);

  const transactions = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: pageSize, pages: 1 };

  // Calculate stats from current data
  const totalRevenue = transactions
    .filter((tx) => tx.type === 'credit_purchase' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const pendingAmount = transactions
    .filter((tx) => tx.status === 'pending')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const refundsAmount = transactions
    .filter((tx) => tx.type === 'refund' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const handleExport = () => {
    const exportUrl = useTransactionsExport({
      ...(typeFilter !== 'all' && { type: typeFilter }),
    });
    window.open(exportUrl, '_blank');
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on search
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header title="Transactions" />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header title="Transactions" />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Failed to load transactions</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Transactions" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Page Revenue</p>
                <p className="text-2xl font-bold text-green-600">{totalRevenue} PLN</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAmount} PLN</p>
              </div>
              <CreditCard className="h-8 w-8 text-yellow-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{meta.total}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunds</p>
                <p className="text-2xl font-bold">{refundsAmount} PLN</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                <SelectItem value="booking_payment">Booking Payment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Credits</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Method</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{tx.user_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{tx.user_email || '-'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{typeLabels[tx.type] || tx.type}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {tx.amount >= 0 ? '+' : ''}
                            {tx.amount} {tx.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={(tx.credits || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {(tx.credits || 0) >= 0 ? '+' : ''}
                            {tx.credits || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize">{tx.method || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              statusColors[tx.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, meta.total)} of {meta.total} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {meta.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.pages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
