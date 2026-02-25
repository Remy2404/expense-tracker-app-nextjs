'use client';

import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Goal } from '@/types/goals';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const goalSchema = yup
  .object({
    name: yup.string().trim().min(2, 'Name must be at least 2 characters').required('Name is required'),
    target_amount: yup
      .number()
      .typeError('Target amount must be a number')
      .positive('Target amount must be greater than 0')
      .required('Target amount is required'),
    current_amount: yup
      .number()
      .typeError('Current amount must be a number')
      .min(0, 'Current amount cannot be negative')
      .required('Current amount is required'),
    deadline: yup.string().required('Deadline is required'),
    color: yup
      .string()
      .trim()
      .matches(/^#([0-9A-F]{3}){1,2}$/i, 'Color must be a valid hex code')
      .required('Color is required'),
    icon: yup.string().trim().required('Icon is required'),
    is_archived: yup.boolean().default(false),
  })
  .required();

type GoalFormData = yup.InferType<typeof goalSchema>;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  isSaving: boolean;
  goalToEdit?: Goal | null;
}

export function GoalModal({ isOpen, onClose, onSubmit, isSaving, goalToEdit }: GoalModalProps) {
  const isEditMode = !!goalToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: yupResolver(goalSchema),
    defaultValues: {
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: new Date().toISOString().split('T')[0],
      color: '#10B981',
      icon: 'target',
      is_archived: false,
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (goalToEdit) {
      reset({
        name: goalToEdit.name,
        target_amount: goalToEdit.target_amount,
        current_amount: goalToEdit.current_amount,
        deadline: new Date(goalToEdit.deadline).toISOString().split('T')[0],
        color: goalToEdit.color,
        icon: goalToEdit.icon,
        is_archived: goalToEdit.is_archived || false,
      });
      return;
    }

    reset({
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: new Date().toISOString().split('T')[0],
      color: '#10B981',
      icon: 'target',
      is_archived: false,
    });
  }, [isOpen, goalToEdit, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">{isEditMode ? 'Edit Goal' : 'Create Goal'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Goal Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full h-10 px-3 bg-transparent border ${errors.name ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target Amount</label>
              <input
                type="number"
                step="0.01"
                {...register('target_amount')}
                className={`w-full h-10 px-3 bg-transparent border ${errors.target_amount ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
              {errors.target_amount && <p className="text-xs text-red-500">{errors.target_amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current Amount</label>
              <input
                type="number"
                step="0.01"
                {...register('current_amount')}
                className={`w-full h-10 px-3 bg-transparent border ${errors.current_amount ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
              {errors.current_amount && <p className="text-xs text-red-500">{errors.current_amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Deadline</label>
              <input
                type="date"
                {...register('deadline')}
                className={`w-full h-10 px-3 bg-transparent border ${errors.deadline ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
              {errors.deadline && <p className="text-xs text-red-500">{errors.deadline.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Icon</label>
              <input
                type="text"
                {...register('icon')}
                className={`w-full h-10 px-3 bg-transparent border ${errors.icon ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
              {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <input
              type="text"
              {...register('color')}
              placeholder="#10B981"
              className={`w-full h-10 px-3 bg-transparent border ${errors.color ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_archived')} className="rounded border-border" />
            Mark as archived
          </label>

          <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground w-32 py-2.5 rounded-lg flex items-center justify-center font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
