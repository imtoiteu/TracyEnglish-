/** A quiet skeleton while a server component streams in. */
export default function Loading() {
  return (
    <div className="container-page py-16">
      <div className="h-8 w-64 animate-pulse rounded-2xl bg-ink-100" />
      <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-xl bg-ink-100" />
      <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded-xl bg-ink-100" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-3xl bg-ink-100" />
        ))}
      </div>
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
