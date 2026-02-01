'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export interface BookingReportItem {
  id: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_price: number;
  currency: string;
  created_at: string;
  users: { full_name: string; email: string } | null;
  booths: { name: string; locations: { name: string } | null } | null;
}

export interface BookingReportSummary {
  total: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  totalMinutes: number;
}

export interface TransactionReportItem {
  id: string;
  type: string;
  amount: number;
  currency: string;
  payment_provider: string | null;
  status: string;
  created_at: string;
  users: { full_name: string; email: string } | null;
}

export interface TransactionReportSummary {
  total: number;
  completed: number;
  totalAmount: number;
  byProvider: Record<string, number>;
}

export interface ReportFilters {
  from?: string;
  to?: string;
}

interface BookingReportResponse {
  data: BookingReportItem[];
  summary: BookingReportSummary;
}

interface TransactionReportResponse {
  data: TransactionReportItem[];
  summary: TransactionReportSummary;
}

/**
 * Hook to fetch booking reports with optional date filtering
 */
export function useBookingReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'bookings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);

      const queryString = params.toString();
      const url = `/api/admin/reports/bookings${queryString ? `?${queryString}` : ''}`;

      const response = await adminApi.get<BookingReportResponse>(url);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch booking report');
      }

      return response.data;
    },
  });
}

/**
 * Hook to fetch transaction reports with optional date filtering
 */
export function useTransactionReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);

      const queryString = params.toString();
      const url = `/api/admin/reports/transactions${queryString ? `?${queryString}` : ''}`;

      const response = await adminApi.get<TransactionReportResponse>(url);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch transaction report');
      }

      return response.data;
    },
  });
}

/**
 * Export bookings to CSV
 */
export function exportBookingsToCSV(bookings: BookingReportItem[]): void {
  const headers = ['ID', 'Status', 'User', 'Email', 'Booth', 'Location', 'Start Time', 'End Time', 'Duration (min)', 'Price', 'Currency', 'Created At'];

  const rows = bookings.map((b) => [
    b.id,
    b.status,
    b.users?.full_name || '',
    b.users?.email || '',
    b.booths?.name || '',
    b.booths?.locations?.name || '',
    b.start_time,
    b.end_time,
    b.duration_minutes,
    b.total_price,
    b.currency,
    b.created_at,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadCSV(csv, `bookings-report-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(transactions: TransactionReportItem[]): void {
  const headers = ['ID', 'Type', 'Amount', 'Currency', 'Provider', 'Status', 'User', 'Email', 'Created At'];

  const rows = transactions.map((t) => [
    t.id,
    t.type,
    t.amount,
    t.currency,
    t.payment_provider || '',
    t.status,
    t.users?.full_name || '',
    t.users?.email || '',
    t.created_at,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadCSV(csv, `transactions-report-${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
