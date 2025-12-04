
import React from 'react';

const Loading: React.FC = () => (
  <div className="w-full h-full p-8 animate-pulse">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="flex gap-2">
            <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
        </div>
    </div>

    {/* Table Skeleton */}
    <div className="space-y-4">
        <div className="h-12 bg-slate-200 rounded-xl w-full mb-6"></div>
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4">
                <div className="h-16 bg-slate-100 rounded-xl w-16"></div>
                <div className="h-16 bg-slate-100 rounded-xl flex-1"></div>
                <div className="h-16 bg-slate-100 rounded-xl w-32"></div>
                <div className="h-16 bg-slate-100 rounded-xl w-32"></div>
            </div>
        ))}
    </div>
  </div>
);

export default Loading;
