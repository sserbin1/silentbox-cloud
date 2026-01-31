'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Lock,
  Unlock,
  Battery,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  AlertTriangle,
  AlertCircle,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { useDevices, useUnlockDevice, useLockDevice, useSyncDevice } from '@/hooks/use-devices';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  online: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  offline: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const getBatteryColor = (level: number | null | undefined) => {
  if (level === null || level === undefined) return 'text-muted-foreground';
  if (level > 50) return 'text-green-500';
  if (level > 20) return 'text-yellow-500';
  return 'text-red-500';
};

const getDeviceStatus = (lastSeen: string | null | undefined): 'online' | 'offline' | 'unknown' => {
  if (!lastSeen) return 'unknown';
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 60) return 'offline';
  return 'offline';
};

const formatLastSeen = (lastSeen: string | null | undefined): string => {
  if (!lastSeen) return 'Never';
  try {
    return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

function DeviceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
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

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDeviceId, setLoadingDeviceId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'unlock' | 'lock' | 'sync' | null>(null);

  const { data: devices, isLoading, error, refetch, isRefetching } = useDevices();
  const unlockDevice = useUnlockDevice();
  const lockDevice = useLockDevice();
  const syncDevice = useSyncDevice();

  const filteredDevices = devices?.filter(
    (device) =>
      device.external_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.device_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.booths?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.booths?.locations?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const devicesWithStatus = filteredDevices.map(device => ({
    ...device,
    computedStatus: getDeviceStatus(device.last_seen),
  }));

  const onlineCount = devicesWithStatus.filter((d) => d.computedStatus === 'online').length;
  const offlineCount = devicesWithStatus.filter((d) => d.computedStatus === 'offline').length;
  const lowBatteryCount = devicesWithStatus.filter((d) => (d.battery_level ?? 100) < 20).length;

  const handleUnlock = async (deviceId: string, deviceName: string) => {
    setLoadingDeviceId(deviceId);
    setLoadingAction('unlock');
    try {
      await unlockDevice.mutateAsync(deviceId);
      toast.success(`${deviceName} unlocked successfully`);
    } catch (err) {
      toast.error(`Failed to unlock ${deviceName}`);
    } finally {
      setLoadingDeviceId(null);
      setLoadingAction(null);
    }
  };

  const handleLock = async (deviceId: string, deviceName: string) => {
    setLoadingDeviceId(deviceId);
    setLoadingAction('lock');
    try {
      await lockDevice.mutateAsync(deviceId);
      toast.success(`${deviceName} locked successfully`);
    } catch (err) {
      toast.error(`Failed to lock ${deviceName}`);
    } finally {
      setLoadingDeviceId(null);
      setLoadingAction(null);
    }
  };

  const handleSync = async (deviceId: string, deviceName: string) => {
    setLoadingDeviceId(deviceId);
    setLoadingAction('sync');
    try {
      await syncDevice.mutateAsync(deviceId);
      toast.success(`${deviceName} synced successfully`);
    } catch (err) {
      toast.error(`Failed to sync ${deviceName}`);
    } finally {
      setLoadingDeviceId(null);
      setLoadingAction(null);
    }
  };

  return (
    <>
      <Header title="Devices" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Devices</p>
                    <p className="text-2xl font-bold">{devices?.length || 0}</p>
                  </div>
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Online</p>
                    <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
                  </div>
                  <Wifi className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offline</p>
                    <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
                  </div>
                  <WifiOff className="h-8 w-8 text-red-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Battery</p>
                    <p className="text-2xl font-bold text-yellow-600">{lowBatteryCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
              <DeviceCardSkeleton />
            </>
          ) : error ? (
            <ErrorCard message="Failed to load devices" onRetry={() => refetch()} />
          ) : devicesWithStatus.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Smartphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No devices match your search' : 'No devices configured yet'}
              </p>
            </div>
          ) : (
            devicesWithStatus.map((device) => {
              const deviceName = device.external_id || `Device ${device.id.slice(0, 8)}`;
              const isDeviceLoading = loadingDeviceId === device.id;
              const isLocked = device.status === 'locked';

              return (
                <Card key={device.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {device.status === 'locked' ? (
                            <Lock className="h-4 w-4" />
                          ) : device.status === 'unlocked' ? (
                            <Unlock className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          {deviceName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {device.booths?.name || 'Unassigned'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[device.computedStatus]
                        }`}
                      >
                        {device.computedStatus}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {device.booths?.locations?.name || 'No location'}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Battery className={`h-4 w-4 ${getBatteryColor(device.battery_level)}`} />
                        <span className={getBatteryColor(device.battery_level)}>
                          {device.battery_level !== null && device.battery_level !== undefined
                            ? `${device.battery_level}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.computedStatus === 'online' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatLastSeen(device.last_seen)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground capitalize">
                      Type: {device.device_type || 'Unknown'}
                    </div>

                    <div className="flex gap-2">
                      {isLocked ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={device.computedStatus === 'offline' || isDeviceLoading}
                          onClick={() => handleUnlock(device.id, deviceName)}
                        >
                          {isDeviceLoading && loadingAction === 'unlock' ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Unlock className="h-4 w-4 mr-1" />
                          )}
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={device.computedStatus === 'offline' || isDeviceLoading}
                          onClick={() => handleLock(device.id, deviceName)}
                        >
                          {isDeviceLoading && loadingAction === 'lock' ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Lock className="h-4 w-4 mr-1" />
                          )}
                          Lock
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={device.computedStatus === 'offline' || isDeviceLoading}
                        onClick={() => handleSync(device.id, deviceName)}
                        title="Sync device"
                      >
                        {isDeviceLoading && loadingAction === 'sync' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm" title="Device settings">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
