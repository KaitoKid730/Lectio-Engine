import React from 'react';

export const LoadingSkeleton: React.FC<{ className?: string; count?: number }> = ({
  className = 'h-6 w-full',
  count = 1,
}) => {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-slate-200/80 rounded-lg ${className}`} />
      ))}
    </div>
  );
};
