// src/components/skeletons/ChatSkeleton.tsx
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Chat header skeleton */}
      <div className="h-16 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Messages area skeleton */}
      <div 
        className="flex-1 overflow-hidden px-3 md:px-6 py-4 space-y-3"
        style={{
          backgroundImage: `url('/telegramm-bg-tile.png')`,
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundColor: "#ECE5DD",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
          >
            <div className="h-12 w-56 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        ))}
      </div>

      {/* Composer skeleton */}
      <div className="h-16 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 flex items-center px-4 gap-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}