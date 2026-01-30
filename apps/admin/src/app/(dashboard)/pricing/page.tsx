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
  Calendar,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface PricingTier {
  id: string;
  name: string;
  price_per_15min: number;
  min_duration: number;
  max_duration: number;
  is_active: boolean;
}

interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_hours: number;
  applies_to: 'all' | 'weekdays' | 'weekends';
  is_active: boolean;
}

interface PeakHourRate {
  id: string;
  day_of_week: number;
  start_hour: number;
  end_hour: number;
  multiplier: number;
  is_active: boolean;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function PricingPage() {
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General pricing settings
  const [basePricePerHour, setBasePricePerHour] = useState('30');
  const [currency, setCurrency] = useState('PLN');
  const [minBookingMinutes, setMinBookingMinutes] = useState('30');
  const [maxBookingHours, setMaxBookingHours] = useState('8');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState('15');
  const [noShowPenaltyPercent, setNoShowPenaltyPercent] = useState('50');
  const [cancellationHours, setCancellationHours] = useState('1');

  // Discount rules
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([
    {
      id: '1',
      name: '2+ Hours Discount',
      type: 'percentage',
      value: 10,
      min_hours: 2,
      applies_to: 'all',
      is_active: true,
    },
    {
      id: '2',
      name: 'Full Day Discount',
      type: 'percentage',
      value: 20,
      min_hours: 8,
      applies_to: 'all',
      is_active: true,
    },
    {
      id: '3',
      name: 'Weekend Special',
      type: 'percentage',
      value: 15,
      min_hours: 1,
      applies_to: 'weekends',
      is_active: false,
    },
  ]);

  // Peak hour rates
  const [peakHourRates, setPeakHourRates] = useState<PeakHourRate[]>([
    { id: '1', day_of_week: 1, start_hour: 9, end_hour: 12, multiplier: 1.2, is_active: true },
    { id: '2', day_of_week: 1, start_hour: 17, end_hour: 19, multiplier: 1.3, is_active: true },
    { id: '3', day_of_week: 2, start_hour: 9, end_hour: 12, multiplier: 1.2, is_active: true },
    { id: '4', day_of_week: 2, start_hour: 17, end_hour: 19, multiplier: 1.3, is_active: true },
  ]);

  // Credit packages
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([
    { id: '1', name: 'Starter', credits: 50, price: 50, bonus_credits: 0, is_popular: false, is_active: true },
    { id: '2', name: 'Basic', credits: 100, price: 95, bonus_credits: 5, is_popular: false, is_active: true },
    { id: '3', name: 'Pro', credits: 200, price: 180, bonus_credits: 20, is_popular: true, is_active: true },
    { id: '4', name: 'Business', credits: 500, price: 425, bonus_credits: 75, is_popular: false, is_active: true },
  ]);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Pricing settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDiscount = () => {
    const newDiscount: DiscountRule = {
      id: Date.now().toString(),
      name: 'New Discount',
      type: 'percentage',
      value: 10,
      min_hours: 1,
      applies_to: 'all',
      is_active: false,
    };
    setDiscountRules([...discountRules, newDiscount]);
  };

  const handleRemoveDiscount = (id: string) => {
    setDiscountRules(discountRules.filter(d => d.id !== id));
  };

  const handleUpdateDiscount = (id: string, updates: Partial<DiscountRule>) => {
    setDiscountRules(discountRules.map(d =>
      d.id === id ? { ...d, ...updates } : d
    ));
  };

  const handleAddPackage = () => {
    const newPackage: CreditPackage = {
      id: Date.now().toString(),
      name: 'New Package',
      credits: 100,
      price: 100,
      bonus_credits: 0,
      is_popular: false,
      is_active: false,
    };
    setCreditPackages([...creditPackages, newPackage]);
  };

  const handleRemovePackage = (id: string) => {
    setCreditPackages(creditPackages.filter(p => p.id !== id));
  };

  const handleUpdatePackage = (id: string, updates: Partial<CreditPackage>) => {
    setCreditPackages(creditPackages.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const handleAddPeakHour = () => {
    const newPeakHour: PeakHourRate = {
      id: Date.now().toString(),
      day_of_week: 1,
      start_hour: 9,
      end_hour: 17,
      multiplier: 1.2,
      is_active: false,
    };
    setPeakHourRates([...peakHourRates, newPeakHour]);
  };

  const handleRemovePeakHour = (id: string) => {
    setPeakHourRates(peakHourRates.filter(p => p.id !== id));
  };

  const handleUpdatePeakHour = (id: string, updates: Partial<PeakHourRate>) => {
    setPeakHourRates(peakHourRates.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ));
  };

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
                        value={basePricePerHour}
                        onChange={(e) => setBasePricePerHour(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={currency} onValueChange={setCurrency}>
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
                      Equivalent to {(parseFloat(basePricePerHour) / 4).toFixed(2)} {currency} per 15 minutes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minBooking">Minimum Booking Duration</Label>
                    <Select value={minBookingMinutes} onValueChange={setMinBookingMinutes}>
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
                    <Select value={maxBookingHours} onValueChange={setMaxBookingHours}>
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
                    <Select value={gracePeriodMinutes} onValueChange={setGracePeriodMinutes}>
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
                        value={noShowPenaltyPercent}
                        onChange={(e) => setNoShowPenaltyPercent(e.target.value)}
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
                        value={cancellationHours}
                        onChange={(e) => setCancellationHours(e.target.value)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">hours before start</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Full refund if cancelled at least {cancellationHours} hour(s) before
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={isSaving}>
                    {isSaving ? (
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
                  <Button onClick={handleAddDiscount}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                    {discountRules.map((discount) => (
                      <TableRow key={discount.id}>
                        <TableCell>
                          <Input
                            value={discount.name}
                            onChange={(e) => handleUpdateDiscount(discount.id, { name: e.target.value })}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={discount.type}
                            onValueChange={(value: 'percentage' | 'fixed') =>
                              handleUpdateDiscount(discount.id, { type: value })
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
                                handleUpdateDiscount(discount.id, { value: parseFloat(e.target.value) })
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
                              handleUpdateDiscount(discount.id, { min_hours: parseFloat(e.target.value) })
                            }
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={discount.applies_to}
                            onValueChange={(value: 'all' | 'weekdays' | 'weekends') =>
                              handleUpdateDiscount(discount.id, { applies_to: value })
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
                              handleUpdateDiscount(discount.id, { is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveDiscount(discount.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveGeneral} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Discounts
                  </Button>
                </div>
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
                  <Button onClick={handleAddPeakHour}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Peak Hour
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                    {peakHourRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <Select
                            value={rate.day_of_week.toString()}
                            onValueChange={(value) =>
                              handleUpdatePeakHour(rate.id, { day_of_week: parseInt(value) })
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
                            value={rate.start_hour.toString()}
                            onValueChange={(value) =>
                              handleUpdatePeakHour(rate.id, { start_hour: parseInt(value) })
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
                            value={rate.end_hour.toString()}
                            onValueChange={(value) =>
                              handleUpdatePeakHour(rate.id, { end_hour: parseInt(value) })
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
                                handleUpdatePeakHour(rate.id, { multiplier: parseFloat(e.target.value) })
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
                              handleUpdatePeakHour(rate.id, { is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemovePeakHour(rate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveGeneral} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Peak Hours
                  </Button>
                </div>
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
                  <Button onClick={handleAddPackage}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Package
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {creditPackages.map((pkg) => (
                    <Card key={pkg.id} className={pkg.is_popular ? 'border-primary' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <Input
                            value={pkg.name}
                            onChange={(e) => handleUpdatePackage(pkg.id, { name: e.target.value })}
                            className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive -mr-2 -mt-2"
                            onClick={() => handleRemovePackage(pkg.id)}
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
                              handleUpdatePackage(pkg.id, { credits: parseInt(e.target.value) })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Price ({currency})</Label>
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) =>
                              handleUpdatePackage(pkg.id, { price: parseFloat(e.target.value) })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Bonus Credits</Label>
                          <Input
                            type="number"
                            value={pkg.bonus_credits}
                            onChange={(e) =>
                              handleUpdatePackage(pkg.id, { bonus_credits: parseInt(e.target.value) })
                            }
                          />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={pkg.is_popular}
                              onCheckedChange={(checked) =>
                                handleUpdatePackage(pkg.id, { is_popular: checked })
                              }
                            />
                            <Label className="text-xs">Popular</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={pkg.is_active}
                              onCheckedChange={(checked) =>
                                handleUpdatePackage(pkg.id, { is_active: checked })
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

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSaveGeneral} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Packages
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
