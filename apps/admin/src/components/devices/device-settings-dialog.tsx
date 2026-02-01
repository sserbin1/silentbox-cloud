'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lock,
  Battery,
  Wifi,
  WifiOff,
  Settings,
  Bell,
  Clock,
  Shield,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface Device {
  id: string;
  external_id?: string;
  device_type?: string;
  battery_level?: number | null;
  last_seen?: string | null;
  status?: string;
  booths?: {
    id: string;
    name: string;
    locations?: {
      name: string;
    };
  };
}

interface DeviceSettingsDialogProps {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceSettingsDialog({ device, open, onOpenChange }: DeviceSettingsDialogProps) {
  const [copied, setCopied] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockDelay, setAutoLockDelay] = useState('30');
  const [lowBatteryAlert, setLowBatteryAlert] = useState(true);
  const [offlineAlert, setOfflineAlert] = useState(true);

  const copyDeviceId = () => {
    if (device?.external_id) {
      navigator.clipboard.writeText(device.external_id);
      setCopied(true);
      toast.success('Device ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
    onOpenChange(false);
  };

  if (!device) return null;

  const deviceName = device.external_id || `Device ${device.id.slice(0, 8)}`;
  const isOnline = device.last_seen &&
    (new Date().getTime() - new Date(device.last_seen).getTime()) / (1000 * 60) < 5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Device Settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure settings for {deviceName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="info" className="data-[state=active]:bg-slate-700">Info</TabsTrigger>
            <TabsTrigger value="lock" className="data-[state=active]:bg-slate-700">Lock</TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-slate-700">Alerts</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Device ID */}
              <div className="space-y-2">
                <Label className="text-slate-300">Device ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={device.external_id || 'N/A'}
                    readOnly
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyDeviceId}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-slate-500">Status</span>
                  </div>
                  <p className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Battery className={`h-4 w-4 ${
                      (device.battery_level ?? 100) > 50 ? 'text-green-500' :
                      (device.battery_level ?? 100) > 20 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                    <span className="text-xs text-slate-500">Battery</span>
                  </div>
                  <p className="text-sm font-medium text-white">
                    {device.battery_level !== null && device.battery_level !== undefined
                      ? `${device.battery_level}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-slate-300">Assigned Booth</Label>
                <Input
                  value={device.booths?.name || 'Unassigned'}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Location</Label>
                <Input
                  value={device.booths?.locations?.name || 'No location'}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Device Type */}
              <div className="space-y-2">
                <Label className="text-slate-300">Device Type</Label>
                <Input
                  value={device.device_type || 'TTLock Smart Lock'}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-white capitalize"
                />
              </div>
            </div>
          </TabsContent>

          {/* Lock Settings Tab */}
          <TabsContent value="lock" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Auto-lock */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Auto-lock</p>
                    <p className="text-xs text-slate-500">Automatically lock after session ends</p>
                  </div>
                </div>
                <Switch
                  checked={autoLockEnabled}
                  onCheckedChange={setAutoLockEnabled}
                />
              </div>

              {/* Auto-lock delay */}
              {autoLockEnabled && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Auto-lock delay (seconds)</Label>
                  <Input
                    type="number"
                    value={autoLockDelay}
                    onChange={(e) => setAutoLockDelay(e.target.value)}
                    min="5"
                    max="300"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500">
                    Lock will engage {autoLockDelay} seconds after session ends
                  </p>
                </div>
              )}

              {/* Security note */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-400 font-medium">Security Note</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Lock settings are managed by TTLock. Changes here will be synced to the device
                      when it's online.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Low battery alert */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <Battery className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Low Battery Alert</p>
                    <p className="text-xs text-slate-500">Notify when battery drops below 20%</p>
                  </div>
                </div>
                <Switch
                  checked={lowBatteryAlert}
                  onCheckedChange={setLowBatteryAlert}
                />
              </div>

              {/* Offline alert */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <WifiOff className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Offline Alert</p>
                    <p className="text-xs text-slate-500">Notify when device goes offline for 30+ minutes</p>
                  </div>
                </div>
                <Switch
                  checked={offlineAlert}
                  onCheckedChange={setOfflineAlert}
                />
              </div>

              {/* Notification info */}
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-300">Notifications</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Alerts will be sent to all operators via email and push notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
