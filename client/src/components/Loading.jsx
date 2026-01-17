export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-xs font-black uppercase tracking-widest animate-pulse">YÜKLENİYOR</p>
      </div>
    </div>
  );
}
