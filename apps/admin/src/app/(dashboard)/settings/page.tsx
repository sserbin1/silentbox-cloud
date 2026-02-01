'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save, Building, Bell, Lock, Loader2, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';
import { tenantSettingsSchema, type TenantSettingsInput } from '@/lib/validations/settings';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { data: settings, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = useForm<TenantSettingsInput>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: settings || {},
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSubmit = async (data: TenantSettingsInput) => {
    try {
      await updateSettings.mutateAsync(data);
      toast.success(t('admin.settings.saved'));
    } catch (err) {
      toast.error(t('admin.common.error'));
    }
  };

  const businessNameAriaProps = getFieldAriaProps('business_name', !!errors.business_name);
  const emailAriaProps = getFieldAriaProps('contact_email', !!errors.contact_email);
  const phoneAriaProps = getFieldAriaProps('contact_phone', !!errors.contact_phone);

  if (isLoading) {
    return (
      <>
        <Header title={t('admin.settings.title')} />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title={t('admin.settings.title')} />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>{t('admin.common.error')}</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('admin.actions.refresh')}
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
      <Header title={t('admin.settings.title')} />

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-w-4xl">
        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {t('admin.settings.tenantName')}
            </CardTitle>
            <CardDescription>{t('admin.settings.general')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.settings.tenantName')}</label>
                <Input
                  {...register('business_name')}
                  placeholder={t('admin.settings.tenantName')}
                  aria-invalid={businessNameAriaProps['aria-invalid']}
                  aria-describedby={businessNameAriaProps['aria-describedby']}
                />
                <FormError message={errors.business_name?.message} id={businessNameAriaProps.errorId} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.users.email')}</label>
                <Input
                  {...register('contact_email')}
                  type="email"
                  placeholder="contact@example.com"
                  aria-invalid={emailAriaProps['aria-invalid']}
                  aria-describedby={emailAriaProps['aria-describedby']}
                />
                <FormError message={errors.contact_email?.message} id={emailAriaProps.errorId} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.users.phone')}</label>
                <Input
                  {...register('contact_phone')}
                  placeholder="+48 123 456 789"
                  aria-invalid={phoneAriaProps['aria-invalid']}
                  aria-describedby={phoneAriaProps['aria-describedby']}
                />
                <FormError message={errors.contact_phone?.message} id={phoneAriaProps.errorId} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.locations.address')}</label>
                <Input {...register('address')} placeholder={t('admin.locations.address')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.locations.city')}</label>
                <Input {...register('city')} placeholder={t('admin.locations.city')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('admin.locations.country')}</label>
                <Input {...register('country')} placeholder={t('admin.locations.country')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('admin.settings.notifications')}
            </CardTitle>
            <CardDescription>{t('admin.settings.emailNotifications')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('admin.settings.emailNotifications')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.settings.emailNotifications')}
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
                  <p className="font-medium">{t('admin.settings.emailNotifications')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.settings.emailNotifications')}
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
                  <p className="font-medium">{t('admin.settings.emailNotifications')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.settings.emailNotifications')}
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
                  <p className="font-medium">{t('admin.settings.smsNotifications')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.settings.smsNotifications')}
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
                  <p className="font-medium">{t('admin.settings.smsNotifications')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.settings.smsNotifications')}
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
              {t('admin.settings.integrations')}
            </CardTitle>
            <CardDescription>{t('admin.settings.integrations')}</CardDescription>
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
                    <p className="font-medium">{t('admin.settings.ttlockIntegration')}</p>
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
                    <p className="font-medium">{t('admin.settings.pushNotifications')}</p>
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
            {t('admin.settings.save')}
          </Button>
        </div>
      </form>
    </>
  );
}
