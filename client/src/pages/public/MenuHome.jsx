export default function MenuHome() {
  return (
    <div className="p-8 text-center bg-gray-50 min-h-[50vh] flex flex-col items-center justify-center">
      <div className="animate-pulse text-xl font-bold uppercase tracking-widest">
        MENU LOADING...
      </div>
      <p className="mt-4 text-xs text-gray-400 font-mono">
        Fetching categories and products...
      </p>
    </div>
  );
}
