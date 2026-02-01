'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  useBookingReport,
  useTransactionReport,
  exportBookingsToCSV,
  exportTransactionsToCSV,
} from '@/hooks/use-reports';
import { Header } from '@/components/layout/header';
import { format } from 'date-fns';

function formatCurrency(amount: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy HH:mm');
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');

  const filters = {
    from: dateFrom || undefined,
    to: dateTo || undefined,
  };

  const {
    data: bookingReport,
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings,
  } = useBookingReport(filters);

  const {
    data: transactionReport,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionReport(filters);

  const handleExportBookings = () => {
    if (bookingReport?.data) {
      exportBookingsToCSV(bookingReport.data);
    }
  };

  const handleExportTransactions = () => {
    if (transactionReport?.data) {
      exportTransactionsToCSV(transactionReport.data);
    }
  };

  const handleRefresh = () => {
    refetchBookings();
    refetchTransactions();
  };

  return (
    <>
      <Header title="Reports" />

      <div className="p-6 space-y-6">
        {/* Date Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                  placeholder="From"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                  placeholder="To"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="bookings">
              <FileText className="h-4 w-4 mr-2" />
              Bookings Report
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <CreditCard className="h-4 w-4 mr-2" />
              Transactions Report
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {bookingsError ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Failed to load booking report</p>
                  <Button variant="outline" size="sm" onClick={() => refetchBookings()} className="mt-4">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : bookingsLoading ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : bookingReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total Bookings"
                    value={bookingReport.summary.total}
                    icon={FileText}
                  />
                  <StatCard
                    title="Completed"
                    value={bookingReport.summary.completed}
                    icon={CheckCircle}
                    className="border-green-500/20"
                  />
                  <StatCard
                    title="Cancelled"
                    value={bookingReport.summary.cancelled}
                    icon={XCircle}
                    className="border-red-500/20"
                  />
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(bookingReport.summary.totalRevenue)}
                    icon={DollarSign}
                  />
                </div>

                {/* Bookings Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Booking Details</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleExportBookings}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Booth</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookingReport.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No bookings found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          bookingReport.data.slice(0, 50).map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{booking.users?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{booking.users?.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p>{booking.booths?.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.booths?.locations?.name}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    booking.status === 'completed'
                                      ? 'bg-green-500/10 text-green-600'
                                      : booking.status === 'cancelled'
                                      ? 'bg-red-500/10 text-red-600'
                                      : booking.status === 'active'
                                      ? 'bg-blue-500/10 text-blue-600'
                                      : 'bg-gray-500/10 text-gray-600'
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </TableCell>
                              <TableCell>{booking.duration_minutes} min</TableCell>
                              <TableCell>{formatCurrency(booking.total_price, booking.currency)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(booking.created_at)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {bookingReport.data.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Showing first 50 of {bookingReport.data.length} bookings. Export CSV for full data.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {transactionsError ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">Failed to load transaction report</p>
                  <Button variant="outline" size="sm" onClick={() => refetchTransactions()} className="mt-4">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : transactionsLoading ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Card>
                  <CardContent className="p-4">
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </>
            ) : transactionReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <StatCard
                    title="Total Transactions"
                    value={transactionReport.summary.total}
                    icon={CreditCard}
                  />
                  <StatCard
                    title="Completed"
                    value={transactionReport.summary.completed}
                    icon={CheckCircle}
                  />
                  <StatCard
                    title="Total Amount"
                    value={formatCurrency(transactionReport.summary.totalAmount)}
                    icon={TrendingUp}
                  />
                </div>

                {/* Provider Breakdown */}
                {Object.keys(transactionReport.summary.byProvider).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>By Payment Provider</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {Object.entries(transactionReport.summary.byProvider).map(([provider, amount]) => (
                          <div key={provider} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="font-medium capitalize">{provider}</span>
                            <span className="text-muted-foreground">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transactions Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Transaction Details</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionReport.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No transactions found for the selected period
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactionReport.data.slice(0, 50).map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{tx.users?.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{tx.users?.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="capitalize">{tx.type.replace(/_/g, ' ')}</span>
                              </TableCell>
                              <TableCell>{formatCurrency(tx.amount, tx.currency)}</TableCell>
                              <TableCell className="capitalize">{tx.payment_provider || '-'}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    tx.status === 'completed'
                                      ? 'bg-green-500/10 text-green-600'
                                      : tx.status === 'pending'
                                      ? 'bg-yellow-500/10 text-yellow-600'
                                      : tx.status === 'failed'
                                      ? 'bg-red-500/10 text-red-600'
                                      : 'bg-gray-500/10 text-gray-600'
                                  }`}
                                >
                                  {tx.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(tx.created_at)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    {transactionReport.data.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Showing first 50 of {transactionReport.data.length} transactions. Export CSV for full data.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
