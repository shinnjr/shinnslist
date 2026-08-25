export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="h-8 w-56 bg-zinc-800 rounded-lg animate-pulse mb-8" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse mb-4" />
      ))}
    </div>
  );
}
