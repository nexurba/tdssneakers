export default function BoutiqueLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        {/* Title */}
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded mt-2" />
        </div>

        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-64 space-y-4">
            <div className="bg-white rounded-lg border p-4 space-y-4">
              <div className="h-5 w-20 bg-gray-200 rounded" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded" />
              ))}
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
