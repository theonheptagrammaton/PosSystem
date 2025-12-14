import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Utensils, Boxes, Settings as SettingsIcon, LogOut, Building2, User } from 'lucide-react';
import { useGodMode } from '../context/GodModeContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGodMode, toggleGodMode } = useGodMode();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'branch_manager';

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
    ...(isAdmin ? [
      { path: '/dashboard/branches', label: 'Şubeler', icon: Building2 }, 
      { path: '/dashboard/users', label: 'Kullanıcılar', icon: User }, // Admin Only
    ] : []),
    { path: '/dashboard/settings', label: 'Ayarlar', icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen flex font-sans overflow-hidden transition-colors duration-300 ${isGodMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      
      {/* Sidebar */}
      <aside className={`w-[250px] border-r flex flex-col h-screen flex-shrink-0 transition-colors duration-300 ${isGodMode ? 'border-white bg-black' : 'border-black'}`}>
        <div className={`h-[64px] border-b flex items-center px-6 transition-colors duration-300 ${isGodMode ? 'border-white' : 'border-black'}`}>
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
                    ? (isGodMode ? 'bg-white text-black' : 'bg-black text-white')
                    : (isGodMode ? 'hover:bg-white hover:text-black hover:border-white' : 'hover:bg-black hover:text-white hover:border-black')
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.5} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={`p-4 border-t transition-colors duration-300 ${isGodMode ? 'border-white' : 'border-black'}`}>
           <button 
             onClick={handleLogout}
             className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium border border-transparent transition-colors ${
                isGodMode 
                ? 'text-red-400 hover:border-white hover:bg-white hover:text-black' 
                : 'text-red-600 hover:border-black hover:bg-black hover:text-white'
             }`}
           >
             <LogOut size={18} />
             <span>ÇIKIŞ YAP</span>
           </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className={`h-[64px] border-b flex items-center justify-between px-8 flex-shrink-0 transition-colors duration-300 ${isGodMode ? 'bg-black border-white' : 'bg-white border-black'}`}>
          <h2 className="font-bold tracking-widest text-sm uppercase">{getPageTitle()}</h2>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest">GOD MODE</span>
            <div 
              onClick={toggleGodMode}
              className={`w-12 h-6 border p-0.5 cursor-pointer flex items-center transition-colors duration-300 ${isGodMode ? 'border-white' : 'border-black'}`}
            >
              <div 
                className={`w-4 h-4 transition-all duration-200 ${
                    isGodMode 
                    ? 'translate-x-6 bg-white' 
                    : 'translate-x-0 bg-black'
                }`}
              ></div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 overflow-auto relative transition-colors duration-300 ${isGodMode ? 'bg-black' : 'bg-white'}`}>
          <div className="absolute inset-0">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
