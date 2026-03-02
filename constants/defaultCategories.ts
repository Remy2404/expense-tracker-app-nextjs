import { Category } from '@/types';

export const DEFAULT_CATEGORY_PALETTE = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#95E1D3',
  '#A78BFA',
  '#F87171',
  '#38BDF8',
  '#FF4D4D',
  '#FFB6C1',
  '#A52A2A',
  '#fbaf24',
  '#0000FF',
  '#800080',
  '#FF0000',
  '#FFA500',
  '#008000',
  '#9CA3AF',
] as const;

export const MOBILE_DEFAULT_CATEGORIES: Array<
  Pick<Category, 'name' | 'icon' | 'color' | 'type'> & { is_default: boolean }
> = [
  { name: 'Food', icon: 'food', color: DEFAULT_CATEGORY_PALETTE[0], is_default: true, type: 'expense' },
  { name: 'Transport', icon: 'car', color: DEFAULT_CATEGORY_PALETTE[1], is_default: true, type: 'expense' },
  { name: 'Bills', icon: 'zap', color: DEFAULT_CATEGORY_PALETTE[2], is_default: true, type: 'expense' },
  { name: 'Shopping', icon: 'shopping', color: DEFAULT_CATEGORY_PALETTE[3], is_default: true, type: 'expense' },
  { name: 'Entertainment', icon: 'game', color: DEFAULT_CATEGORY_PALETTE[4], is_default: true, type: 'expense' },
  { name: 'Health', icon: 'heart', color: DEFAULT_CATEGORY_PALETTE[5], is_default: true, type: 'expense' },
  { name: 'Housing', icon: 'home', color: DEFAULT_CATEGORY_PALETTE[6], is_default: true, type: 'expense' },
  { name: 'Subscription', icon: 'sparkles', color: DEFAULT_CATEGORY_PALETTE[7], is_default: true, type: 'expense' },
  { name: 'Childcare', icon: 'baby', color: DEFAULT_CATEGORY_PALETTE[8], is_default: true, type: 'expense' },
  { name: 'Pets', icon: 'pet', color: DEFAULT_CATEGORY_PALETTE[9], is_default: true, type: 'expense' },
  { name: 'Maintenance', icon: 'briefcase', color: DEFAULT_CATEGORY_PALETTE[10], is_default: true, type: 'expense' },
  { name: 'Electronics', icon: 'laptop', color: DEFAULT_CATEGORY_PALETTE[11], is_default: true, type: 'expense' },
  { name: 'Clothing', icon: 'shopping', color: DEFAULT_CATEGORY_PALETTE[12], is_default: true, type: 'expense' },
  { name: 'Fees', icon: 'wallet', color: DEFAULT_CATEGORY_PALETTE[13], is_default: true, type: 'expense' },
  { name: 'Tax', icon: 'wallet', color: DEFAULT_CATEGORY_PALETTE[14], is_default: true, type: 'expense' },
  { name: 'Donation', icon: 'gift', color: DEFAULT_CATEGORY_PALETTE[15], is_default: true, type: 'expense' },
  { name: 'Other', icon: 'tag', color: DEFAULT_CATEGORY_PALETTE[16], is_default: true, type: 'expense' },
  { name: 'Salary', icon: 'wallet', color: '#22C55E', is_default: true, type: 'income' },
  { name: 'Freelance', icon: 'briefcase', color: '#14B8A6', is_default: true, type: 'income' },
  { name: 'Investment', icon: 'piggybank', color: '#10B981', is_default: true, type: 'income' },
  { name: 'Gift Income', icon: 'gift', color: '#34D399', is_default: true, type: 'income' },
  { name: 'Refund', icon: 'sparkles', color: '#2DD4BF', is_default: true, type: 'income' },
];
