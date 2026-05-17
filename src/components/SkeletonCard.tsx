import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="bg-brand-surface border text-center border-brand-border rounded-2xl p-6 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3 mx-auto" />
    </div>
  );
}
