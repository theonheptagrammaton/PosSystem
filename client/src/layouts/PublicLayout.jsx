import { Outlet, useParams } from 'react-router-dom';

export default function PublicLayout() {
  const { tableId } = useParams();

  // In a real app, fetch tenant name using tenantId
  const restaurantName = "RESTORAN ADI"; 

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Public Header */}
      <header className="sticky top-0 bg-white z-50 border-b border-black py-4 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold uppercase tracking-widest">{restaurantName}</h1>
        <div className="text-xs font-mono mt-1 text-gray-500">MASA NO: {tableId}</div>
      </header>

      {/* Content */}
      <main className="pb-10">
        <Outlet />
      </main>
    </div>
  );
}
