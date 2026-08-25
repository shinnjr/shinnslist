export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-48 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
