'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, MoreHorizontal, Mail, Phone, CreditCard } from 'lucide-react';

const users = [
  {
    id: '1',
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    phone: '+48 123 456 789',
    credits: 150,
    totalBookings: 24,
    totalSpent: '720 PLN',
    role: 'user',
    createdAt: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Anna Nowak',
    email: 'anna@example.com',
    phone: '+48 987 654 321',
    credits: 75,
    totalBookings: 12,
    totalSpent: '360 PLN',
    role: 'user',
    createdAt: '2024-01-10',
    status: 'active',
  },
  {
    id: '3',
    name: 'Piotr Wisniewski',
    email: 'piotr@example.com',
    phone: '+48 555 666 777',
    credits: 0,
    totalBookings: 5,
    totalSpent: '150 PLN',
    role: 'user',
    createdAt: '2024-01-05',
    status: 'active',
  },
  {
    id: '4',
    name: 'Maria Lewandowska',
    email: 'maria@example.com',
    phone: '+48 111 222 333',
    credits: 300,
    totalBookings: 48,
    totalSpent: '1,440 PLN',
    role: 'user',
    createdAt: '2023-12-20',
    status: 'active',
  },
  {
    id: '5',
    name: 'Admin User',
    email: 'admin@silentbox.pl',
    phone: '+48 000 000 000',
    credits: 0,
    totalBookings: 0,
    totalSpent: '0 PLN',
    role: 'admin',
    createdAt: '2023-12-01',
    status: 'active',
  },
];

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  operator: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header title="Users" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Credits</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Bookings</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Total Spent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </p>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className={user.credits === 0 ? 'text-red-500' : ''}>
                            {user.credits}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.totalBookings}</td>
                      <td className="px-4 py-3 font-medium">{user.totalSpent}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            roleColors[user.role]
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.createdAt}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
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
