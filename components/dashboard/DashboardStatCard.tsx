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
    <Card className='h-full'>
      <CardHeader className='space-y-3 pb-2'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
          {badgeLabel ? (
            <Badge variant='secondary' className='whitespace-nowrap'>
              {badgeLabel}
            </Badge>
          ) : null}
        </div>
        {icon ? <div className='text-muted-foreground'>{icon}</div> : null}
      </CardHeader>
      <CardContent className='space-y-1'>
        <p className={cn('text-3xl font-bold tracking-tight', valueClassName)}>{value}</p>
        {subtitle ? <p className='text-sm text-muted-foreground'>{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}
