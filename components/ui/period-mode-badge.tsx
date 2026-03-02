import { Badge } from '@/components/ui/badge';

export type PeriodMode = 'all-time' | 'this-month';

const MODE_LABELS: Record<PeriodMode, string> = {
  'all-time': 'All-time',
  'this-month': 'This Month',
};

type PeriodModeBadgeProps = {
  mode: PeriodMode;
  detail?: string;
};

export function PeriodModeBadge({ mode, detail }: PeriodModeBadgeProps) {
  return (
    <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-wide">
      Period mode: {MODE_LABELS[mode]}
      {detail ? ` • ${detail}` : ''}
    </Badge>
  );
}
