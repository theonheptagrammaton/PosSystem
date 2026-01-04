import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
    LayoutDashboard, 
    Building2, 
    Users, 
    DollarSign, 
    Trash2, 
    Plus, 
    LogOut,
    TrendingUp,
    Activity,
    Shield
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdmin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Tenant Form
    const [newCompany, setNewCompany] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');

    useEffect(() => {
        fetchStats();
        fetchTenants();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/admin/stats');
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/tenants');
            setTenants(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/tenants', { 
                company_name: newCompany, 
                domain: newDomain,
                admin_username: adminUser,
                admin_password: adminPass
            });
            alert('Şirket ve Yönetici Kullanıcısı oluşturuldu');
            setNewCompany('');
            setNewDomain('');
            setAdminUser('');
            setAdminPass('');
            fetchTenants(); // Refresh list
            fetchStats(); // Refresh stats
        } catch (err) {
            alert('Hata oluştu: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteTenant = async (id) => {
        if (!window.confirm('BU İŞLEM GERİ ALINAMAZ! ŞİRKET VE TÜM VERİLERİ SİLİNECEK. ONAYLIYOR MUSUNUZ?')) return;
        
        const secondConfirm = window.prompt('Onaylamak için "SİL" yazın:');
        if (secondConfirm !== 'SİL') return;

        try {
            await api.delete(`/api/admin/tenants/${id}`);
            fetchTenants();
            fetchStats();
        } catch (err) {
            alert('Silme başarısız: ' + err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-[#a855f7] selection:text-white">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col z-50">
                <div className="h-16 flex items-center px-6 border-b border-[#27272a]">
                    <div className="font-black text-xl tracking-tighter bg-gradient-to-r from-[#c084fc] to-pink-600 bg-clip-text text-transparent">
                        GOD MODE
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-bold transition-all
                        ${activeTab === 'dashboard' ? 'bg-[#f4f4f5] text-[#09090b]' : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} />
                        GENEL BAKIŞ
                    </button>
                    <button 
                        onClick={() => setActiveTab('tenants')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-bold transition-all
                        ${activeTab === 'tenants' ? 'bg-[#f4f4f5] text-[#09090b]' : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-white'}`}
                    >
                        <Building2 size={18} />
                        ŞİRKET YÖNETİMİ
                    </button>
                </nav>

                <div className="p-4 border-t border-[#27272a]">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-[#ef4444] hover:bg-[#ef4444]/10 px-4 py-2 rounded-[8px] text-xs font-bold transition-colors"
                    >
                        <LogOut size={16} /> ÇIKIŞ YAP
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {activeTab === 'dashboard' && stats && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header>
                            <h1 className="text-3xl font-black mb-2 text-white">Sistem Özeti</h1>
                            <p className="text-[#71717a]">Küresel veri analizi ve metrikler.</p>
                        </header>

                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-[#18181b] p-6 rounded-[12px] border border-[#27272a] relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Building2 size={64} color="white"/>
                                </div>
                                <div className="text-[#a1a1aa] text-xs font-bold uppercase tracking-widest mb-2">Toplam Şirket</div>
                                <div className="text-4xl font-black text-white">{stats.total_tenants}</div>
                            </div>

                            <div className="bg-[#18181b] p-6 rounded-[12px] border border-[#27272a] relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={64} className="text-[#22c55e]" />
                                </div>
                                <div className="text-[#a1a1aa] text-xs font-bold uppercase tracking-widest mb-2">Toplam Ciro</div>
                                <div className="text-4xl font-black text-[#4ade80]">₺{stats.total_revenue.toLocaleString()}</div>
                            </div>
                            
                            <div className="bg-[#18181b] p-6 rounded-[12px] border border-[#27272a] relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity size={64} className="text-[#3b82f6]" />
                                </div>
                                <div className="text-[#a1a1aa] text-xs font-bold uppercase tracking-widest mb-2">Toplam Sipariş</div>
                                <div className="text-4xl font-black text-[#60a5fa]">{stats.total_orders.toLocaleString()}</div>
                            </div>

                            <div className="bg-[#18181b] p-6 rounded-[12px] border border-[#27272a] relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={64} className="text-[#a855f7]" />
                                </div>
                                <div className="text-[#a1a1aa] text-xs font-bold uppercase tracking-widest mb-2">Toplam Kullanıcı</div>
                                <div className="text-4xl font-black text-[#c084fc]">{stats.total_users}</div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-2 gap-6 h-80">
                            <div className="bg-[#18181b] p-6 rounded-[12px] border border-[#27272a]">
                                <h3 className="font-bold text-sm text-[#a1a1aa] mb-4 flex items-center gap-2">
                                    <DollarSign size={16}/> GELİR TRENDİ (SON 30 GÜN)
                                </h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chart_data || []}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={d => d.slice(5)} />
                                        <YAxis stroke="#666" fontSize={10}/>
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#000', border: '1px solid #333'}}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-[#18181b] p-6 rounded-[12px] border border-[#27272a]">
                                <h3 className="font-bold text-sm text-[#a1a1aa] mb-4 flex items-center gap-2">
                                    <Activity size={16}/> SİPARİŞ HACMİ
                                </h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chart_data || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={d => d.slice(5)} />
                                        <YAxis stroke="#666" fontSize={10}/>
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#000', border: '1px solid #333'}}
                                            cursor={{fill: 'rgba(255,255,255,0.1)'}}
                                        />
                                        <Bar dataKey="orders" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                    </div>
                )}

                {activeTab === 'tenants' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex justify-between items-end bg-[#18181b] p-6 rounded-[12px] border border-[#27272a]">
                            <div>
                                <h1 className="text-3xl font-black mb-2 text-white">Şirket Yönetimi</h1>
                                <p className="text-[#71717a]">Sisteme kayıtlı işletmeleri yönet.</p>
                            </div>
                            
                            {/* Create Tenant Form (Inline for speed) */}
                            <form onSubmit={handleCreateTenant} className="flex gap-2 items-end">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#71717a] px-1">Şirket Adı</label>
                                    <input 
                                        type="text" 
                                        placeholder="Cafe/Restoran Adı" 
                                        className="bg-[#09090b] border border-[#3f3f46] text-white px-3 py-2 rounded-[6px] text-sm focus:border-[#a855f7] outline-none w-48"
                                        value={newCompany}
                                        onChange={e => setNewCompany(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#71717a] px-1">Yönetici K.Adı</label>
                                    <input 
                                        type="text" 
                                        placeholder="admin" 
                                        className="bg-[#09090b] border border-[#3f3f46] text-white px-3 py-2 rounded-[6px] text-sm focus:border-[#a855f7] outline-none w-32"
                                        value={adminUser}
                                        onChange={e => setAdminUser(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#71717a] px-1">Yönetici Şifre</label>
                                    <input 
                                        type="text" 
                                        placeholder="123456" 
                                        className="bg-[#09090b] border border-[#3f3f46] text-white px-3 py-2 rounded-[6px] text-sm focus:border-[#a855f7] outline-none w-32"
                                        value={adminPass}
                                        onChange={e => setAdminPass(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="bg-white text-black px-4 py-2 rounded-[6px] font-bold text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 h-10">
                                    <Plus size={16} /> OLUŞTUR
                                </button>
                            </form>
                        </header>

                        <div className="bg-[#18181b] rounded-[12px] border border-[#27272a] overflow-hidden">
                            <table className="w-full text-left text-sm text-[#a1a1aa]">
                                <thead className="bg-[#09090b] text-[#71717a] uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Şirket Adı</th>
                                        <th className="p-4">Domain</th>
                                        <th className="p-4">Oluşturulma</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#27272a]">
                                    {tenants.map(t => (
                                        <tr key={t.id} className="hover:bg-[#27272a]/50 transition-colors">
                                            <td className="p-4 font-mono text-[#52525b]">#{t.id}</td>
                                            <td className="p-4 font-bold text-white">{t.company_name}</td>
                                            <td className="p-4 font-mono">{t.domain || '-'}</td>
                                            <td className="p-4">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteTenant(t.id)}
                                                    className="text-[#71717a] hover:text-[#ef4444] transition-colors"
                                                    title="Şirketi ve tüm verilerini sil"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tenants.length === 0 && (
                                        <tr><td colSpan="5" className="p-8 text-center italic">Kayıtlı şirket yok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
