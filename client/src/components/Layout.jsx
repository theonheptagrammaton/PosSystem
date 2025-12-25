import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Utensils, Boxes, Settings as SettingsIcon, LogOut, Building2, User, FileText } from 'lucide-react';
import { useGodMode } from '../context/GodModeContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGodMode, toggleGodMode } = useGodMode();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'branch_manager';

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Force redirect to dashboard on mobile only if on an unauthorized page
      const allowedMobilePaths = ['/dashboard', '/dashboard/reports'];
      if (mobile && !allowedMobilePaths.includes(location.pathname)) {
        navigate('/dashboard', { replace: true });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [location.pathname, navigate]);

  // Helper to get title based on path
  const getPageTitle = () => {
    const path = location.pathname.split('/')[2] || 'overview';
    switch (path) {
      case 'overview': return 'SİSTEM ÖZETİ';
      case 'pos': return 'SATIŞ NOKTASI (POS)';
      case 'tables': return 'MASA YÖNETİMİ';
      case 'inventory': return 'ENVANTER KONTROLÜ';
      case 'branches': return 'ŞUBE YÖNETİMİ';
      case 'settings': return 'SİSTEM AYARLARI';
      case 'users': return 'KULLANICI YÖNETİMİ';
      case 'reports': return 'İŞLETME RAPORLARI';
      default: return 'PANEL';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Özet', icon: LayoutDashboard, end: true },
    { path: '/dashboard/pos', label: 'POS / Kasa', icon: Store },
    { path: '/dashboard/tables', label: 'Masalar', icon: Utensils },
    { path: '/dashboard/inventory', label: 'Envanter', icon: Boxes },
    { path: '/dashboard/reports', label: 'Raporlar', icon: FileText },
    ...(isAdmin ? [
      { path: '/dashboard/branches', label: 'Şubeler', icon: Building2 }, 
      { path: '/dashboard/users', label: 'Kullanıcılar', icon: User }, // Admin Only
    ] : []),
    { path: '/dashboard/settings', label: 'Ayarlar', icon: SettingsIcon },
  ];

  // Mobile check for layout elements
  const showSidebar = !isGodMode && !isMobile;
  const showHeader = !isMobile;

  return (
    <div className={`min-h-screen flex font-sans overflow-hidden transition-colors duration-300 ${isGodMode || isMobile ? 'bg-black text-white' : 'bg-white text-black'}`}>
      
      {/* Sidebar */}
      {showSidebar && (
      <aside className="w-[250px] border-r flex flex-col h-screen flex-shrink-0 border-black bg-white text-black transition-colors duration-300">
        <div className="h-[64px] border-b border-black flex items-center px-6">
          <span className="font-bold tracking-tighter text-lg">SAAS_POS</span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border border-transparent ${
                  isActive 
                    ? 'bg-black text-white'
                    : 'hover:bg-black hover:text-white hover:border-black'
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-black">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium border border-transparent transition-colors text-red-600 hover:border-black hover:bg-black hover:text-white"
           >
             <LogOut size={18} />
             <span>ÇIKIŞ YAP</span>
           </button>
        </div>
      </aside>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        {showHeader && (
        <header className={`h-[64px] border-b flex items-center justify-between px-8 flex-shrink-0 transition-colors duration-300 ${isGodMode ? 'bg-black border-white' : 'bg-white border-black'}`}>
          <h2 className="font-bold tracking-widest text-sm uppercase">{getPageTitle()}</h2>
          
          <div className="flex items-center gap-3">
            {location.pathname === '/dashboard' && !isGodMode && ( 
              <button 
                onClick={toggleGodMode}
                className="bg-black text-white px-4 py-2 text-[10px] font-black tracking-[0.2em] border border-black hover:bg-white hover:text-black transition-all uppercase"
              >
                GOD MODE PANEL
              </button>
            )}
          </div>
        </header>
        )}

        {/* Content Area */}
        <main className={`flex-1 overflow-auto relative transition-colors duration-300 ${isGodMode || isMobile ? 'bg-black' : 'bg-white'} ${isMobile ? 'pb-20' : ''}`}>
          <div className="absolute inset-0">
            <Outlet />
          </div>
        </main>

        {/* Mobile Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/20 flex items-center justify-around px-4 z-[100]">
            <NavLink 
              to="/dashboard" 
              end
              className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-gray-500'}`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">ANASAYFA</span>
            </NavLink>
            <NavLink 
              to="/dashboard/reports" 
              className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-gray-500'}`}
            >
              <FileText size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">RAPORLAR</span>
            </NavLink>
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 text-red-600"
            >
              <LogOut size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">ÇIKIŞ</span>
            </button>
          </nav>
        )}
      </div>

    </div>
  );
}

