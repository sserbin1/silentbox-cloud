'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
  MapPin,
  Users,
  Box,
} from 'lucide-react';
import { useTenants, useActivateTenant, useSuspendTenant, useDeleteTenant } from '@/hooks/use-super-admin';

function TenantCardSkeleton() {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-slate-800" />
              <Skeleton className="h-4 w-24 bg-slate-800" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full bg-slate-800" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Skeleton className="h-12 bg-slate-800 rounded-lg" />
          <Skeleton className="h-12 bg-slate-800 rounded-lg" />
          <Skeleton className="h-12 bg-slate-800 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
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

export default function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: tenants, isLoading, error, refetch } = useTenants();
  const activateMutation = useActivateTenant();
  const suspendMutation = useSuspendTenant();
  const deleteMutation = useDeleteTenant();

  const filteredTenants = tenants?.filter(
    (tenant: any) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to activate tenant:', error);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await suspendMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  const handleDeleteClick = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTenant) return;
    try {
      await deleteMutation.mutateAsync(selectedTenant.id);
      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-slate-400 mt-1">Manage platform operators</p>
        </div>
        <Link href="/super/tenants/new">
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Tenants Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <>
            <TenantCardSkeleton />
            <TenantCardSkeleton />
            <TenantCardSkeleton />
          </>
        ) : error ? (
          <ErrorCard message="Failed to load tenants" onRetry={() => refetch()} />
        ) : filteredTenants.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-slate-700 mb-4" />
            <p className="text-slate-400 mb-4">
              {searchQuery ? 'No tenants match your search' : 'No tenants yet'}
            </p>
            {!searchQuery && (
              <Link href="/super/tenants/new">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Tenant
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredTenants.map((tenant: any) => (
            <Card key={tenant.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{tenant.name}</h3>
                      <p className="text-sm text-slate-500">{tenant.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      statusColors[tenant.status] || statusColors.pending
                    }`}>
                      {tenant.status}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                        <DropdownMenuItem asChild>
                          <Link href={`/super/tenants/${tenant.id}`} className="flex items-center text-slate-300 focus:text-white focus:bg-slate-800">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-800">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        {tenant.status === 'suspended' ? (
                          <DropdownMenuItem
                            onClick={() => handleActivate(tenant.id)}
                            disabled={activateMutation.isPending}
                            className="text-emerald-400 focus:text-emerald-300 focus:bg-slate-800"
                          >
                            {activateMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-2" />
                            )}
                            Activate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleSuspend(tenant.id)}
                            disabled={suspendMutation.isPending}
                            className="text-amber-400 focus:text-amber-300 focus:bg-slate-800"
                          >
                            {suspendMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Pause className="h-4 w-4 mr-2" />
                            )}
                            Suspend
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(tenant)}
                          className="text-red-400 focus:text-red-300 focus:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{tenant.locations_count || 0}</p>
                      <p className="text-xs text-slate-500">Locations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                    <Box className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{tenant.booths_count || 0}</p>
                      <p className="text-xs text-slate-500">Booths</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                    <Users className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{tenant.users_count || 0}</p>
                      <p className="text-xs text-slate-500">Users</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{tenant.city || tenant.country || 'No location'}</span>
                  <span>Created {new Date(tenant.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{selectedTenant?.name}"? This action cannot be undone.
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
    </div>
  );
}
