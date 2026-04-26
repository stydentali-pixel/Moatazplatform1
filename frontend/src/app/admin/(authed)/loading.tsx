export default function AdminLoading() {
  return (
    <div className="w-full animate-pulse">
      <div className="mb-6 sm:mb-10">
        <div className="mb-2 h-4 w-20 rounded bg-ink-200" />
        <div className="h-10 w-48 rounded bg-ink-200" />
        <div className="mt-2 h-4 w-64 rounded bg-ink-200" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-ink-200 sm:h-32" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-ink-200" />
        <div className="h-64 rounded-2xl bg-ink-200" />
      </div>
    </div>
  );
}
