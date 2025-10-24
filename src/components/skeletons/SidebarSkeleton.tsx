// src/components/skeletons/SidebarSkeleton.tsx
export function SidebarSkeleton() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Search skeleton */}
      <div className="p-2">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
      </div>

      {/* Chat list skeleton */}
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="flex-1 min-w-0">
              {/* Name skeleton */}
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              {/* Message skeleton */}
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {/* Time skeleton */}
              <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              {/* Badge skeleton */}
              {i % 3 === 0 && (
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}