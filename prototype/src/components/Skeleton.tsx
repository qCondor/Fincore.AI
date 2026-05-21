'use client';

/**
 * Shimmer skeleton components for Fincore loading states.
 * Matches the Glassmorphism design system.
 */

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div
      className={`bg-white/10 rounded-lg ${animate ? 'skeleton-shimmer' : ''} ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`liquid-glass rounded-[20px] p-4 ${className}`}>
      <div className="flex gap-4">
        <Skeleton className="w-[90px] h-[90px] rounded-[14px] shrink-0" />
        <div className="flex-1 space-y-2 py-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonOceanScores() {
  const traits = ['O', 'C', 'E', 'A', 'N'];
  return (
    <div className="space-y-4">
      {traits.map((trait) => (
        <div key={trait} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonScanResult() {
  return (
    <div className="space-y-4 px-5">
      {/* Product card skeleton */}
      <SkeletonCard />

      {/* Verdict skeleton */}
      <Skeleton className="h-16 w-full rounded-[20px]" />

      {/* Price cards skeleton */}
      <div className="flex gap-3">
        <div className="flex-1 liquid-glass rounded-[20px] p-4">
          <Skeleton className="h-3 w-20 mx-auto mb-2" />
          <Skeleton className="h-10 w-24 mx-auto" />
        </div>
        <div className="flex-1 liquid-glass rounded-[20px] p-4">
          <Skeleton className="h-3 w-20 mx-auto mb-2" />
          <Skeleton className="h-10 w-24 mx-auto" />
        </div>
      </div>

      {/* Reasoning section skeleton */}
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-[200px] w-full rounded-[20px]" />
    </div>
  );
}

export function SkeletonProfileInsights() {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-[22px] mx-4 mb-3.5 border border-white/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <h3 className="font-sans text-[15px] font-bold text-text-primary mb-3">How Faith Will Help You</h3>
      <div className="p-4 bg-primary-ultra border-l-[3px] border-primary rounded-r-xl">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full bg-primary/10" />
          <Skeleton className="h-4 w-full bg-primary/10" />
          <Skeleton className="h-4 w-3/4 bg-primary/10" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonFinancialHealth() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <Skeleton className="h-4 w-40 bg-surface" />
        <Skeleton className="h-6 w-16 bg-surface" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full bg-surface" />
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-3 w-32 bg-surface" />
      </div>
    </div>
  );
}

export function SkeletonProcessingPreview() {
  return (
    <div className="w-full max-w-[280px] mx-auto mt-6 space-y-3">
      {/* Mini product card preview */}
      <div className="glass-dark rounded-[20px] p-3">
        <div className="flex gap-3">
          <Skeleton className="w-[50px] h-[50px] rounded-[10px] shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      </div>

      {/* Mini price cards */}
      <div className="flex gap-2">
        <div className="flex-1 glass-dark rounded-[14px] p-2.5 text-center">
          <Skeleton className="h-2 w-12 mx-auto mb-1.5" />
          <Skeleton className="h-5 w-14 mx-auto" />
        </div>
        <div className="flex-1 glass-dark rounded-[14px] p-2.5 text-center">
          <Skeleton className="h-2 w-12 mx-auto mb-1.5" />
          <Skeleton className="h-5 w-14 mx-auto" />
        </div>
      </div>
    </div>
  );
}
