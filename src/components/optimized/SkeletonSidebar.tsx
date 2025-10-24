// src/components/optimized/SkeletonSidebar.tsx
"use client";

export function SkeletonSidebar() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 bg-green-600 dark:bg-green-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-700 dark:bg-green-600 rounded-full animate-pulse"></div>
          <div className="h-5 bg-green-700 dark:bg-green-600 rounded w-24 animate-pulse"></div>
        </div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-green-700 dark:bg-green-600 rounded-full animate-pulse"></div>
          <div className="w-8 h-8 bg-green-700 dark:bg-green-600 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Search skeleton */}
      <div className="p-2 bg-gray-50 dark:bg-gray-800">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>

      {/* Chat list skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="p-2 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-3 p-3 rounded-lg"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
              </div>
              
              {/* Unread badge */}
              {i % 3 === 0 && (
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}