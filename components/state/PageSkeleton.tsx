import { Skeleton } from '@/components/ui/skeleton';

type PageSkeletonProps = {
  cards?: number;
  rows?: number;
};

export function PageSkeleton({ cards = 3, rows = 6 }: PageSkeletonProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={`card-${index}`} className="h-24 w-full rounded-xl animate-shimmer" />
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={`row-${index}`}
            className="h-10 w-full rounded-lg animate-shimmer"
            style={{ animationDelay: `${index * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}
