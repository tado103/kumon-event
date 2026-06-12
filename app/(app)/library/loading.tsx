export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 animate-pulse">
      <div className="h-8 w-32 bg-stone-200 rounded-lg mb-6" />
      <div className="flex gap-2 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-8 w-20 bg-stone-100 rounded-full" />)}
      </div>
      <div className="flex flex-col gap-3">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-stone-100 rounded-xl" />)}
      </div>
    </div>
  );
}
