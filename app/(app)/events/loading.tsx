export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 animate-pulse">
      <div className="flex justify-between mb-6">
        <div className="h-8 w-28 bg-stone-200 rounded-lg" />
        <div className="h-9 w-24 bg-stone-200 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-6">
        {[1,2,3,4,5].map(i => <div key={i} className="h-8 w-16 bg-stone-100 rounded-full" />)}
      </div>
      <div className="flex flex-col gap-2">
        {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-stone-100 rounded-xl" />)}
      </div>
    </div>
  );
}
