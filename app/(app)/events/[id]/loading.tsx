export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 animate-pulse">
      <div className="h-9 w-64 bg-stone-200 rounded-lg mb-6" />
      <div className="flex gap-4 mb-6 border-b border-stone-200 pb-px">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 w-14 bg-stone-100 rounded" />)}
      </div>
      <div className="flex flex-col gap-4">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-stone-100 rounded-xl" />)}
      </div>
    </div>
  );
}
