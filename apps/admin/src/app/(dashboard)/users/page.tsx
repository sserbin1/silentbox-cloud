'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  CreditCard,
  Plus,
  Minus,
  AlertCircle,
  RefreshCw,
  Loader2,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUsers, useAddCredits } from '@/hooks/use-users';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';
import { addCreditsSchema, type AddCreditsInput } from '@/lib/validations/user';

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  operator: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  super_admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

function UserCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface CreditsFormProps {
  onSubmit: (data: AddCreditsInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isDeducting: boolean;
  userName: string;
}

function CreditsForm({ onSubmit, onCancel, isSubmitting, isDeducting }: CreditsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddCreditsInput>({
    resolver: zodResolver(addCreditsSchema),
    defaultValues: {
      amount: 1,
    },
  });

  const amountAriaProps = getFieldAriaProps('amount', !!errors.amount);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min="1"
            {...register('amount', { valueAsNumber: true })}
            placeholder="Enter amount"
            aria-invalid={amountAriaProps['aria-invalid']}
            aria-describedby={amountAriaProps['aria-describedby']}
          />
          <FormError message={errors.amount?.message} id={amountAriaProps.errorId} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          variant={isDeducting ? 'destructive' : 'default'}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isDeducting ? 'Deduct' : 'Add'} Credits
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeducting, setIsDeducting] = useState(false);

  const { data: users, isLoading, error, refetch } = useUsers();
  const addCreditsMutation = useAddCredits();

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddCreditsClick = (user: any) => {
    setSelectedUser(user);
    setIsDeducting(false);
    setIsCreditsDialogOpen(true);
  };

  const handleDeductCreditsClick = (user: any) => {
    setSelectedUser(user);
    setIsDeducting(true);
    setIsCreditsDialogOpen(true);
  };

  const handleCreditsSubmit = async (data: AddCreditsInput) => {
    if (!selectedUser) return;
    try {
      await addCreditsMutation.mutateAsync({
        userId: selectedUser.id,
        amount: isDeducting ? -data.amount : data.amount,
      });
      toast.success(isDeducting ? 'Credits deducted successfully' : 'Credits added successfully');
      setIsCreditsDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      toast.error(isDeducting ? 'Failed to deduct credits' : 'Failed to add credits');
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '--';
    }
  };

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
          <div className="text-sm text-muted-foreground">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <>
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
              <UserCardSkeleton />
            </>
          ) : error ? (
            <ErrorCard message="Failed to load users" onRetry={() => refetch()} />
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No users match your search' : 'No users yet'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} alt={user.full_name} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{user.full_name || 'No name'}</h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            roleColors[user.role] || roleColors.user
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{user.credits || 0}</span>
                          <span className="text-sm text-muted-foreground">credits</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddCreditsClick(user)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Credits
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeductCreditsClick(user)}>
                              <Minus className="h-4 w-4 mr-2" />
                              Deduct Credits
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Joined {formatDate(user.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Deduct Credits Dialog */}
      <Dialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isDeducting ? 'Deduct' : 'Add'} Credits
            </DialogTitle>
            <DialogDescription>
              {isDeducting ? 'Deduct' : 'Add'} credits{' '}
              {isDeducting ? 'from' : 'to'} {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <CreditsForm
              onSubmit={handleCreditsSubmit}
              onCancel={() => setIsCreditsDialogOpen(false)}
              isSubmitting={addCreditsMutation.isPending}
              isDeducting={isDeducting}
              userName={selectedUser?.full_name || selectedUser?.email}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
