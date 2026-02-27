import { AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Nudge, NudgesResponse } from '@/types/ai';

type AiNudgesCardProps = {
  data?: NudgesResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const getNudgeIcon = (severity: Nudge['severity']) => {
  if (severity === 'critical') return <ShieldAlert className='h-4 w-4 text-destructive' />;
  if (severity === 'warning') return <AlertTriangle className='h-4 w-4 text-amber-500' />;
  return <Info className='h-4 w-4 text-blue-500' />;
};

const getNudgeLabel = (severity: Nudge['severity']) => {
  if (severity === 'critical') return 'Critical';
  if (severity === 'warning') return 'Warning';
  return 'Info';
};

export function AiNudgesCard({ data, isLoading, isError, onRetry }: AiNudgesCardProps) {
  const nudges = data?.nudges ?? [];

  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='flex items-center gap-2'>
          <Sparkles className='h-4 w-4 text-primary' />
          <CardTitle className='text-base'>AI Assistant Nudges</CardTitle>
        </div>
        <Badge variant='secondary'>{nudges.length}</Badge>
      </CardHeader>
      <CardContent className='space-y-3'>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={`nudge-skeleton-${index}`} className='rounded-lg border border-border p-3'>
              <div className='mb-2 flex items-center gap-2'>
                <Skeleton className='h-4 w-4 rounded-full' />
                <Skeleton className='h-4 w-24' />
              </div>
              <Skeleton className='h-3 w-full' />
              <Skeleton className='mt-2 h-3 w-4/5' />
            </div>
          ))
        ) : isError ? (
          <ErrorState
            title='Unable to load AI nudges'
            description='Please retry to refresh your latest recommendations.'
            onRetry={onRetry}
          />
        ) : nudges.length === 0 ? (
          <EmptyState
            title='No new nudges right now'
            description='You are doing great. Keep logging expenses to get smarter tips.'
          />
        ) : (
          nudges.map((nudge) => (
            <Alert key={nudge.id} variant={nudge.severity === 'critical' ? 'destructive' : 'default'}>
              <div className='flex items-start gap-3'>
                {getNudgeIcon(nudge.severity)}
                <div className='space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <AlertTitle className='mb-0 text-sm'>{nudge.title}</AlertTitle>
                    <Badge variant='outline'>{getNudgeLabel(nudge.severity)}</Badge>
                  </div>
                  <AlertDescription className='text-xs leading-5'>{nudge.body}</AlertDescription>
                </div>
              </div>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
}
