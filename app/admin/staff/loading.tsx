export default function StaffLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-200" />
        </div>

        <div className="h-10 w-40 rounded-xl bg-slate-200" />
      </div>

      <div className="flex gap-3">
        <div className="h-10 w-80 rounded-xl bg-slate-200" />
        <div className="h-10 w-48 rounded-xl bg-slate-200" />
        <div className="h-10 w-32 rounded-xl bg-slate-200" />
        <div className="h-10 w-32 rounded-xl bg-slate-200" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-14 border-b border-slate-200 bg-slate-100" />

        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-20 border-b border-slate-100 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
