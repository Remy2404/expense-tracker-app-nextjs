import {
  BarChart3,
  Bell,
  Home,
  PieChart,
  Receipt,
  RefreshCw,
  Settings,
  Tags,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavGroupKey = 'core' | 'planning' | 'insights' | 'collaboration' | 'system';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  matches?: string[];
};

export const NAV_GROUPS: Record<NavGroupKey, { label: string; items: NavItem[] }> = {
  core: {
    label: 'Core',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Categories', href: '/categories', icon: Tags },
    ],
  },
  planning: {
    label: 'Planning',
    items: [
      { name: 'Budgets', href: '/budgets', icon: PieChart },
      { name: 'Recurring', href: '/recurring', icon: RefreshCw },
      { name: 'Goals', href: '/goals', icon: Target, matches: ['/goals/'] },
    ],
  },
  insights: {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  collaboration: {
    label: 'Collaboration',
    items: [{ name: 'Bill Split', href: '/bill-split', icon: Users, matches: ['/bill-split/'] }],
  },
  system: {
    label: 'System',
    items: [{ name: 'Settings', href: '/settings', icon: Settings }],
  },
};

export const NAV_GROUP_ORDER: NavGroupKey[] = ['core', 'planning', 'insights', 'collaboration', 'system'];

export const isNavItemActive = (pathname: string, item: NavItem): boolean => {
  if (pathname === item.href) return true;
  if (item.matches?.some((prefix) => pathname.startsWith(prefix))) return true;
  return false;
};
