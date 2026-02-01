'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useUpdateTenant } from '@/hooks/use-super-admin';
import { toast } from 'sonner';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';

const editTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type EditTenantInput = z.infer<typeof editTenantSchema>;

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface EditTenantDialogProps {
  tenant: Tenant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTenantDialog({ tenant, open, onOpenChange }: EditTenantDialogProps) {
  const updateMutation = useUpdateTenant();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EditTenantInput>({
    resolver: zodResolver(editTenantSchema),
  });

  const watchedCountry = watch('country');

  // Reset form when tenant changes
  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        contactEmail: tenant.contact_email || '',
        contactPhone: tenant.contact_phone || '',
        address: tenant.address || '',
        city: tenant.city || '',
        country: tenant.country || 'Poland',
      });
    }
  }, [tenant, reset]);

  const onSubmit = async (data: EditTenantInput) => {
    if (!tenant) return;

    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        data: {
          name: data.name,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          country: data.country || undefined,
        },
      });
      toast.success('Tenant updated successfully');
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to update tenant');
    }
  };

  const nameAriaProps = getFieldAriaProps('name', !!errors.name);
  const emailAriaProps = getFieldAriaProps('contactEmail', !!errors.contactEmail);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Tenant</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update tenant information. Slug cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Silentbox Warsaw"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              aria-invalid={nameAriaProps['aria-invalid']}
              aria-describedby={nameAriaProps['aria-describedby']}
            />
            <FormError message={errors.name?.message} id={nameAriaProps.errorId} />
          </div>

          {/* Slug (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-slate-300">Slug</Label>
            <Input
              id="slug"
              value={tenant?.slug || ''}
              disabled
              className="bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">Slug cannot be changed after creation</p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-slate-300">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              placeholder="contact@company.com"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              aria-invalid={emailAriaProps['aria-invalid']}
              aria-describedby={emailAriaProps['aria-describedby']}
            />
            <FormError message={errors.contactEmail?.message} id={emailAriaProps.errorId} />
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-slate-300">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              {...register('contactPhone')}
              placeholder="+48 123 456 789"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
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

          {/* City & Country */}
          <div className="grid gap-4 grid-cols-2">
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
