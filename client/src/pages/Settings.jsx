export default function Settings() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold uppercase mb-4">Sistem Ayarları</h1>
      <div className="border border-black p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="w-4 h-4 border border-black bg-black"></div>
          <span className="font-mono text-sm">KARANLIK MOD (KAPALI)</span>
        </label>
        <p className="mt-4 text-xs text-gray-500">
           Daha fazla ayar yakında eklenecek...
        </p>
      </div>
    </div>
  );
}
