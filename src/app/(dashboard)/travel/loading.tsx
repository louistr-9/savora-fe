export default function PlanLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="w-32 h-7 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="w-64 h-4 rounded-lg bg-slate-100 dark:bg-slate-800 ml-13" />
        </div>
        <div className="w-36 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 h-24" />
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-20 h-9 rounded-full bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-48" />
        ))}
      </div>
    </div>
  );
}

