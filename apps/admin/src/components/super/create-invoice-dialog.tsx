'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useCreateInvoice, useTenants } from '@/hooks/use-super-admin';
import { toast } from 'sonner';
import { FormError, getFieldAriaProps } from '@/components/ui/form-error';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Price must be positive'),
});

const createInvoiceSchema = z.object({
  tenant_id: z.string().min(1, 'Please select a tenant'),
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const createMutation = useCreateInvoice();
  const { data: tenants, isLoading: tenantsLoading } = useTenants();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      tenant_id: '',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedTenantId = watch('tenant_id');

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unit_price || 0);
    }, 0);
  };

  const onSubmit = async (data: CreateInvoiceInput) => {
    try {
      await createMutation.mutateAsync({
        tenant_id: data.tenant_id,
        amount: calculateTotal(),
        due_date: data.due_date,
        description: data.description,
        items: data.items,
      });
      toast.success('Invoice created successfully');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to create invoice');
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const tenantAriaProps = getFieldAriaProps('tenant_id', !!errors.tenant_id);
  const dueDateAriaProps = getFieldAriaProps('due_date', !!errors.due_date);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Invoice</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new invoice for a tenant
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label htmlFor="tenant_id" className="text-slate-300">Tenant *</Label>
            <Select
              value={watchedTenantId}
              onValueChange={(value) => setValue('tenant_id', value)}
              disabled={tenantsLoading}
            >
              <SelectTrigger
                className="bg-slate-800 border-slate-700 text-white"
                aria-invalid={tenantAriaProps['aria-invalid']}
              >
                <SelectValue placeholder={tenantsLoading ? 'Loading...' : 'Select tenant'} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {tenants?.map((tenant) => (
                  <SelectItem
                    key={tenant.id}
                    value={tenant.id}
                    className="text-white focus:bg-slate-700"
                  >
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError message={errors.tenant_id?.message} id={tenantAriaProps.errorId} />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-slate-300">Due Date *</Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              className="bg-slate-800 border-slate-700 text-white"
              aria-invalid={dueDateAriaProps['aria-invalid']}
            />
            <FormError message={errors.due_date?.message} id={dueDateAriaProps.errorId} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Invoice description (optional)"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
            />
          </div>

          {/* Invoice Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Item description"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-red-400">{errors.items[index]?.description?.message}</p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-slate-500">Quantity</Label>
                    <Input
                      type="number"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      min="1"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Unit Price (PLN)</Label>
                    <Input
                      type="number"
                      {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                      min="0"
                      step="0.01"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Total</Label>
                    <div className="h-10 flex items-center px-3 rounded-md bg-slate-800/50 border border-slate-700 text-white">
                      {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0)).toFixed(2)} zł
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {errors.items?.message && (
              <p className="text-xs text-red-400">{errors.items.message}</p>
            )}
          </div>

          {/* Total */}
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-emerald-400">
                {calculateTotal().toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
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
                'Create Invoice'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
