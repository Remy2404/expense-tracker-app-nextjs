import {
  Baby,
  Book,
  Briefcase,
  Car,
  Coffee,
  Compass,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Tag,
  Target,
  Trophy,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CategoryIconMeta {
  component: LucideIcon;
  keywords: string[];
}

export const CATEGORY_COLOR_PALETTE = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
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

export const CATEGORY_ICON_DATA: Record<string, CategoryIconMeta> = {
  tag: { component: Tag, keywords: ['tag', 'label', 'category', 'general'] },
  target: { component: Target, keywords: ['goal', 'focus', 'target'] },
  plane: { component: Plane, keywords: ['travel', 'flight', 'vacation', 'trip'] },
  car: { component: Car, keywords: ['car', 'transport', 'vehicle', 'auto'] },
  home: { component: Home, keywords: ['home', 'house', 'rent', 'mortgage'] },
  graduation: { component: GraduationCap, keywords: ['study', 'school', 'education'] },
  heart: { component: Heart, keywords: ['health', 'medical', 'care'] },
  shopping: { component: ShoppingBag, keywords: ['shopping', 'buy', 'store'] },
  laptop: { component: Laptop, keywords: ['tech', 'computer', 'work'] },
  game: { component: Gamepad2, keywords: ['gaming', 'fun', 'play'] },
  gift: { component: Gift, keywords: ['gift', 'present', 'holiday'] },
  piggybank: { component: PiggyBank, keywords: ['save', 'savings', 'money'] },
  wallet: { component: Wallet, keywords: ['wallet', 'finance', 'cash'] },
  briefcase: { component: Briefcase, keywords: ['business', 'job', 'office'] },
  dumbbell: { component: Dumbbell, keywords: ['fitness', 'gym', 'exercise'] },
  music: { component: Music, keywords: ['music', 'song', 'concert'] },
  book: { component: Book, keywords: ['books', 'reading', 'learning'] },
  coffee: { component: Coffee, keywords: ['coffee', 'drink', 'cafe'] },
  food: { component: Utensils, keywords: ['food', 'restaurant', 'meal'] },
  baby: { component: Baby, keywords: ['baby', 'kids', 'child'] },
  pet: { component: PawPrint, keywords: ['pet', 'dog', 'cat', 'animal'] },
  sparkles: { component: Sparkles, keywords: ['special', 'sparkle', 'fun'] },
  sun: { component: Sun, keywords: ['sun', 'summer', 'holiday'] },
  star: { component: Star, keywords: ['favorite', 'priority', 'important'] },
  zap: { component: Zap, keywords: ['energy', 'electric', 'power'] },
  trophy: { component: Trophy, keywords: ['award', 'win', 'achievement'] },
  compass: { component: Compass, keywords: ['direction', 'explore', 'trip'] },
  search: { component: Search, keywords: ['search', 'find', 'discover'] },
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_DATA);

export const getCategoryIconComponent = (iconName?: string): LucideIcon => {
  if (!iconName) return Tag;
  return CATEGORY_ICON_DATA[iconName]?.component ?? Tag;
};
