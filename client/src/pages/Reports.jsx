import { useState, useEffect } from 'react';
import api from '../api';
import { 
    Download, 
    TrendingUp, 
    ShoppingBag, 
    CreditCard, 
    Calendar,
    Filter,
    FileText
} from 'lucide-react';

export default function Reports() {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [range, setRange] = useState('daily');
    const [data, setData] = useState({
        summary: { total_orders: 0, total_revenue: 0, avg_order_value: 0 },
        products: [],
        categories: [],
        transactions: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [range, selectedBranch]);

    const fetchBranches = async () => {
        try {
            const res = await api.get('/api/branches');
            setBranches(res.data);
        } catch (err) { console.error('Branches fetch error', err); }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/reports?range=${range}&branchId=${selectedBranch}`);
            setData(res.data);
        } catch (err) {
            console.error('Report fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const handleZReport = () => {
        const today = new Date().toLocaleDateString('tr-TR');
        const content = `--- GÜN SONU (Z) RAPORU ---
Tarih: ${today}
Dönem: ${range.toUpperCase()}
Filtre: ${selectedBranch === 'all' ? 'Tüm Şubeler' : branches.find(b=>b.id == selectedBranch)?.name}

ÖZET:
Toplam Ciro: ₺${data.summary.total_revenue.toFixed(2)}
Sipariş Sayısı: ${data.summary.total_orders}
Ort. Sepet: ₺${data.summary.avg_order_value.toFixed(2)}

EN ÇOK SATANLAR:
${data.products.slice(0, 5).map(p => `- ${p.name}: ${p.total_quantity} adet (₺${parseFloat(p.total_sales).toFixed(2)})`).join('\n')}

KATEGORİ DAĞILIMI:
${data.categories.map(c => `- ${c.category_name}: ₺${parseFloat(c.total_sales).toFixed(2)}`).join('\n')}
--------------------------`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Z-Raporu-${today}.txt`;
        link.click();
    };

    return (
        <div className="p-8 h-full bg-white text-black overflow-y-auto">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-black pb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">İşletme Raporları</h1>
                    <p className="text-gray-500 font-mono text-xs mt-1">İstatistiki Veri Analizi ve Performans Takibi</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Range Selector */}
                    <select 
                        value={range} 
                        onChange={(e) => setRange(e.target.value)}
                        className="border border-black px-4 py-2 text-xs font-bold uppercase outline-none focus:bg-black focus:text-white transition-colors cursor-pointer"
                    >
                        <option value="daily">Bugün</option>
                        <option value="weekly">Bu Hafta</option>
                        <option value="monthly">Bu Ay</option>
                        <option value="all">Tüm Zamanlar</option>
                    </select>

                    {/* Branch Selector */}
                    <select 
                        value={selectedBranch} 
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="border border-black px-4 py-2 text-xs font-bold uppercase outline-none focus:bg-black focus:text-white transition-colors cursor-pointer"
                    >
                        <option value="all">Tüm Şubeler</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleZReport}
                        className="bg-black text-white px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors"
                    >
                        <FileText size={16} />
                        Z-Raporu Al
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center font-mono animate-pulse">VERİLER YÜKLENİYOR...</div>
            ) : (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Toplam Ciro</span>
                                <TrendingUp size={20} className="text-green-600" />
                            </div>
                            <div className="text-3xl font-black">₺{data.summary.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-2">DÖNEMSEL TOPLAM</div>
                        </div>

                        <div className="border border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Sipariş Sayısı</span>
                                <ShoppingBag size={20} />
                            </div>
                            <div className="text-3xl font-black">{data.summary.total_orders}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-2">TAMAMLANAN İŞLEMLER</div>
                        </div>

                        <div className="border border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Ortalama Sepet</span>
                                <CreditCard size={20} />
                            </div>
                            <div className="text-3xl font-black">₺{data.summary.avg_order_value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-2">SİPARİŞ BAŞINA</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                        {/* Top Products Table */}
                        <div className="border border-black">
                            <div className="bg-black text-white p-4 font-bold uppercase tracking-widest text-xs">
                                En Çok Satan Ürünler (Top 10)
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-black">
                                    <tr className="bg-gray-50 font-bold uppercase text-[10px]">
                                        <th className="p-3">Ürün</th>
                                        <th className="p-3">Miktar</th>
                                        <th className="p-3 text-right">Toplam Ciro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.products.map((p, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                            <td className="p-3 font-bold">{p.name}</td>
                                            <td className="p-3 font-mono">{p.total_quantity}</td>
                                            <td className="p-3 text-right font-mono">₺{parseFloat(p.total_sales).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {data.products.length === 0 && (
                                        <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic">Veri bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Category Performance */}
                        <div className="border border-black">
                            <div className="bg-black text-white p-4 font-bold uppercase tracking-widest text-xs">
                                Kategori Performansı
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-black">
                                    <tr className="bg-gray-50 font-bold uppercase text-[10px]">
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3 text-right">Ciro</th>
                                        <th className="p-3 text-right">Pay %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.categories.map((c, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                            <td className="p-3 font-bold">{c.category_name}</td>
                                            <td className="p-3 text-right font-mono">₺{parseFloat(c.total_sales).toFixed(2)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="font-mono text-[10px]">
                                                        {((parseFloat(c.total_sales) / data.summary.total_revenue) * 100).toFixed(1)}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-black" 
                                                            style={{ width: `${(parseFloat(c.total_sales) / data.summary.total_revenue) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.categories.length === 0 && (
                                        <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic">Veri bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Transactions List */}
                    <div className="mt-12 border border-black overflow-hidden">
                        <div className="bg-black text-white p-4 font-bold uppercase tracking-widest text-xs flex justify-between">
                            <span>Son İşlemler</span>
                            <span className="text-gray-500 font-mono">LİMİT: 100</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-black">
                                    <tr className="bg-gray-50 font-bold uppercase text-[10px]">
                                        <th className="p-4 border-r border-gray-200">İŞLEM NO</th>
                                        <th className="p-4 border-r border-gray-200">TARİH / SAAT</th>
                                        <th className="p-4 border-r border-gray-200">ŞUBE / MASA</th>
                                        <th className="p-4 border-r border-gray-200">DURUM</th>
                                        <th className="p-4 text-right">TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.transactions.map((t, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 border-r border-gray-200 font-mono">#{t.id}</td>
                                            <td className="p-4 border-r border-gray-200 font-mono">
                                                {new Date(t.created_at).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="p-4 border-r border-gray-200 uppercase font-bold text-[11px]">
                                                {t.branch_name} / {t.table_no}
                                            </td>
                                            <td className="p-4 border-r border-gray-200">
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                                                    t.status === 'PENDING' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                    {t.status === 'PENDING' ? 'AÇIK' : 'KAPALI'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-black">₺{parseFloat(t.total_amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {data.transactions.length === 0 && (
                                        <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">İşlem henüz yok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
