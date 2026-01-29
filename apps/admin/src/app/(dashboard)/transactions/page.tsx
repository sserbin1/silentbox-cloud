'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const transactions = [
  {
    id: '1',
    user: 'Jan Kowalski',
    email: 'jan@example.com',
    type: 'credit_purchase',
    amount: 100,
    currency: 'PLN',
    credits: 100,
    method: 'przelewy24',
    status: 'completed',
    date: '2024-01-29 14:32',
  },
  {
    id: '2',
    user: 'Anna Nowak',
    email: 'anna@example.com',
    type: 'booking_payment',
    amount: -30,
    currency: 'PLN',
    credits: -30,
    method: 'credits',
    status: 'completed',
    date: '2024-01-29 14:15',
  },
  {
    id: '3',
    user: 'Piotr Wisniewski',
    email: 'piotr@example.com',
    type: 'credit_purchase',
    amount: 50,
    currency: 'PLN',
    credits: 50,
    method: 'monobank',
    status: 'pending',
    date: '2024-01-29 13:45',
  },
  {
    id: '4',
    user: 'Maria Lewandowska',
    email: 'maria@example.com',
    type: 'refund',
    amount: 30,
    currency: 'PLN',
    credits: 30,
    method: 'system',
    status: 'completed',
    date: '2024-01-29 12:20',
  },
  {
    id: '5',
    user: 'Tomasz Zielinski',
    email: 'tomasz@example.com',
    type: 'booking_payment',
    amount: -60,
    currency: 'PLN',
    credits: -60,
    method: 'credits',
    status: 'completed',
    date: '2024-01-29 11:00',
  },
  {
    id: '6',
    user: 'Katarzyna Mazur',
    email: 'kasia@example.com',
    type: 'credit_purchase',
    amount: 200,
    currency: 'PLN',
    credits: 200,
    method: 'przelewy24',
    status: 'failed',
    date: '2024-01-29 10:30',
  },
];

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

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = transactions
    .filter((tx) => tx.type === 'credit_purchase' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingAmount = transactions
    .filter((tx) => tx.status === 'pending')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <>
      <Header title="Transactions" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
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
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunds</p>
                <p className="text-2xl font-bold">30 PLN</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
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
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{tx.user}</p>
                          <p className="text-sm text-muted-foreground">{tx.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{typeLabels[tx.type]}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {tx.amount} {tx.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={tx.credits >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {tx.credits >= 0 ? '+' : ''}
                          {tx.credits}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize">{tx.method}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            statusColors[tx.status]
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
