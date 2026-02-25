'use client';

import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Category } from '@/types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const categorySchema = yup
  .object({
    name: yup.string().trim().min(2, 'Name must be at least 2 characters').required('Name is required'),
    icon: yup.string().trim().required('Icon is required'),
    color: yup
      .string()
      .trim()
      .matches(/^#([0-9A-F]{3}){1,2}$/i, 'Color must be a valid hex code')
      .required('Color is required'),
  })
  .required();

type CategoryFormData = yup.InferType<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSaving: boolean;
  categoryToEdit?: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
  categoryToEdit,
}: CategoryModalProps) {
  const isEditMode = !!categoryToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'tag',
      color: '#3B82F6',
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (categoryToEdit) {
      reset({
        name: categoryToEdit.name,
        icon: categoryToEdit.icon,
        color: categoryToEdit.color,
      });
      return;
    }

    reset({
      name: '',
      icon: 'tag',
      color: '#3B82F6',
    });
  }, [isOpen, categoryToEdit, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">{isEditMode ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full h-10 px-3 bg-transparent border ${errors.name ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Icon</label>
              <input
                type="text"
                {...register('icon')}
                placeholder="e.g. shopping-cart"
                className={`w-full h-10 px-3 bg-transparent border ${errors.icon ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
              {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color</label>
              <input
                type="text"
                {...register('color')}
                placeholder="#3B82F6"
                className={`w-full h-10 px-3 bg-transparent border ${errors.color ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              />
              {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
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
