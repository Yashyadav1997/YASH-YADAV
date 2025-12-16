import React from 'react';

const ShimmerLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-4' }) => (
  <div className={`bg-gray-700/50 rounded ${width} ${height}`}></div>
);

const CardSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0 p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <ShimmerLine width="w-3/4" />
            <ShimmerLine width="w-16" height="h-6" />
        </div>
        <div className="space-y-2 pt-2">
            <ShimmerLine width="w-full" height="h-3" />
            <ShimmerLine width="w-full" height="h-3"/>
            <ShimmerLine width="w-5/6" height="h-3"/>
        </div>
        <div className="pt-4">
            <ShimmerLine width="w-full" height="h-32" />
        </div>
        <div className="space-y-2 pt-4">
            <ShimmerLine width="w-1/4" height="h-3" />
            <ShimmerLine width="w-1/2" height="h-3" />
            <ShimmerLine width="w-1/3" height="h-3" />
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;
