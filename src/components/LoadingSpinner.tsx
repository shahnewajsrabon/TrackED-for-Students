import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8 w-full h-full min-h-[50vh]">
      <div className="w-8 h-8 relative">
        <div className="absolute inset-0 rounded-full border-2 border-brand-border" />
        <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    </div>
  );
}
