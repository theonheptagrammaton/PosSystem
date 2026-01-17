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
        
        if (!socketRef.current && tenantId) {
            socketRef.current = io(api.defaults.baseURL, {
                query: { tenantId }
            });

            const handleUpdate = () => {
                fetchReportData();
            };

            socketRef.current.on('new_order', handleUpdate);
            socketRef.current.on('table_closed', handleUpdate);
        }

        return () => {
            if (socketRef.current) {
                if (socketRef.current.connected) {
                    socketRef.current.disconnect();
                }
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
        <div className="p-4 md:p-8 h-full bg-white text-black overflow-y-auto pb-24 md:pb-8 font-sans">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b-2 border-black pb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest">RAPORLAR & ANALİZ</h1>
                    <p className="text-gray-500 font-mono text-xs mt-1 uppercase tracking-widest">FİNANSAL PERFORMANS GÖSTERGELERİ</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Range Selector */}
                    <select 
                        value={range} 
                        onChange={(e) => setRange(e.target.value)}
                        className="border-2 border-black px-4 py-3 text-xs font-black uppercase outline-none focus:bg-black focus:text-white transition-colors cursor-pointer"
                    >
                        <option value="daily">Bugün / Günlük</option>
                        <option value="weekly">Bu Hafta</option>
                        <option value="monthly">Bu Ay</option>
                        <option value="all">Tüm Zamanlar</option>
                    </select>

                    {range === 'daily' && (
                        <div className="flex items-center border-2 border-black h-[42px]">
                            <button 
                                onClick={() => {
                                    const d = new Date(date);
                                    d.setDate(d.getDate() - 1);
                                    setDate(d.toISOString().split('T')[0]);
                                }}
                                className="px-3 hover:bg-black hover:text-white h-full flex items-center transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 font-mono text-xs font-bold border-l-2 border-r-2 border-black h-full flex items-center bg-gray-50">
                                {date}
                            </span>
                            <button 
                                onClick={() => {
                                    const d = new Date(date);
                                    d.setDate(d.getDate() + 1);
                                    setDate(d.toISOString().split('T')[0]);
                                }}
                                className="px-3 hover:bg-black hover:text-white h-full flex items-center transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* Branch Selector */}
                    <select 
                        value={selectedBranch} 
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="border-2 border-black px-4 py-3 text-xs font-black uppercase outline-none focus:bg-black focus:text-white transition-colors cursor-pointer"
                    >
                        <option value="all">Tüm Şubeler</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleZReport}
                        className="bg-black text-white px-6 py-3 text-xs font-black uppercase flex items-center gap-2 hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    >
                        <FileText size={16} />
                        Z-RAPORU AL
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center font-black animate-pulse uppercase tracking-widest text-xl">VERİLER HESAPLANIYOR...</div>
            ) : (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border-2 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Toplam Ciro</span>
                                <TrendingUp size={24} className="text-black" />
                            </div>
                            <div className="text-4xl font-black">₺{data.summary.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-2 font-bold uppercase">DÖNEMSEL HAKEDİŞ</div>
                        </div>

                        <div className="border-2 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sipariş Adedi</span>
                                <ShoppingBag size={24} />
                            </div>
                            <div className="text-4xl font-black">{data.summary.total_orders}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-2 font-bold uppercase">TAMAMLANAN SERVİS</div>
                        </div>

                        <div className="border-2 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ortalama Sepet</span>
                                <CreditCard size={24} />
                            </div>
                            <div className="text-4xl font-black">₺{data.summary.avg_order_value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] font-mono text-gray-400 mt-2 font-bold uppercase">SİPARİŞ BAŞINA GELİR</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                        {/* Top Products Table */}
                        <div className="border-2 border-black shadow-lg">
                            <div className="bg-black text-white p-4 font-black uppercase tracking-widest text-xs border-b-2 border-black">
                                EN ÇOK SATANLAR (TOP 10)
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b-2 border-black">
                                    <tr className="bg-gray-100 font-bold uppercase text-[10px] tracking-wider">
                                        <th className="p-4 border-r border-black">Ürün</th>
                                        <th className="p-4 border-r border-black text-center">Adet</th>
                                        <th className="p-4 text-right">Ciro</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.products.map((p, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-black hover:text-white transition-colors group">
                                            <td className="p-4 font-bold uppercase border-r border-gray-100 group-hover:border-black">{p.name}</td>
                                            <td className="p-4 font-mono text-center border-r border-gray-100 group-hover:border-black">{p.total_quantity}</td>
                                            <td className="p-4 text-right font-mono font-bold">₺{parseFloat(p.total_sales).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {data.products.length === 0 && (
                                        <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic font-bold uppercase tracking-widest">VERİ BULUNAMADI</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Category Performance */}
                        <div className="border-2 border-black shadow-lg">
                            <div className="bg-black text-white p-4 font-black uppercase tracking-widest text-xs border-b-2 border-black">
                                KATEGORİ PERFORMANSI
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b-2 border-black">
                                    <tr className="bg-gray-100 font-bold uppercase text-[10px] tracking-wider">
                                        <th className="p-4 border-r border-black">Kategori</th>
                                        <th className="p-4 border-r border-black text-right">Ciro</th>
                                        <th className="p-4 text-right">Pay %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.categories.map((c, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-black hover:text-white transition-colors group">
                                            <td className="p-4 font-bold uppercase border-r border-gray-100 group-hover:border-black">{c.category_name}</td>
                                            <td className="p-4 text-right font-mono font-bold border-r border-gray-100 group-hover:border-black">₺{parseFloat(c.total_sales).toFixed(2)}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="font-mono text-[10px] font-bold">
                                                        {((parseFloat(c.total_sales) / data.summary.total_revenue) * 100).toFixed(1)}%
                                                    </span>
                                                    <div className="w-16 h-2 bg-gray-200 border border-black overflow-hidden group-hover:border-white">
                                                        <div 
                                                            className="h-full bg-black group-hover:bg-white" 
                                                            style={{ width: `${(parseFloat(c.total_sales) / data.summary.total_revenue) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.categories.length === 0 && (
                                        <tr><td colSpan="3" className="p-10 text-center text-gray-400 italic font-bold uppercase tracking-widest">VERİ BULUNAMADI</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Detailed Transactions List */}
                    <div className="mt-12 border-2 border-black shadow-lg">
                        <div className="bg-black text-white p-4 font-black uppercase tracking-widest text-xs flex justify-between items-center border-b-2 border-black">
                            <span>SON İŞLEMLER (DETAY İÇİN TIKLA)</span>
                            <span className="text-gray-400 font-mono text-[10px]">LİMİT: 100</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b-2 border-black">
                                    <tr className="bg-gray-100 font-bold uppercase text-[10px] tracking-wider">
                                        <th className="p-4 border-r border-black">İŞLEM ID</th>
                                        <th className="p-4 border-r border-black">TARİH / SAAT</th>
                                        <th className="p-4 border-r border-black">ŞUBE / MASA</th>
                                        <th className="p-4 border-r border-black">KAYNAK</th>
                                        <th className="p-4 text-right">TUTAR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.transactions.map((t, idx) => (
                                        <tr 
                                            key={idx} 
                                            onClick={() => setSelectedTransaction(t)}
                                            className="border-b border-gray-100 last:border-0 hover:bg-black hover:text-white transition-colors cursor-pointer group"
                                        >
                                            <td className="p-4 border-r border-gray-100 font-mono font-bold group-hover:border-black">#{t.id}</td>
                                            <td className="p-4 border-r border-gray-100 font-mono text-xs group-hover:border-black">
                                                {new Date(t.created_at).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="p-4 border-r border-gray-100 uppercase font-bold text-[11px] group-hover:border-black">
                                                {t.branch_name} / {t.table_no}
                                            </td>
                                            <td className="p-4 border-r border-gray-100 text-xs font-bold uppercase group-hover:border-black">
                                                {t.source}
                                            </td>
                                            <td className="p-4 text-right font-black font-mono">₺{parseFloat(t.total_amount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {data.transactions.length === 0 && (
                                        <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic font-bold uppercase tracking-widest">İŞLEM HENÜZ YOK</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)}>
                    <div className="bg-white max-w-lg w-full border-2 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]" onClick={e => e.stopPropagation()}>
                        <div className="bg-black text-white p-4 flex justify-between items-center border-b-2 border-black">
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-lg">FİŞ DETAYI</h3>
                                <p className="text-[10px] text-gray-400 font-mono">#{selectedTransaction.id}</p>
                            </div>
                            <button onClick={() => setSelectedTransaction(null)} className="p-2 hover:bg-white hover:text-black border border-transparent hover:border-white transition-colors">
                                <span className="text-xl font-black">✕</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4 border-dashed">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">TARİH</div>
                                    <div className="font-mono font-bold text-sm">{new Date(selectedTransaction.created_at).toLocaleString('tr-TR')}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">MASA / KAYNAK</div>
                                    <div className="font-black text-lg uppercase">{selectedTransaction.table_no}</div>
                                    <div className="text-[10px] font-bold uppercase bg-black text-white px-1 inline-block">{selectedTransaction.source}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                                    selectedTransaction.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 p-1">
                                            <div>
                                                <div className="font-bold text-sm uppercase">
                                                    {item.quantity}<span className="text-[10px] mx-1">x</span>{item.name}
                                                </div>
                                                {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                    <div className="text-[9px] text-gray-500 font-mono mt-1">
                                                        {item.selectedOptions.map(o => o.name).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="font-mono text-sm font-bold">₺{parseFloat(item.price * (item.quantity||1)).toFixed(2)}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 italic font-bold uppercase text-xs">ÜRÜN DETAYI BULUNAMADI</div>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-center pt-4 border-t-2 border-black">
                                <span className="font-black text-xl uppercase tracking-widest">TOPLAM</span>
                                <span className="font-black text-3xl">₺{parseFloat(selectedTransaction.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
