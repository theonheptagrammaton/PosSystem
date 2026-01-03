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
    Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SuperAdmin() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Tenant Form
    const [newCompany, setNewCompany] = useState('');
    const [newDomain, setNewDomain] = useState('');

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
            await api.post('/api/admin/tenants', { company_name: newCompany, domain: newDomain });
            alert('Şirket oluşturuldu');
            setNewCompany('');
            setNewDomain('');
            fetchTenants(); // Refresh list
            fetchStats(); // Refresh stats
        } catch (err) {
            alert('Hata oluştu: ' + err.message);
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
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500 selection:text-white">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-50">
                <div className="h-16 flex items-center px-6 border-b border-zinc-800">
                    <div className="font-black text-xl tracking-tighter bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        GOD MODE
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'dashboard' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <LayoutDashboard size={18} />
                        GENEL BAKIŞ
                    </button>
                    <button 
                        onClick={() => setActiveTab('tenants')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all
                        ${activeTab === 'tenants' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                    >
                        <Building2 size={18} />
                        ŞİRKET YÖNETİMİ
                    </button>
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
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
                            <h1 className="text-3xl font-black mb-2">Sistem Özeti</h1>
                            <p className="text-zinc-500">Küresel veri analizi ve metrikler.</p>
                        </header>

                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Building2 size={64} />
                                </div>
                                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Toplam Şirket</div>
                                <div className="text-4xl font-black">{stats.total_tenants}</div>
                            </div>

                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={64} className="text-green-500" />
                                </div>
                                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Toplam Ciro</div>
                                <div className="text-4xl font-black text-green-400">₺{stats.total_revenue.toLocaleString()}</div>
                            </div>
                            
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity size={64} className="text-blue-500" />
                                </div>
                                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Toplam Sipariş</div>
                                <div className="text-4xl font-black text-blue-400">{stats.total_orders.toLocaleString()}</div>
                            </div>

                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={64} className="text-purple-500" />
                                </div>
                                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Toplam Kullanıcı</div>
                                <div className="text-4xl font-black text-purple-400">{stats.total_users}</div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        
                    </div>
                )}

                {activeTab === 'tenants' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black mb-2">Şirket Yönetimi</h1>
                                <p className="text-zinc-500">Sisteme kayıtlı işletmeleri yönet.</p>
                            </div>
                            
                            {/* Create Tenant Form (Inline for speed) */}
                            <form onSubmit={handleCreateTenant} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Şirket Adı" 
                                    className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-sm focus:border-purple-500 outline-none w-64"
                                    value={newCompany}
                                    onChange={e => setNewCompany(e.target.value)}
                                    required
                                />
                                <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2">
                                    <Plus size={16} /> EKLE
                                </button>
                            </form>
                        </header>

                        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-zinc-950 text-zinc-500 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Şirket Adı</th>
                                        <th className="p-4">Domain</th>
                                        <th className="p-4">Oluşturulma</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {tenants.map(t => (
                                        <tr key={t.id} className="hover:bg-zinc-800/50 transition-colors">
                                            <td className="p-4 font-mono text-zinc-600">#{t.id}</td>
                                            <td className="p-4 font-bold text-white">{t.company_name}</td>
                                            <td className="p-4 font-mono">{t.domain || '-'}</td>
                                            <td className="p-4">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteTenant(t.id)}
                                                    className="text-zinc-600 hover:text-red-500 transition-colors"
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
