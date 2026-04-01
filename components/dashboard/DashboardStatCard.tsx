import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DashboardStatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  badgeLabel?: string;
  valueClassName?: string;
  icon?: ReactNode;
};

export function DashboardStatCard({
  title,
  value,
  subtitle,
  badgeLabel,
  valueClassName,
  icon,
}: DashboardStatCardProps) {
  return (
    <Card className="h-full group overflow-hidden relative">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardHeader className="space-y-3 pb-2 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            {title}
          </CardTitle>
          {badgeLabel ? (
            <Badge variant="secondary" className="whitespace-nowrap transition-transform group-hover:scale-105">
              {badgeLabel}
            </Badge>
          ) : null}
        </div>
        {icon ? (
          <div className="text-muted-foreground transition-all group-hover:scale-110 group-hover:text-primary">
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 relative z-10">
        <p className={cn('text-3xl font-bold tracking-tight transition-all duration-300 animate-count-up', valueClassName)}>
          {value}
        </p>
        {subtitle ? (
          <p className="text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
            {subtitle}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
