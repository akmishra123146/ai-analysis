'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface SkeletonLoaderProps {
  variant?: 'table' | 'cards' | 'panel' | 'full';
  rows?: number;
}

export default function SkeletonLoader({ variant = 'table', rows = 5 }: SkeletonLoaderProps) {
  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-surface p-5 space-y-3 border-cyan-500/20 bg-gray-950/60">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-800 rounded w-24" />
              <div className="w-8 h-8 rounded-xl bg-gray-800" />
            </div>
            <div className="h-8 bg-gray-800 rounded w-16" />
            <div className="h-3 bg-gray-800/60 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'panel') {
    return (
      <div className="glass-surface p-6 space-y-4 border-white/15 bg-gray-950/80 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-800 rounded w-48" />
          <div className="h-4 bg-gray-800 rounded w-24" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-900 rounded-xl border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="glass-surface p-6 h-28 bg-gray-950 border-cyan-500/20 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-gray-800 rounded w-64" />
            <div className="h-3 bg-gray-800/60 rounded w-96" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-800" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-surface p-5 h-28 bg-gray-950/60 border-white/10" />
          ))}
        </div>

        <div className="glass-surface p-6 space-y-4 bg-gray-950/80">
          <div className="h-6 bg-gray-800 rounded w-48 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-900 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div className="glass-surface p-6 border-white/15 bg-gray-950/80 space-y-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-800 rounded w-48" />
        <div className="h-8 bg-gray-800 rounded w-32" />
      </div>

      <div className="space-y-3">
        <div className="h-8 bg-gray-900 rounded-lg w-full mb-2" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-900/60 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
}
