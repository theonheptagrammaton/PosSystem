import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../api';
import { 
    Download, 
    TrendingUp, 
    ShoppingBag, 
    CreditCard, 
    Calendar,
    Filter,
    FileText,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

export default function Reports() {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const [range, setRange] = useState('daily');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState({
        summary: { total_orders: 0, total_revenue: 0, avg_order_value: 0 },
        products: [],
        categories: [],
        transactions: []
    });
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));
    const tenantId = user?.tenant_id;

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        fetchReportData();
        
        // Setup Socket
        if (!socketRef.current && tenantId) {
            socketRef.current = io(api.defaults.baseURL, {
                query: { tenantId }
            });

            const handleUpdate = () => {
                console.log('Real-time report update triggered');
                fetchReportData();
            };

            socketRef.current.on('new_order', handleUpdate);
            socketRef.current.on('table_closed', handleUpdate);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [range, selectedBranch, date, tenantId]);

    const fetchBranches = async () => {
        try {
            const res = await api.get('/api/branches');
            setBranches(res.data);
        } catch (err) { console.error('Branches fetch error', err); }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/reports?range=${range}&branchId=${selectedBranch}&date=${date}`);
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
Tarih: ${range === 'daily' ? date : today}
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
        <div className="p-4 md:p-8 h-full bg-white text-black overflow-y-auto pb-24 md:pb-8">
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
                        <option value="daily">Bugün / Günlük</option>
                        <option value="weekly">Bu Hafta</option>
                        <option value="monthly">Bu Ay</option>
                        <option value="all">Tüm Zamanlar</option>
                    </select>

                    {range === 'daily' && (
                        <div className="flex items-center border border-black h-[34px]">
                            <button 
                                onClick={() => {
                                    const d = new Date(date);
                                    d.setDate(d.getDate() - 1);
                                    setDate(d.toISOString().split('T')[0]);
                                }}
                                className="px-2 hover:bg-gray-200 h-full flex items-center"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-2 font-mono text-xs font-bold border-l border-r border-black h-full flex items-center bg-gray-50">
                                {date}
                            </span>
                            <button 
                                onClick={() => {
                                    const d = new Date(date);
                                    d.setDate(d.getDate() + 1);
                                    // Prevent going to future if needed, but usually allowed for checking empty days
                                    setDate(d.toISOString().split('T')[0]);
                                }}
                                className="px-2 hover:bg-gray-200 h-full flex items-center"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

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
                            <span>Son İşlemler (Detay için tıkla)</span>
                            <span className="text-gray-500 font-mono">LİMİT: 100</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-black">
                                    <tr className="bg-gray-50 font-bold uppercase text-[10px]">
                                        <th className="p-4 border-r border-gray-200">İŞLEM NO</th>
                                        <th className="p-4 border-r border-gray-200">TARİH / SAAT</th>
                                        <th className="p-4 border-r border-gray-200">ŞUBE / MASA</th>
                                        <th className="p-4 border-r border-gray-200">KAYNAK</th>
                                        <th className="p-4 text-right">TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.transactions.map((t, idx) => (
                                        <tr 
                                            key={idx} 
                                            onClick={() => setSelectedTransaction(t)}
                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-100 transition-colors cursor-pointer group"
                                        >
                                            <td className="p-4 border-r border-gray-200 font-mono group-hover:text-black text-gray-600">#{t.id}</td>
                                            <td className="p-4 border-r border-gray-200 font-mono">
                                                {new Date(t.created_at).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="p-4 border-r border-gray-200 uppercase font-bold text-[11px]">
                                                {t.branch_name} / {t.table_no}
                                            </td>
                                            <td className="p-4 border-r border-gray-200 text-xs font-bold text-blue-600 uppercase">
                                                {t.source}
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
            
            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTransaction(null)}>
                    <div className="bg-white max-w-lg w-full rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-black text-white p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold uppercase tracking-widest">FİŞ DETAYI</h3>
                                <p className="text-[10px] text-gray-400 font-mono">#{selectedTransaction.id}</p>
                            </div>
                            <button onClick={() => setSelectedTransaction(null)} className="p-1 hover:bg-white/20 rounded">
                                <span className="text-xl font-bold">×</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <div>
                                    <div className="text-xs text-gray-500 font-bold uppercase">TARİH</div>
                                    <div className="font-mono font-bold">{new Date(selectedTransaction.created_at).toLocaleString('tr-TR')}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 font-bold uppercase">MASA / KAYNAK</div>
                                    <div className="font-black text-lg">{selectedTransaction.table_no}</div>
                                    <div className="text-xs text-blue-600 font-bold">{selectedTransaction.source}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                    selectedTransaction.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start border-b border-dashed border-gray-200 pb-2 last:border-0">
                                            <div>
                                                <div className="font-bold text-sm">
                                                    {item.quantity}x {item.name}
                                                </div>
                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                    <div className="text-[10px] text-gray-500">
                                                        {item.selectedOptions.map(o => o.name).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-mono text-sm">₺{parseFloat(item.price * (item.quantity||1)).toFixed(2)}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 italic">Ürün detayı bulunamadı.</div>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-black">
                                <span className="font-black text-lg">TOPLAM</span>
                                <span className="font-black text-2xl">₺{parseFloat(selectedTransaction.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
