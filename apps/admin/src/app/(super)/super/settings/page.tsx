'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Globe,
  Mail,
  Shield,
  Database,
  Bell,
  CreditCard,
  Lock,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PlatformSettingsPage() {
  const handleSave = () => {
    toast.info('Platform settings are managed via environment variables');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-slate-400 mt-1">Configure global platform settings</p>
      </div>

      {/* General Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-400" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Platform Name</label>
              <Input
                defaultValue="Silentbox Cloud"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Support Email</label>
              <Input
                defaultValue="support@silentbox.cloud"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Default Timezone</label>
              <Input
                defaultValue="Europe/Warsaw"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Default Currency</label>
              <Input
                defaultValue="PLN"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-400" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">SMTP Host</label>
              <Input
                defaultValue="smtp.sendgrid.net"
                className="bg-slate-800 border-slate-700 text-white"
                disabled
              />
              <p className="text-xs text-slate-500">Configured via environment</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">From Address</label>
              <Input
                defaultValue="noreply@silentbox.cloud"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400">Require 2FA for super admin accounts</p>
              </div>
            </div>
            <input type="checkbox" className="h-4 w-4" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-white">Session Timeout</p>
                <p className="text-sm text-slate-400">Auto-logout after inactivity (hours)</p>
              </div>
            </div>
            <Input
              type="number"
              defaultValue="24"
              className="w-20 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-400" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-white">Supabase Database</span>
            </div>
            <span className="text-sm text-emerald-400">Connected</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-white">Stripe Payments</span>
            </div>
            <span className="text-sm text-emerald-400">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-white">TTLock Integration</span>
            </div>
            <span className="text-sm text-amber-400">Configured</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-white">SendGrid Email</span>
            </div>
            <span className="text-sm text-emerald-400">Active</span>
          </div>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-400" />
            Billing Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Trial Period (days)</label>
              <Input
                type="number"
                defaultValue="14"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Starter Plan (PLN)</label>
              <Input
                type="number"
                defaultValue="99"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Professional Plan (PLN)</label>
              <Input
                type="number"
                defaultValue="299"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-400" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div>
              <p className="font-medium text-white">New Tenant Registration</p>
              <p className="text-sm text-slate-400">Notify super admins when a new tenant registers</p>
            </div>
            <input type="checkbox" className="h-4 w-4" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div>
              <p className="font-medium text-white">Payment Failed Alerts</p>
              <p className="text-sm text-slate-400">Alert when subscription payments fail</p>
            </div>
            <input type="checkbox" className="h-4 w-4" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div>
              <p className="font-medium text-white">Trial Expiry Reminders</p>
              <p className="text-sm text-slate-400">Send reminders before trial ends</p>
            </div>
            <input type="checkbox" className="h-4 w-4" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
