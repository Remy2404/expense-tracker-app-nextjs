'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUP_ORDER, NAV_GROUPS, isNavItemActive } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type NavContentProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function NavContent({ collapsed = false, onNavigate }: NavContentProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={100}>
      <nav aria-label="Primary" className="space-y-5">
        {NAV_GROUP_ORDER.map((groupKey, index) => {
          const group = NAV_GROUPS[groupKey];

          return (
            <div key={groupKey} className="space-y-2">
              {collapsed ? (
                <div className="px-2">
                  <Separator />
                  <span className="sr-only">{group.label}</span>
                </div>
              ) : (
                <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isNavItemActive(pathname, item);
                  const Icon = item.icon;
                  const itemClassName = cn(
                    'flex min-h-11 items-center rounded-lg text-sm font-medium transition-all duration-200',
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                  );
                  const itemContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      aria-label={collapsed ? item.name : undefined}
                      onClick={onNavigate}
                      className={itemClassName}
                    >
                      <Icon size={18} className={cn("transition-transform", active && "scale-110")} />
                      {collapsed ? <span className="sr-only">{item.name}</span> : item.name}
                    </Link>
                  );

                  if (!collapsed) {
                    return itemContent;
                  }

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {index < NAV_GROUP_ORDER.length - 1 ? <Separator className="mt-4" /> : null}
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
