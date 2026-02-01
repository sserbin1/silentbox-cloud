'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useCreateTenant } from '@/hooks/use-super-admin';
import { toast } from 'sonner';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';
import { createTenantSchema, type CreateTenantInput } from '@/lib/validations/tenant';

export default function NewTenantPage() {
  const router = useRouter();
  const createMutation = useCreateTenant();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      country: 'Poland',
    },
  });

  const watchedCountry = watch('country');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    setValue('slug', generateSlug(value));
  };

  const onSubmit = async (data: CreateTenantInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        slug: data.slug,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
      });
      toast.success('Tenant created successfully');
      router.push('/super/tenants');
    } catch (err) {
      toast.error('Failed to create tenant');
    }
  };

  const nameAriaProps = getFieldAriaProps('name', !!errors.name);
  const slugAriaProps = getFieldAriaProps('slug', !!errors.slug);
  const emailAriaProps = getFieldAriaProps('contactEmail', !!errors.contactEmail);
  const phoneAriaProps = getFieldAriaProps('contactPhone', !!errors.contactPhone);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/super/tenants">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Tenant</h1>
          <p className="text-slate-400">Create a new platform operator</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              Tenant Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Basic information about the new tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name & Slug */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  onChange={handleNameChange}
                  placeholder="e.g., Silentbox Warsaw"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  aria-invalid={nameAriaProps['aria-invalid']}
                  aria-describedby={nameAriaProps['aria-describedby']}
                />
                <FormError message={errors.name?.message} id={nameAriaProps.errorId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-300">Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="e.g., silentbox-warsaw"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  aria-invalid={slugAriaProps['aria-invalid']}
                  aria-describedby={slugAriaProps['aria-describedby']}
                />
                <FormError message={errors.slug?.message} id={slugAriaProps.errorId} />
                <p className="text-xs text-slate-500">
                  Used in URLs: app.silentbox.cloud/{watch('slug') || 'your-slug'}
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('contactEmail')}
                  placeholder="contact@company.com"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  aria-invalid={emailAriaProps['aria-invalid']}
                  aria-describedby={emailAriaProps['aria-describedby']}
                />
                <FormError message={errors.contactEmail?.message} id={emailAriaProps.errorId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Contact Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('contactPhone')}
                  placeholder="+48 123 456 789"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  aria-invalid={phoneAriaProps['aria-invalid']}
                  aria-describedby={phoneAriaProps['aria-describedby']}
                />
                <FormError message={errors.contactPhone?.message} id={phoneAriaProps.errorId} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-300">Address</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Street address"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-slate-300">City</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="e.g., Warsaw"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" className="text-slate-300">Country</Label>
                <Select
                  value={watchedCountry}
                  onValueChange={(value) => setValue('country', value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Poland" className="text-white focus:bg-slate-700">Poland</SelectItem>
                    <SelectItem value="Ukraine" className="text-white focus:bg-slate-700">Ukraine</SelectItem>
                    <SelectItem value="Germany" className="text-white focus:bg-slate-700">Germany</SelectItem>
                    <SelectItem value="Czech Republic" className="text-white focus:bg-slate-700">Czech Republic</SelectItem>
                    <SelectItem value="Other" className="text-white focus:bg-slate-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Link href="/super/tenants">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
