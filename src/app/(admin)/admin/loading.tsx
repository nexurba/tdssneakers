export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div>
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border p-6">
            <div className="h-6 w-6 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}
