import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const PageSkeleton: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-background">
    {/* Header skeleton */}
    <div className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Content skeleton */}
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </main>

    {/* Status bar skeleton */}
    <div className="border-t border-border/50 bg-card/80 py-3 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

export default PageSkeleton;
