export default function StorePageLoading() {
  return (
    <div className="space-y-5 max-w-2xl animate-pulse">
      <div>
        <div className="h-7 w-40 bg-gray-200 rounded-lg" />
        <div className="h-4 w-56 bg-gray-100 rounded mt-2" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="h-3 w-36 bg-gray-200 rounded" />
        <div className="h-14 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-11 w-32 bg-gray-200 rounded-xl" />
    </div>
  );
}
