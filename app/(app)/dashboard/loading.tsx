export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 animate-pulse">
      <div className="h-8 w-40 bg-stone-200 rounded-lg mb-8" />
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-stone-100 rounded-xl" />)}
      </div>
      <div className="h-5 w-32 bg-stone-200 rounded mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-stone-100 rounded-xl" />)}
      </div>
    </div>
  );
}
