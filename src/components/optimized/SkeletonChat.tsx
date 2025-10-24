// src/components/optimized/SkeletonChat.tsx
"use client";

export function SkeletonChat() {
  return (
    <div className="flex flex-col h-full">
      {/* Skeleton header */}
      <div className="flex items-center h-16 px-4 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
      </div>
      
      {/* Skeleton messages */}
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
          >
            <div className={`space-y-1 ${i % 2 ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`max-w-xs ${i % 2 ? "bg-green-500/20" : "bg-white/20"} rounded-xl p-3`}>
                <div className="space-y-2">
                  <div className={`h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse ${
                    i % 3 === 0 ? "w-48" : i % 3 === 1 ? "w-32" : "w-56"
                  }`}></div>
                  {i % 4 === 0 && (
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                  )}
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Skeleton composer */}
      <div className="h-20 bg-gray-100 dark:bg-gray-800 border-t p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}