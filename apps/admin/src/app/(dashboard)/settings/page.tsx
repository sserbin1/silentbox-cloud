'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save, Building, Bell, Lock, Loader2, CreditCard, RefreshCw } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { TenantSettings } from '@/lib/api';

export default function SettingsPage() {
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<TenantSettings>({
    defaultValues: settings || {},
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: TenantSettings) => {
    try {
      await updateSettings.mutateAsync(data);
    } catch (err) {
      // Error is handled by React Query
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Settings" />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Settings" />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Failed to load settings</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" />

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-w-4xl">
        {/* Success/Error Messages */}
        {updateSettings.isSuccess && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
            Settings saved successfully
          </div>
        )}
        {updateSettings.isError && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {updateSettings.error?.message || 'Failed to save settings'}
          </div>
        )}

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Manage your business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <Input {...register('business_name')} placeholder="Your business name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Email</label>
                <Input {...register('contact_email')} type="email" placeholder="contact@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input {...register('contact_phone')} placeholder="+48 123 456 789" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input {...register('address')} placeholder="Street address" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input {...register('city')} placeholder="City" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Input {...register('country')} placeholder="Country" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking Confirmation Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Send email when booking is confirmed
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('notifications.email_booking_confirmation')}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking Reminder Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Send reminder email before booking
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('notifications.email_booking_reminder')}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cancellation Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Send email when booking is cancelled
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('notifications.email_booking_cancellation')}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Booking Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    Send SMS when booking is confirmed
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('notifications.sms_booking_confirmation')}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Booking Reminder</p>
                  <p className="text-sm text-muted-foreground">
                    Send SMS reminder before booking
                  </p>
                </div>
                <input
                  type="checkbox"
                  {...register('notifications.sms_booking_reminder')}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription>Enable or disable external service integrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">Sync bookings with Google Calendar</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  {...register('integrations.google_calendar_enabled')}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">TTLock</p>
                    <p className="text-sm text-muted-foreground">Smart lock integration</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  {...register('integrations.ttlock_enabled')}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Firebase push notifications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  {...register('integrations.push_notifications_enabled')}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}
