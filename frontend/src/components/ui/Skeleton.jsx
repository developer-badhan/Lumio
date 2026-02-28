import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-200 dark:bg-white/5 rounded-md ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent"></div>
    </div>
  );
};

export const ChatSkeleton = () => (
  <div className="flex flex-col gap-6 p-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
        <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-48 sm:w-64 rounded-2xl" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;