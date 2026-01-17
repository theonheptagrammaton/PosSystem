import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useNotification } from '../context/NotificationContext';
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
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Tenant Form
    const [newCompany, setNewCompany] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [adminUser, setAdminUser] = useState('');
    const [adminPass, setAdminPass] = useState('');

    useEffect(() => {
        const init = async () => {
             setLoading(true);
             await Promise.all([fetchStats(), fetchTenants(), fetchAnalytics()]);
             setLoading(false);
        };
        init();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/admin/stats');
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/api/admin/analytics');
            setAnalytics(res.data);
        } catch (err) { console.error('Analytics error:', err); }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/api/admin/tenants');
            setTenants(res.data);
        } catch (err) { console.error(err); }
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
            showNotification({ title: 'BAŞARILI', message: 'Şirket ve Yönetici oluşturuldu', type: 'info' });
            setNewCompany('');
            setNewDomain('');
            setAdminUser('');
            setAdminPass('');
            fetchTenants(); 
            fetchStats();
        } catch (err) {
            showNotification({ 
                title: 'HATA', 
                message: 'Hata oluştu: ' + (err.response?.data?.error || err.message), 
                type: 'error' 
            });
        }
    };

    const handleDeleteTenant = async (id) => {
        const confirmed = await showNotification({ 
            title: 'KRİTİK İŞLEM', 
            message: 'BU İŞLEM GERİ ALINAMAZ! Şirket ve tüm verileri silinecek. Onaylıyor musunuz?', 
            type: 'confirm' 
        });
        if (!confirmed) return;
        
        try {
            await api.delete(`/api/admin/tenants/${id}`);
            fetchTenants();
            fetchStats();
            showNotification({ title: 'BAŞARILI', message: 'Şirket silindi', type: 'info' });
        } catch (err) {
            showNotification({ title: 'HATA', message: 'Silme başarısız', type: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                 <div className="text-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">SİSTEM YÜKLENİYOR</p>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-black border-r-2 border-white/20 flex flex-col z-50">
                <div className="h-20 flex items-center px-6 border-b-2 border-white/20">
                    <div className="font-black text-xl tracking-[0.2em] bg-white text-black px-2 py-1">
                        GOD MODE
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all
                        ${activeTab === 'dashboard' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'}`}
                    >
                        <LayoutDashboard size={16} />
                        GENEL BAKIŞ
                    </button>
                    <button 
                        onClick={() => setActiveTab('tenants')}
                        className={`w-full flex items-center gap-3 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all
                        ${activeTab === 'tenants' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'}`}
                    >
                        <Building2 size={16} />
                        ŞİRKET YÖNETİMİ
                    </button>
                </nav>

                <div className="p-4 border-t-2 border-white/20">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-red-500 hover:text-white hover:bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors border border-transparent hover:border-red-600"
                    >
                        <LogOut size={16} /> ÇIKIŞ YAP
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {activeTab === 'dashboard' && stats && (
                    <div className="space-y-8 animate-fadeIn">
                        <header className="border-b-2 border-white pb-6">
                            <h1 className="text-4xl font-black mb-2 uppercase tracking-tight">Sistem Özeti</h1>
                            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">KÜRESEL VERİ ANALİZİ VE METRİKLERİ</p>
                        </header>

                        {/* Top Stats Grid */}
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-black p-6 border-2 border-white/20 relative overflow-hidden group hover:border-white transition-colors">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <Building2 size={40} />
                                </div>
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">TOPLAM ŞİRKET</div>
                                <div className="text-4xl font-black">{stats.total_tenants}</div>
                            </div>

                            <div className="bg-black p-6 border-2 border-white/20 relative overflow-hidden group hover:border-white transition-colors">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <DollarSign size={40} className="text-green-500" />
                                </div>
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">TOPLAM CİRO</div>
                                <div className="text-4xl font-black text-white">₺{stats.total_revenue.toLocaleString()}</div>
                            </div>
                            
                            <div className="bg-black p-6 border-2 border-white/20 relative overflow-hidden group hover:border-white transition-colors">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <Activity size={40} className="text-blue-500" />
                                </div>
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">TOPLAM SİPARİŞ</div>
                                <div className="text-4xl font-black text-white">{stats.total_orders.toLocaleString()}</div>
                            </div>

                            <div className="bg-black p-6 border-2 border-white/20 relative overflow-hidden group hover:border-white transition-colors">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <Users size={40} className="text-purple-500" />
                                </div>
                                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">TOPLAM KULLANICI</div>
                                <div className="text-4xl font-black text-white">{stats.total_users}</div>
                            </div>
                        </div>

                        {/* Analytics & Tactics Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sales Trend Chart */}
                            <div className="bg-black p-6 border-2 border-white/20 flex flex-col hover:border-white transition-colors">
                                <h3 className="font-black text-xs text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                                    <TrendingUp size={14}/> SAATLİK SATIŞ YOĞUNLUĞU 
                                    <span className="text-[9px] bg-white text-black px-2 py-0.5 font-bold">SON 30 GÜN</span>
                                </h3>
                                <div className="flex-1 h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analytics?.hourly_data || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis 
                                                dataKey="hour" 
                                                stroke="#666" 
                                                fontSize={10} 
                                                tickFormatter={h => `${h}:00`}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false}/>
                                            <Tooltip 
                                                contentStyle={{backgroundColor: '#000', border: '1px solid #fff', color: '#fff'}}
                                                itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                                                formatter={(val) => [`₺${val}`, 'Ciro']}
                                                labelFormatter={(h) => `SAAT ${h}:00`}
                                                cursor={{stroke: '#fff', strokeWidth: 1}}
                                            />
                                            <Area type="step" dataKey="revenue" stroke="#fff" strokeWidth={2} fillOpacity={0.1} fill="#fff" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Profit Tactics (AI Insights) */}
                            <div className="bg-black p-0 border-2 border-white/20 flex flex-col overflow-hidden hover:border-white transition-colors">
                                <div className="p-6 border-b-2 border-white/20 bg-white/5">
                                    <h3 className="font-black text-sm text-white mb-2 flex items-center gap-2 uppercase tracking-widest">
                                        <TrendingUp size={16} />
                                        KÂR ARTIRMA TAKTİKLERİ
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-mono">YAPAY ZEKA DESTEKLİ SATIŞ METRİKLERİ</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[300px]">
                                    {analytics?.tactics?.length > 0 ? (
                                        analytics.tactics.map((tactic, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 border border-white/10 hover:border-white transition-colors group bg-black">
                                                <div className="shrink-0 mt-1">
                                                    <div className="w-8 h-8 flex items-center justify-center text-white border border-white group-hover:bg-white group-hover:text-black transition-colors">
                                                        {tactic.icon === 'TrendingUp' && <TrendingUp size={16} />}
                                                        {tactic.icon === 'Clock' && <Activity size={16} />}
                                                        {tactic.icon === 'Star' && <DollarSign size={16} />}
                                                        {tactic.icon === 'AlertTriangle' && <LogOut size={16} className="rotate-180" />} 
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-xs mb-1 uppercase tracking-wide">{tactic.title}</h4>
                                                    <p className="text-gray-400 text-[10px] leading-relaxed font-mono uppercase">{tactic.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                                            <Activity size={24} className="opacity-20" />
                                            <p className="text-[10px] uppercase tracking-widest">VERİ TOPLANIYOR...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tenants' && (
                    <div className="space-y-8 animate-fadeIn">
                        <header className="flex justify-between items-end bg-black p-6 border-2 border-white/20 hover:border-white transition-colors">
                            <div>
                                <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Şirket Yönetimi</h1>
                                <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest">SİSTEME KAYITLI İŞLETMELER</p>
                            </div>
                            
                            <form onSubmit={handleCreateTenant} className="flex gap-4 items-end bg-white/5 p-4 border border-white/10">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest px-1">Şirket Adı</label>
                                    <input 
                                        type="text" 
                                        placeholder="ŞİRKET ADI" 
                                        className="bg-black border border-white/30 px-3 py-2 text-xs focus:border-white outline-none w-40 text-white font-bold uppercase placeholder:text-gray-700"
                                        value={newCompany}
                                        onChange={e => setNewCompany(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest px-1">Yönetici K.Adı</label>
                                    <input 
                                        type="text" 
                                        placeholder="ADMIN" 
                                        className="bg-black border border-white/30 px-3 py-2 text-xs focus:border-white outline-none w-32 text-white font-bold uppercase placeholder:text-gray-700"
                                        value={adminUser}
                                        onChange={e => setAdminUser(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-500 tracking-widest px-1">Yönetici Şifre</label>
                                    <input 
                                        type="text" 
                                        placeholder="******" 
                                        className="bg-black border border-white/30 px-3 py-2 text-xs focus:border-white outline-none w-32 text-white font-bold placeholder:text-gray-700"
                                        value={adminPass}
                                        onChange={e => setAdminPass(e.target.value)}
                                        required
                                    />
                                </div>
                                <button className="bg-white text-black px-6 py-2 font-black text-xs hover:bg-gray-200 transition-colors flex items-center gap-2 h-9 border border-white uppercase tracking-widest">
                                    <Plus size={14} /> ŞİRKET EKLE
                                </button>
                            </form>
                        </header>

                        <div className="bg-black border-2 border-white/20 overflow-hidden">
                            <table className="w-full text-left text-xs text-gray-400">
                                <thead className="bg-white/10 text-white uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="p-4 border-r border-white/10">ID</th>
                                        <th className="p-4 border-r border-white/10">Şirket Adı</th>
                                        <th className="p-4 border-r border-white/10">Domain</th>
                                        <th className="p-4 border-r border-white/10">Oluşturulma</th>
                                        <th className="p-4 text-center">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {tenants.map(t => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 font-mono text-gray-500 border-r border-white/10">#{t.id}</td>
                                            <td className="p-4 font-bold text-white border-r border-white/10 uppercase tracking-wide">{t.company_name}</td>
                                            <td className="p-4 font-mono border-r border-white/10">{t.domain || '-'}</td>
                                            <td className="p-4 font-mono border-r border-white/10">{new Date(t.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td className="p-4 text-center">
                                                <button 
                                                    onClick={() => handleDeleteTenant(t.id)}
                                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/10 transition-colors border border-transparent hover:border-red-900"
                                                    title="SİL"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {tenants.length === 0 && (
                                        <tr><td colSpan="5" className="p-12 text-center italic uppercase font-bold tracking-widest text-gray-600">SİSTEM KAYITLI ŞİRKET YOK.</td></tr>
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
