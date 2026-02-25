'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  X, Loader2, Target, Plane, Car, Home, GraduationCap, Heart,
  ShoppingBag, Laptop, Gamepad2, Gift, PiggyBank, Wallet, Briefcase,
  Dumbbell, Music, Camera, Book, Coffee, Utensils, Baby, PawPrint,
  Sparkles, Sun, Moon, Star, Zap, Trophy, Flag, Compass, Search
} from 'lucide-react';
import { Goal } from '@/types/goals';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Predefined color palette
const COLOR_PALETTE = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Amber', value: '#D97706' },
];

// Icon map with lucide-react icons and search keywords
const ICON_DATA: Record<string, {
  component: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  keywords: string[];
}> = {
  target: { component: Target, keywords: ['goal', 'aim', 'focus', 'bullseye', 'objective'] },
  plane: { component: Plane, keywords: ['travel', 'flight', 'vacation', 'trip', 'airplane', 'fly'] },
  car: { component: Car, keywords: ['vehicle', 'transport', 'auto', 'drive', 'automobile'] },
  home: { component: Home, keywords: ['house', 'property', 'real estate', 'mortgage', 'living'] },
  graduation: { component: GraduationCap, keywords: ['education', 'school', 'college', 'university', 'degree', 'study'] },
  heart: { component: Heart, keywords: ['love', 'health', 'charity', 'wedding', 'romance'] },
  shopping: { component: ShoppingBag, keywords: ['buy', 'purchase', 'retail', 'store', 'mall', 'clothes'] },
  laptop: { component: Laptop, keywords: ['computer', 'tech', 'work', 'device', 'electronics', 'macbook'] },
  game: { component: Gamepad2, keywords: ['gaming', 'play', 'entertainment', 'fun', 'console', 'video'] },
  gift: { component: Gift, keywords: ['present', 'birthday', 'holiday', 'christmas', 'surprise', 'party'] },
  piggybank: { component: PiggyBank, keywords: ['savings', 'money', 'bank', 'coin', 'save', 'finance'] },
  wallet: { component: Wallet, keywords: ['money', 'cash', 'finance', 'budget', 'card'] },
  briefcase: { component: Briefcase, keywords: ['work', 'business', 'job', 'career', 'professional', 'office'] },
  dumbbell: { component: Dumbbell, keywords: ['fitness', 'gym', 'workout', 'exercise', 'health', 'strength'] },
  music: { component: Music, keywords: ['concert', 'song', 'instrument', 'band', 'spotify', 'audio'] },
  camera: { component: Camera, keywords: ['photo', 'photography', 'picture', 'video', 'lens', 'capture'] },
  book: { component: Book, keywords: ['reading', 'library', 'study', 'learn', 'education', 'kindle'] },
  coffee: { component: Coffee, keywords: ['drink', 'cafe', 'morning', 'espresso', 'starbucks', 'caffeine'] },
  food: { component: Utensils, keywords: ['restaurant', 'dining', 'eat', 'meal', 'dinner', 'lunch'] },
  baby: { component: Baby, keywords: ['child', 'kid', 'infant', 'nursery', 'parenting', 'family'] },
  pet: { component: PawPrint, keywords: ['dog', 'cat', 'animal', 'veterinary', 'puppy', 'kitten'] },
  sparkles: { component: Sparkles, keywords: ['magic', 'celebration', 'special', 'glitter', 'shine'] },
  sun: { component: Sun, keywords: ['summer', 'bright', 'day', 'light', 'warm', 'sunny'] },
  moon: { component: Moon, keywords: ['night', 'sleep', 'dark', 'evening', 'lunar'] },
  star: { component: Star, keywords: ['favorite', 'rating', 'space', 'celebrity', 'premium'] },
  zap: { component: Zap, keywords: ['energy', 'fast', 'power', 'electric', 'quick', 'lightning'] },
  trophy: { component: Trophy, keywords: ['winner', 'award', 'achievement', 'prize', 'champion', 'success'] },
  flag: { component: Flag, keywords: ['milestone', 'country', 'nation', 'marker', 'goal'] },
  compass: { component: Compass, keywords: ['direction', 'navigation', 'explore', 'adventure', 'travel', 'hiking'] },
};

const ICON_OPTIONS = Object.keys(ICON_DATA);

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
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [iconSearch, setIconSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  // Filter icons based on search query (client-side only)
  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return ICON_OPTIONS;

    const query = iconSearch.toLowerCase().trim();
    return ICON_OPTIONS.filter((iconKey) => {
      const iconData = ICON_DATA[iconKey];
      // Match against icon label
      if (iconKey.toLowerCase().includes(query)) return true;
      // Match against keywords
      if (iconData.keywords.some(keyword => keyword.includes(query))) return true;
      return false;
    });
  }, [iconSearch]);

  useEffect(() => {
    if (!isOpen) return;

    if (goalToEdit) {
      const color = goalToEdit.color || '#10B981';
      const icon = goalToEdit.icon || 'target';
      setSelectedColor(color);
      setSelectedIcon(icon);
      setIconSearch('');
      reset({
        name: goalToEdit.name,
        target_amount: goalToEdit.target_amount,
        current_amount: goalToEdit.current_amount,
        deadline: new Date(goalToEdit.deadline).toISOString().split('T')[0],
        color,
        icon,
        is_archived: goalToEdit.is_archived || false,
      });
      return;
    }

    setSelectedColor('#10B981');
    setSelectedIcon('target');
    setIconSearch('');
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

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon);
    setValue('icon', icon);
  };

  if (!isOpen) return null;

  const IconComponent = ICON_DATA[selectedIcon]?.component || Target;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="text-xl font-bold">{isEditMode ? 'Edit Goal' : 'Create Goal'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center gap-3 p-4 bg-foreground/5 rounded-lg">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedColor + '20' }}
            >
              <IconComponent size={24} style={{ color: selectedColor }} />
            </div>
            <div>
              <p className="font-semibold">{register('name').value || 'Goal Name'}</p>
              <p className="text-sm text-foreground/60">Preview</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Goal Name</label>
            <input
              type="text"
              {...register('name')}
              className={`w-full h-10 px-3 bg-transparent border ${errors.name ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              placeholder="e.g., Vacation Fund"
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
                placeholder="1000.00"
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
                placeholder="0.00"
              />
              {errors.current_amount && <p className="text-xs text-red-500">{errors.current_amount.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Deadline</label>
            <input
              type="date"
              {...register('deadline')}
              className={`w-full h-10 px-3 bg-transparent border ${errors.deadline ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
            />
            {errors.deadline && <p className="text-xs text-red-500">{errors.deadline.message}</p>}
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Icon</label>
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full h-9 pl-9 pr-3 bg-transparent border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            {/* Icon Grid */}
            <div className="grid grid-cols-6 gap-2 p-2 border border-foreground/20 rounded-lg max-h-40 overflow-y-auto">
              {filteredIcons.length > 0 ? (
                filteredIcons.map((iconKey) => {
                  const Icon = ICON_DATA[iconKey].component;
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
                      <Icon size={20} />
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

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2 p-2 border border-foreground/20 rounded-lg">
              {COLOR_PALETTE.map((color) => {
                const isSelected = selectedColor === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color.value)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                    }`}
                    style={{
                      backgroundColor: color.value,
                      ringColor: isSelected ? color.value : undefined,
                    }}
                    title={color.name}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register('color')} />
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
