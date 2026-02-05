export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 border-r-transparent mb-4"></div>
          <p className="font-medium text-slate-500">Loading users...</p>
        </div>
      </div>
  );
}
