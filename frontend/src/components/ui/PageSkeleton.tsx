export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-0 animate-pulse">
      {/* Welcome Row / Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="h-8 bg-[var(--secondary)] rounded-md w-1/4"></div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-[var(--secondary)] rounded-full"></div>
          <div className="h-9 w-32 bg-[var(--primary)]/20 rounded-full"></div>
        </div>
      </div>

      {/* KPI Grid - 4 columns */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 h-[120px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="h-4 bg-[var(--secondary)] rounded w-1/2"></div>
              <div className="h-8 w-8 bg-[var(--secondary)] rounded-lg"></div>
            </div>
            <div>
              <div className="h-7 bg-[var(--secondary)] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[var(--secondary)] rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row / Main Content Area */}
      <div className="flex gap-4 px-6 mt-2">
        <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] h-[350px] p-5 flex flex-col">
          <div className="h-5 bg-[var(--secondary)] rounded w-1/4 mb-6"></div>
          <div className="flex-1 bg-[var(--secondary)]/50 rounded-lg"></div>
        </div>
      </div>

      {/* Table Area (optional, looks good as a unified skeleton) */}
      <div className="px-6 py-4 mt-2">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] h-[250px] p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="h-5 bg-[var(--secondary)] rounded w-1/5"></div>
            <div className="h-9 bg-[var(--secondary)] rounded-full w-[200px]"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-[var(--secondary)]/50 rounded-lg w-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
