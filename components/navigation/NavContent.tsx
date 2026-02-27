'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUP_ORDER, NAV_GROUPS, isNavItemActive } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type NavContentProps = {
  onNavigate?: () => void;
};

export function NavContent({ onNavigate }: NavContentProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="space-y-5">
      {NAV_GROUP_ORDER.map((groupKey, index) => {
        const group = NAV_GROUPS[groupKey];

        return (
          <div key={groupKey} className="space-y-2">
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isNavItemActive(pathname, item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {index < NAV_GROUP_ORDER.length - 1 ? <Separator className="mt-4" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
