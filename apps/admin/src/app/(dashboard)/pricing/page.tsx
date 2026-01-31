'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  DollarSign,
  Percent,
  Clock,
  Gift,
  Save,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  usePricing,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  useCreatePeakHours,
  useUpdatePeakHours,
  useDeletePeakHours,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
} from '@/hooks/use-pricing';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { Discount, PeakHours, CreditPackage } from '@/lib/api';

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState('general');

  // Fetch pricing data
  const { data: pricing, isLoading, error, refetch } = usePricing();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Discount mutations
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();

  // Peak hours mutations
  const createPeakHours = useCreatePeakHours();
  const updatePeakHours = useUpdatePeakHours();
  const deletePeakHours = useDeletePeakHours();

  // Package mutations
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();

  // Local state for general settings form
  const [generalForm, setGeneralForm] = useState({
    base_price_per_hour: settings?.pricing?.base_price_per_hour?.toString() || '30',
    currency: settings?.pricing?.currency || 'PLN',
    min_booking_minutes: settings?.pricing?.min_booking_minutes?.toString() || '30',
    max_booking_hours: settings?.pricing?.max_booking_hours?.toString() || '8',
    grace_period_minutes: settings?.pricing?.grace_period_minutes?.toString() || '15',
    no_show_penalty_percent: settings?.pricing?.no_show_penalty_percent?.toString() || '50',
    free_cancellation_hours: settings?.pricing?.free_cancellation_hours?.toString() || '1',
  });

  // Update local form when settings load
  useEffect(() => {
    if (settings?.pricing) {
      setGeneralForm({
        base_price_per_hour: settings.pricing.base_price_per_hour?.toString() || '30',
        currency: settings.pricing.currency || 'PLN',
        min_booking_minutes: settings.pricing.min_booking_minutes?.toString() || '30',
        max_booking_hours: settings.pricing.max_booking_hours?.toString() || '8',
        grace_period_minutes: settings.pricing.grace_period_minutes?.toString() || '15',
        no_show_penalty_percent: settings.pricing.no_show_penalty_percent?.toString() || '50',
        free_cancellation_hours: settings.pricing.free_cancellation_hours?.toString() || '1',
      });
    }
  }, [settings]);

  const handleSaveGeneral = async () => {
    try {
      await updateSettings.mutateAsync({
        pricing: {
          base_price_per_hour: parseFloat(generalForm.base_price_per_hour),
          currency: generalForm.currency,
          min_booking_minutes: parseInt(generalForm.min_booking_minutes),
          max_booking_hours: parseInt(generalForm.max_booking_hours),
          grace_period_minutes: parseInt(generalForm.grace_period_minutes),
          no_show_penalty_percent: parseInt(generalForm.no_show_penalty_percent),
          free_cancellation_hours: parseInt(generalForm.free_cancellation_hours),
        },
      });
      toast.success('Pricing settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleAddDiscount = async () => {
    try {
      await createDiscount.mutateAsync({
        name: 'New Discount',
        type: 'percentage',
        value: 10,
        min_hours: 1,
        applies_to: 'all',
        is_active: false,
      });
      toast.success('Discount created');
    } catch (err) {
      toast.error('Failed to create discount');
    }
  };

  const handleRemoveDiscount = async (id: string) => {
    try {
      await deleteDiscount.mutateAsync(id);
      toast.success('Discount deleted');
    } catch (err) {
      toast.error('Failed to delete discount');
    }
  };

  const handleUpdateDiscountField = async (id: string, updates: Partial<Discount>) => {
    try {
      await updateDiscount.mutateAsync({ id, data: updates });
    } catch (err) {
      toast.error('Failed to update discount');
    }
  };

  const handleAddPeakHour = async () => {
    try {
      await createPeakHours.mutateAsync({
        day_of_week: 1,
        start_hour: 9,
        end_hour: 17,
        multiplier: 1.2,
        is_active: false,
      });
      toast.success('Peak hour created');
    } catch (err) {
      toast.error('Failed to create peak hour');
    }
  };

  const handleRemovePeakHour = async (id: string) => {
    try {
      await deletePeakHours.mutateAsync(id);
      toast.success('Peak hour deleted');
    } catch (err) {
      toast.error('Failed to delete peak hour');
    }
  };

  const handleUpdatePeakHourField = async (id: string, updates: Partial<PeakHours>) => {
    try {
      await updatePeakHours.mutateAsync({ id, data: updates });
    } catch (err) {
      toast.error('Failed to update peak hour');
    }
  };

  const handleAddPackage = async () => {
    try {
      await createPackage.mutateAsync({
        name: 'New Package',
        credits: 100,
        price: 100,
        bonus_credits: 0,
        is_popular: false,
        is_active: false,
      });
      toast.success('Package created');
    } catch (err) {
      toast.error('Failed to create package');
    }
  };

  const handleRemovePackage = async (id: string) => {
    try {
      await deletePackage.mutateAsync(id);
      toast.success('Package deleted');
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  const handleUpdatePackageField = async (id: string, updates: Partial<CreditPackage>) => {
    try {
      await updatePackage.mutateAsync({ id, data: updates });
    } catch (err) {
      toast.error('Failed to update package');
    }
  };

  // Loading state
  if (isLoading || settingsLoading) {
    return (
      <>
        <Header title="Pricing Configuration" />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header title="Pricing Configuration" />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Failed to load pricing configuration</p>
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

  const discounts = pricing?.discounts || [];
  const peakHours = pricing?.peak_hours || [];
  const packages = pricing?.packages || [];
  const currency = generalForm.currency;

  return (
    <>
      <Header title="Pricing Configuration" />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="general" className="gap-2">
              <DollarSign className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="discounts" className="gap-2">
              <Percent className="h-4 w-4" />
              Discounts
            </TabsTrigger>
            <TabsTrigger value="peak-hours" className="gap-2">
              <Clock className="h-4 w-4" />
              Peak Hours
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <Gift className="h-4 w-4" />
              Credit Packages
            </TabsTrigger>
          </TabsList>

          {/* General Pricing Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Base Pricing</CardTitle>
                <CardDescription>
                  Set the default pricing structure for all booths. Individual booths can override these settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price per Hour</Label>
                    <div className="flex gap-2">
                      <Input
                        id="basePrice"
                        type="number"
                        value={generalForm.base_price_per_hour}
                        onChange={(e) => setGeneralForm({ ...generalForm, base_price_per_hour: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={generalForm.currency}
                        onValueChange={(value) => setGeneralForm({ ...generalForm, currency: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLN">PLN</SelectItem>
                          <SelectItem value="UAH">UAH</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Equivalent to {(parseFloat(generalForm.base_price_per_hour) / 4).toFixed(2)} {currency} per 15 minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minBooking">Minimum Booking Duration</Label>
                    <Select
                      value={generalForm.min_booking_minutes}
                      onValueChange={(value) => setGeneralForm({ ...generalForm, min_booking_minutes: value })}
                    >
                      <SelectTrigger id="minBooking">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxBooking">Maximum Booking Duration</Label>
                    <Select
                      value={generalForm.max_booking_hours}
                      onValueChange={(value) => setGeneralForm({ ...generalForm, max_booking_hours: value })}
                    >
                      <SelectTrigger id="maxBooking">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 hours</SelectItem>
                        <SelectItem value="8">8 hours</SelectItem>
                        <SelectItem value="12">12 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gracePeriod">Grace Period</Label>
                    <Select
                      value={generalForm.grace_period_minutes}
                      onValueChange={(value) => setGeneralForm({ ...generalForm, grace_period_minutes: value })}
                    >
                      <SelectTrigger id="gracePeriod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Time allowed after booking start before marking as no-show
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="noShowPenalty">No-Show Penalty</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="noShowPenalty"
                        type="number"
                        value={generalForm.no_show_penalty_percent}
                        onChange={(e) => setGeneralForm({ ...generalForm, no_show_penalty_percent: e.target.value })}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">% of booking price</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellation">Free Cancellation Window</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cancellation"
                        type="number"
                        value={generalForm.free_cancellation_hours}
                        onChange={(e) => setGeneralForm({ ...generalForm, free_cancellation_hours: e.target.value })}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">hours before start</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full refund if cancelled at least {generalForm.free_cancellation_hours} hour(s) before
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Discount Rules</CardTitle>
                    <CardDescription>
                      Configure automatic discounts based on booking duration or time of week.
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddDiscount} disabled={createDiscount.isPending}>
                    {createDiscount.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {discounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No discounts configured. Click "Add Discount" to create one.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Min Hours</TableHead>
                        <TableHead>Applies To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.map((discount) => (
                        <TableRow key={discount.id}>
                          <TableCell>
                            <Input
                              value={discount.name}
                              onChange={(e) => handleUpdateDiscountField(discount.id, { name: e.target.value })}
                              className="w-40"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={discount.type}
                              onValueChange={(value: 'percentage' | 'fixed') =>
                                handleUpdateDiscountField(discount.id, { type: value })
                              }
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percent</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={discount.value}
                                onChange={(e) =>
                                  handleUpdateDiscountField(discount.id, { value: parseFloat(e.target.value) })
                                }
                                className="w-16"
                              />
                              <span>{discount.type === 'percentage' ? '%' : currency}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={discount.min_hours}
                              onChange={(e) =>
                                handleUpdateDiscountField(discount.id, { min_hours: parseFloat(e.target.value) })
                              }
                              className="w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={discount.applies_to}
                              onValueChange={(value: 'all' | 'weekdays' | 'weekends') =>
                                handleUpdateDiscountField(discount.id, { applies_to: value })
                              }
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Days</SelectItem>
                                <SelectItem value="weekdays">Weekdays</SelectItem>
                                <SelectItem value="weekends">Weekends</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={discount.is_active}
                              onCheckedChange={(checked) =>
                                handleUpdateDiscountField(discount.id, { is_active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveDiscount(discount.id)}
                              disabled={deleteDiscount.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Peak Hours Tab */}
          <TabsContent value="peak-hours" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Peak Hour Pricing</CardTitle>
                    <CardDescription>
                      Set price multipliers for high-demand time slots.
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddPeakHour} disabled={createPeakHours.isPending}>
                    {createPeakHours.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Peak Hour
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {peakHours.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No peak hours configured. Click "Add Peak Hour" to create one.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Multiplier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {peakHours.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>
                            <Select
                              value={rate.day_of_week.toString()}
                              onValueChange={(value) =>
                                handleUpdatePeakHourField(rate.id, { day_of_week: parseInt(value) })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS_OF_WEEK.map((day, index) => (
                                  <SelectItem key={index} value={index.toString()}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={(rate.start_hour ?? 0).toString()}
                              onValueChange={(value) =>
                                handleUpdatePeakHourField(rate.id, { start_hour: parseInt(value) })
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i.toString().padStart(2, '0')}:00
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={(rate.end_hour ?? 0).toString()}
                              onValueChange={(value) =>
                                handleUpdatePeakHourField(rate.id, { end_hour: parseInt(value) })
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i.toString().padStart(2, '0')}:00
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.1"
                                value={rate.multiplier}
                                onChange={(e) =>
                                  handleUpdatePeakHourField(rate.id, { multiplier: parseFloat(e.target.value) })
                                }
                                className="w-20"
                              />
                              <span>x</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rate.is_active}
                              onCheckedChange={(checked) =>
                                handleUpdatePeakHourField(rate.id, { is_active: checked })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemovePeakHour(rate.id)}
                              disabled={deletePeakHours.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Credit Packages</CardTitle>
                    <CardDescription>
                      Configure credit packages that users can purchase. 1 credit = 1 {currency}.
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddPackage} disabled={createPackage.isPending}>
                    {createPackage.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Package
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {packages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No packages configured. Click "Add Package" to create one.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {packages.map((pkg) => (
                      <Card key={pkg.id} className={pkg.is_popular ? 'border-primary' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <Input
                              value={pkg.name}
                              onChange={(e) => handleUpdatePackageField(pkg.id, { name: e.target.value })}
                              className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive -mr-2 -mt-2"
                              onClick={() => handleRemovePackage(pkg.id)}
                              disabled={deletePackage.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {pkg.is_popular && (
                            <Badge className="w-fit">Most Popular</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Credits</Label>
                            <Input
                              type="number"
                              value={pkg.credits}
                              onChange={(e) =>
                                handleUpdatePackageField(pkg.id, { credits: parseInt(e.target.value) })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Price ({currency})</Label>
                            <Input
                              type="number"
                              value={pkg.price}
                              onChange={(e) =>
                                handleUpdatePackageField(pkg.id, { price: parseFloat(e.target.value) })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Bonus Credits</Label>
                            <Input
                              type="number"
                              value={pkg.bonus_credits}
                              onChange={(e) =>
                                handleUpdatePackageField(pkg.id, { bonus_credits: parseInt(e.target.value) })
                              }
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={pkg.is_popular}
                                onCheckedChange={(checked) =>
                                  handleUpdatePackageField(pkg.id, { is_popular: checked })
                                }
                              />
                              <Label className="text-xs">Popular</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={pkg.is_active}
                                onCheckedChange={(checked) =>
                                  handleUpdatePackageField(pkg.id, { is_active: checked })
                                }
                              />
                              <Label className="text-xs">Active</Label>
                            </div>
                          </div>
                          <div className="pt-2 text-center">
                            <p className="text-sm text-muted-foreground">
                              {pkg.bonus_credits > 0 && (
                                <span className="text-green-600 font-medium">
                                  +{pkg.bonus_credits} bonus •{' '}
                                </span>
                              )}
                              {((pkg.credits + pkg.bonus_credits) / pkg.price * 100 - 100).toFixed(0)}% value
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
