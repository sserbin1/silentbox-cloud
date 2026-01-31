'use client';

import { useQuery } from '@tanstack/react-query';
import { transactionsApi, TransactionsParams, Transaction, TransactionsMeta } from '@/lib/api';

interface TransactionsResponse {
  data: Transaction[];
  meta: TransactionsMeta;
}

export function useTransactions(params?: TransactionsParams) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const response = await transactionsApi.getAll(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch transactions');
      }
      // API returns { success, data, meta }
      return response as unknown as { success: boolean; data: Transaction[]; meta: TransactionsMeta };
    },
  });
}

export function useTransactionsExport(params?: { date_from?: string; date_to?: string; type?: string }) {
  return transactionsApi.export(params);
}
