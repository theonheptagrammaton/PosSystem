import { Outlet, useParams } from 'react-router-dom';

export default function PublicLayout() {
  const { tableId } = useParams();

  // In a real app, fetch tenant name using tenantId
  const restaurantName = "RESTORAN ADI"; 

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Content - Header is now handled by individual page components like MobileMenu */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
