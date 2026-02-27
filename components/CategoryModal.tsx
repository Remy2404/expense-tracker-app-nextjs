'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { Category } from '@/types';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_ICON_DATA,
  CATEGORY_ICON_OPTIONS,
} from '@/lib/categoryAppearance';

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
  const [iconSearch, setIconSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'tag',
      color: '#3B82F6',
    },
  });

  const categoryName = useWatch({
    control,
    name: 'name',
  });
  const selectedColor = useWatch({
    control,
    name: 'color',
  }) || '#3B82F6';
  const selectedIcon = useWatch({
    control,
    name: 'icon',
  }) || 'tag';

  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return CATEGORY_ICON_OPTIONS;

    const query = iconSearch.toLowerCase().trim();
    return CATEGORY_ICON_OPTIONS.filter((iconKey) => {
      const iconMeta = CATEGORY_ICON_DATA[iconKey];
      if (iconKey.toLowerCase().includes(query)) return true;
      return iconMeta.keywords.some((keyword) => keyword.includes(query));
    });
  }, [iconSearch]);

  useEffect(() => {
    if (!isOpen) return;

    if (categoryToEdit) {
      const color = categoryToEdit.color || '#3B82F6';
      const icon = categoryToEdit.icon || 'tag';
      reset({
        name: categoryToEdit.name,
        icon,
        color,
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

  const SelectedIconComponent =
    CATEGORY_ICON_DATA[selectedIcon]?.component || CATEGORY_ICON_DATA.tag.component;

  const handleColorSelect = (color: string) => {
    setValue('color', color, { shouldValidate: true });
  };

  const handleIconSelect = (icon: string) => {
    setValue('icon', icon, { shouldValidate: true });
  };

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
          <div className="flex items-center justify-center gap-3 p-4 bg-foreground/5 rounded-lg">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${selectedColor}20` }}
            >
              <SelectedIconComponent size={24} style={{ color: selectedColor }} />
            </div>
            <div>
              <p className="font-semibold">{categoryName || 'Category Name'}</p>
              <p className="text-sm text-foreground/60">Preview</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full h-10 px-3 bg-transparent border ${errors.name ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Icon</label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
              />
              <input
                type="text"
                value={iconSearch}
                onChange={(event) => setIconSearch(event.target.value)}
                placeholder="Search icons..."
                className="w-full h-9 pl-9 pr-3 bg-transparent border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="grid grid-cols-6 gap-2 p-2 border border-foreground/20 rounded-lg max-h-40 overflow-y-auto">
              {filteredIcons.length > 0 ? (
                filteredIcons.map((iconKey) => {
                  const IconComponent = CATEGORY_ICON_DATA[iconKey].component;
                  const isSelected = selectedIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => handleIconSelect(iconKey)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                          : 'hover:bg-foreground/10'
                      }`}
                      title={iconKey}
                    >
                      <IconComponent size={20} />
                    </button>
                  );
                })
              ) : (
                <div className="col-span-6 py-4 text-center text-foreground/40 text-sm">
                  No icons found matching &quot;{iconSearch}&quot;
                </div>
              )}
            </div>
            <input type="hidden" {...register('icon')} />
            {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2 p-2 border border-foreground/20 rounded-lg">
              {CATEGORY_COLOR_PALETTE.map((color) => {
                const isSelected = selectedColor === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color.value)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isSelected ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('color')} />
            {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
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
