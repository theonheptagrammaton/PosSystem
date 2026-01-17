import { useState, useEffect, useRef } from 'react';
import { useGodMode } from '../context/GodModeContext';
import { 
  DailyRevenueChart, 
  BranchPerformanceChart, 
  TopProductsChart, 
  CategoryShareChart 
} from '../components/GodMode/AnalyticalCharts';
import io from 'socket.io-client';
import api from '../api';
import Modal from '../components/Modal'; 
import { X, RefreshCcw } from 'lucide-react';

export default function Dashboard() {
  const { isGodMode, toggleGodMode } = useGodMode();
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(0); 
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };
  
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const tenantId = user?.tenant_id;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
      setLoading(true);
      await fetchOrders();
      try {
          const [catRes, prodRes] = await Promise.all([
              api.get('/api/categories'),
              api.get('/api/products')
          ]);
          setCategories(catRes.data);
          setProducts(prodRes.data);
      } catch (err) { console.error('Initial data fetch error', err); }
      finally { setLoading(false); }
  };

  const fetchOrders = async () => {
      try {
          const res = await api.get('/api/orders'); 
          setOrders(res.data);
          calculateOccupancy(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const calculateOccupancy = async (ordersData) => {
    try {
       const branchRes = await api.get('/api/branches');
       const totalCapacity = branchRes.data.reduce((acc, b) => acc + (b.table_count || 10), 0);
       
       if (totalCapacity === 0) {
           setOccupancyRate(0);
           return;
       }

       const activeTables = new Set(
           ordersData.filter(o => o.status === 'PENDING').map(o => o.table_no)
       ).size;

       const rate = Math.round((activeTables / totalCapacity) * 100);
       setOccupancyRate(rate);

    } catch(err) {
        console.error('Occupancy calc error', err);
    }
  };

  useEffect(() => {
    socketRef.current = io(api.defaults.baseURL, {
      query: { tenantId }
    });

    socketRef.current.on('new_order', () => {
      fetchOrders();
    });
    
    socketRef.current.on('table_closed', () => {
        fetchOrders();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [tenantId]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  // Calculations for Charts
  const calculateDailyRevenue = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => o.status === 'TAMAMLANDI' && o.created_at && new Date(o.created_at).toDateString() === today);
    return todayOrders.map(o => {
        const amt = o.amount || o.total_amount || 0;
        return {
            time: new Date(o.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            amount: typeof amt === 'string' ? parseFloat(amt.replace('₺', '')) : parseFloat(amt) || 0
        };
    });
  };

  const calculateBranchPerf = () => {
    const perfMap = {};
    const validOrders = orders.filter(o => o.status === 'TAMAMLANDI');
    validOrders.forEach(o => {
        const amt = o.amount || o.total_amount || 0;
        const amount = typeof amt === 'string' ? parseFloat(amt.replace('₺', '')) : parseFloat(amt) || 0;
        perfMap[o.branch_name] = (perfMap[o.branch_name] || 0) + amount;
    });
    return Object.entries(perfMap).map(([name, total]) => ({ name, total }));
  };

  const calculateTopProducts = () => {
    const prodMap = {};
    const validOrders = orders.filter(o => o.status === 'TAMAMLANDI');
    validOrders.forEach(o => {
        if (!Array.isArray(o.details)) return;
        o.details.forEach(item => {
            prodMap[item.name] = (prodMap[item.name] || 0) + (item.quantity || 1);
        });
    });
    return Object.entries(prodMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
  };

  const calculateCategoryDist = () => {
    const distMap = {};
    const validOrders = orders.filter(o => o.status === 'TAMAMLANDI');
    validOrders.forEach(o => {
        if (!Array.isArray(o.details) && !Array.isArray(o.items)) return;
        const items = o.details || o.items || [];
        items.forEach(item => {
            const product = products.find(p => p.id === item.id);
            const category = categories.find(c => c.id === product?.category_id);
            const catName = category?.name || 'Diğer';
            const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
            const amount = itemPrice * (item.quantity || 1);
            distMap[catName] = (distMap[catName] || 0) + amount;
        });
    });
    return Object.entries(distMap).map(([name, value]) => ({ name, value }));
  };

  const dailyRevenueData = calculateDailyRevenue();
  const branchPerfData = calculateBranchPerf();
  const topProductsData = calculateTopProducts();
  const categoryDistData = calculateCategoryDist();

  const shouldShowGodMode = isGodMode || isMobile;

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white text-black">
              <div className="text-center">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-xs font-black uppercase tracking-widest animate-pulse">YÜKLENİYOR</p>
              </div>
          </div>
      );
  }

  if (shouldShowGodMode) {
    return (
      <div className="p-8 h-full bg-black text-white overflow-y-auto relative font-sans">
        <div className="flex justify-between items-center border-b-2 border-white pb-4 mb-8">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em]">
                {isMobile ? 'MOBİL ANALİZ' : 'ANALİTİK KONTROL ÜSSÜ // GOD MODE'}
            </h1>
            
            <div className="flex items-center gap-4 md:gap-8">
                {isMobile && (
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 border-2 border-red-600 text-red-600 font-bold text-xs uppercase hover:bg-red-600 hover:text-white transition-colors"
                    >
                        ÇIKIŞ
                    </button>
                )}
                <div className="text-right hidden lg:block">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">SİSTEM KAPASİTESİ</div>
                    <div className="text-3xl font-black">%{occupancyRate}</div>
                </div>

                {!isMobile && (
                    <button 
                        onClick={toggleGodMode}
                        className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
                        title="PANELDEN ÇIK"
                    >
                        <X size={24} />
                    </button>
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: GÜNLÜK GELİR AKIŞI</span>
                <span className="text-white">CANLI // AKTİF</span>
             </div>
             <div className="h-64">
                <DailyRevenueChart data={dailyRevenueData} />
             </div>
          </div>

          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: ŞUBE PERFORMANSI</span>
                <span className="text-white">KARŞILAŞTIRMALI</span>
             </div>
             <div className="h-64">
                <BranchPerformanceChart data={branchPerfData} />
             </div>
          </div>

          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: EN ÇOK SATANLAR</span>
                <span className="text-white">İLK 5 ÜRÜN</span>
             </div>
             <div className="h-64">
                <TopProductsChart data={topProductsData} />
             </div>
          </div>

          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: KATEGORİ DAĞILIMI</span>
                <span className="text-white">CİRO %</span>
             </div>
             <div className="h-64">
                <CategoryShareChart data={categoryDistData} />
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard View
  return (
    <div className="p-8 h-full relative font-sans text-black">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black uppercase tracking-widest">Canlı Durum</h1>
          <button onClick={fetchOrders} className="p-2 border border-black hover:bg-black hover:text-white transition-colors">
              <RefreshCcw size={20}/>
          </button>
      </div>
      
      <div className="w-full border-2 border-black max-w-5xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-black text-white">
              <th className="p-4 font-bold uppercase text-xs tracking-widest">Sipariş ID</th>
              <th className="p-4 font-bold uppercase text-xs tracking-widest">Tarih</th>
              <th className="p-4 font-bold uppercase text-xs tracking-widest">Bayi / Masa</th>
              <th className="p-4 font-bold uppercase text-xs tracking-widest">Durum</th>
              <th className="p-4 font-bold uppercase text-xs tracking-widest">Tutar</th>
              <th className="p-4 font-bold uppercase text-xs tracking-widest text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
               <tr>
                 <td colSpan="6" className="p-8 text-center text-gray-400 font-bold uppercase italic">HENÜZ SİPARİŞ YOK</td>
               </tr>
            ) : orders.map((row, idx) => (
              <tr key={idx} className="border-b border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 border-r border-gray-200 font-mono font-bold">#{row.id}</td>
                <td className="p-4 border-r border-gray-200 font-mono text-xs">
                    {new Date(row.created_at).toLocaleDateString('tr-TR')} <span className="text-gray-400">|</span> {new Date(row.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td className="p-4 border-r border-gray-200 text-sm">
                    <div className="font-black uppercase">{row.branch_name || '-'}</div>
                    <div className="text-xs text-gray-500 font-mono uppercase">{row.table_no || '-'}</div>
                </td>
                <td className="p-4 border-r border-gray-200 text-xs font-bold">
                  <span className={`px-3 py-1 uppercase tracking-widest font-black inline-block text-[10px]
                    ${row.status === 'DOLU' || row.status === 'PENDING' ? 'bg-black text-white animate-pulse' : 
                      row.status === 'TAMAMLANDI' || row.status === 'COMPLETED' ? 'bg-white text-black border border-black' :
                      'bg-gray-200 text-gray-600'}`}>
                    {row.status === 'PENDING' ? 'BEKLİYOR' : row.status}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold border-r border-gray-200">
                  {typeof row.amount === 'string' ? row.amount : 
                   typeof row.total_amount === 'number' ? `₺${row.total_amount.toFixed(2)}` :
                   row.total_amount ? `₺${parseFloat(row.total_amount).toFixed(2)}` : '₺0.00'}
                </td>
                <td className="p-4 text-center">
                   <button 
                     onClick={() => handleViewOrder(row)}
                     className="text-xs font-bold uppercase underline hover:no-underline hover:bg-black hover:text-white px-2 py-1 transition-colors"
                   >
                     DETAY
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {/* View Modal */}
        <Modal 
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title="SİPARİŞ DETAYI"
        >
          {selectedOrder && (
            <div className="font-mono text-sm">
              <div className="grid grid-cols-2 gap-4 mb-4 border-b border-black pb-4">
                  <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">ID</div>
                      <div className="text-lg font-black">#{selectedOrder.id}</div>
                  </div>
                  <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Tutar</div>
                      <div className="text-lg font-black">
                        {typeof selectedOrder.amount === 'string' ? selectedOrder.amount :
                        typeof selectedOrder.total_amount === 'number' ? `₺${selectedOrder.total_amount.toFixed(2)}` :
                        selectedOrder.total_amount ? `₺${parseFloat(selectedOrder.total_amount).toFixed(2)}` : '₺0.00'}
                      </div>
                  </div>
                  <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Masa</div>
                      <div className="font-bold">{selectedOrder.table_no}</div>
                  </div>
                  <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase">Şube</div>
                      <div className="font-bold">{selectedOrder.branch_name}</div>
                  </div>
              </div>

              <div>
                <strong className="text-black uppercase text-xs tracking-widest block mb-2">Sipariş İçeriği</strong>
                {selectedOrder.details || selectedOrder.items ? (
                  <div className="space-y-1">
                    {(selectedOrder.details || selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between bg-gray-50 p-2 border border-gray-100">
                        <span className="font-bold">{item.name} <span className="text-xs font-normal text-gray-500">x{item.quantity || 1}</span></span>
                        <span>₺{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Detay bulunamadı</p>
                )}
              </div>
            </div>
          )}
        </Modal>
    </div>
  );
}
