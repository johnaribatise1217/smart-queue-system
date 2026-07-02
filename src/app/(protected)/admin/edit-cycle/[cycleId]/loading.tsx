export default function CycleDetailLoading() {
  return (
    <div className="font-manrope flex flex-col gap-6 animate-pulse">

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-100" />
          <div>
            <div className="h-5 w-48 bg-gray-100 rounded-lg mb-1.5" />
            <div className="h-3 w-32 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-100 rounded-xl" />
          <div className="h-9 w-28 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
            <div>
              <div className="h-3 w-16 bg-gray-100 rounded mb-1.5" />
              <div className="h-5 w-10 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-64" />
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-40" />
        </div>
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 h-96" />
      </div>

    </div>
  );
}