'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  ArrowLeft,
  Edit,
  Pause,
  Play,
  Trash2,
  MapPin,
  Users,
  Box,
  Calendar,
  Mail,
  Phone,
  Globe,
  CreditCard,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useTenant, useTenantStats, useActivateTenant, useSuspendTenant, useDeleteTenant } from '@/hooks/use-super-admin';
import { toast } from 'sonner';
import { EditTenantDialog } from '@/components/super/edit-tenant-dialog';

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-xl bg-slate-800" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-32 bg-slate-800" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-slate-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
      <p className="text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-slate-700 hover:bg-slate-800">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: tenant, isLoading, error, refetch } = useTenant(tenantId);
  const { data: stats, isLoading: statsLoading } = useTenantStats(tenantId);
  const activateMutation = useActivateTenant();
  const suspendMutation = useSuspendTenant();
  const deleteMutation = useDeleteTenant();

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(tenantId);
      toast.success('Tenant activated successfully');
    } catch (error) {
      toast.error('Failed to activate tenant');
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendMutation.mutateAsync(tenantId);
      toast.success('Tenant suspended successfully');
    } catch (error) {
      toast.error('Failed to suspend tenant');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(tenantId);
      toast.success('Tenant deleted successfully');
      router.push('/super/tenants');
    } catch (error) {
      toast.error('Failed to delete tenant');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="p-6">
        <ErrorCard message="Failed to load tenant details" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super/tenants">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  statusColors[tenant.status] || statusColors.pending
                }`}>
                  {tenant.status}
                </span>
              </div>
              <p className="text-slate-400">{tenant.slug}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {tenant.status === 'suspended' ? (
            <Button
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {activateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Activate
            </Button>
          ) : (
            <Button
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            >
              {suspendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Suspend
            </Button>
          )}
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.locations || 0}</p>
                <p className="text-xs text-slate-500">Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Box className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.booths || 0}</p>
                <p className="text-xs text-slate-500">Booths</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.users || 0}</p>
                <p className="text-xs text-slate-500">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.bookings || 0}</p>
                <p className="text-xs text-slate-500">Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <Mail className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-white">{tenant.contact_email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <Phone className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm text-white">{tenant.contact_phone || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <MapPin className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-sm text-white">
                  {tenant.address ? `${tenant.address}, ${tenant.city}, ${tenant.country}` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <CreditCard className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Plan</p>
                <p className="text-sm text-white">{tenant.subscription_status || 'No subscription'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Revenue (This Month)</p>
                <p className="text-sm text-white">
                  {stats?.revenue?.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }) || '0 zł'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <Calendar className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Trial Ends</p>
                <p className="text-sm text-white">
                  {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">Activity timeline coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{tenant.name}"? This action cannot be undone.
              All locations, booths, users, and data associated with this tenant will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Tenant Dialog */}
      <EditTenantDialog
        tenant={tenant}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
