'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Lock,
  Unlock,
  Battery,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  AlertTriangle,
} from 'lucide-react';

const devices = [
  {
    id: '1',
    name: 'Lock A1-001',
    booth: 'Booth A1',
    location: 'Warsaw Central',
    type: 'ttlock',
    status: 'online',
    lockStatus: 'locked',
    battery: 85,
    lastSeen: '2 minutes ago',
    firmware: 'v3.2.1',
  },
  {
    id: '2',
    name: 'Lock B2-001',
    booth: 'Booth B2',
    location: 'Warsaw Central',
    type: 'ttlock',
    status: 'online',
    lockStatus: 'unlocked',
    battery: 62,
    lastSeen: '1 minute ago',
    firmware: 'v3.2.1',
  },
  {
    id: '3',
    name: 'Lock C1-001',
    booth: 'Booth C1',
    location: 'Krakow Mall',
    type: 'ttlock',
    status: 'offline',
    lockStatus: 'unknown',
    battery: 15,
    lastSeen: '3 hours ago',
    firmware: 'v3.1.0',
  },
  {
    id: '4',
    name: 'Lock D1-001',
    booth: 'Booth D1',
    location: 'Gdansk Station',
    type: 'ttlock',
    status: 'online',
    lockStatus: 'locked',
    battery: 92,
    lastSeen: '30 seconds ago',
    firmware: 'v3.2.1',
  },
  {
    id: '5',
    name: 'Lock A2-001',
    booth: 'Booth A2',
    location: 'Warsaw Central',
    type: 'ttlock',
    status: 'online',
    lockStatus: 'locked',
    battery: 78,
    lastSeen: '5 minutes ago',
    firmware: 'v3.2.0',
  },
];

const statusColors: Record<string, string> = {
  online: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  offline: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const getBatteryColor = (level: number) => {
  if (level > 50) return 'text-green-500';
  if (level > 20) return 'text-yellow-500';
  return 'text-red-500';
};

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.booth.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const lowBatteryCount = devices.filter((d) => d.battery < 20).length;

  return (
    <>
      <Header title="Devices" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">{devices.length}</p>
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
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </div>
        </div>

        {/* Devices Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card key={device.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {device.lockStatus === 'locked' ? (
                        <Lock className="h-4 w-4" />
                      ) : device.lockStatus === 'unlocked' ? (
                        <Unlock className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {device.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{device.booth}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[device.status]
                    }`}
                  >
                    {device.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">{device.location}</div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Battery className={`h-4 w-4 ${getBatteryColor(device.battery)}`} />
                    <span className={getBatteryColor(device.battery)}>{device.battery}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status === 'online' ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground">{device.lastSeen}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">Firmware: {device.firmware}</div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={device.status === 'offline'}
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Unlock
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
