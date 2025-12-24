import { useState, useEffect, useRef } from 'react';
import { useGodMode } from '../context/GodModeContext';
import { 
  DailyRevenueChart, 
  BranchPerformanceChart, 
  TopProductsChart, 
  CategoryShareChart 
} from '../components/GodMode/AnalyticalCharts';
import OccupancyGauge from '../components/GodMode/OccupancyGauge';
import io from 'socket.io-client';
import api from '../api';
import Modal from '../components/Modal'; // Assuming Modal exists, verified in file list
import { Terminal, X } from 'lucide-react';

export default function Dashboard() {
  const { isGodMode, toggleGodMode } = useGodMode();
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [occupancyRate, setOccupancyRate] = useState(0); 
  const [selectedOrder, setSelectedOrder] = useState(null); 
  
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const tenantId = user?.tenant_id;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
      fetchOrders();
      try {
          const [catRes, prodRes] = await Promise.all([
              api.get('/api/categories'),
              api.get('/api/products')
          ]);
          setCategories(catRes.data);
          setProducts(prodRes.data);
      } catch (err) { console.error('Initial data fetch error', err); }
  };

  const fetchOrders = async () => {
      try {
          const res = await api.get('/api/orders'); // Fetch persistent history
          setOrders(res.data);
          calculateOccupancy(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const calculateOccupancy = async (ordersData) => {
    try {
       // 1. Get Total Capacity (from all branches)
       const branchRes = await api.get('/api/branches');
       const totalCapacity = branchRes.data.reduce((acc, b) => acc + (b.table_count || 10), 0);
       
       if (totalCapacity === 0) {
           setOccupancyRate(0);
           return;
       }

       // 2. Count Active Tables (Status = 'DOLU' or based on API pending logic)
       // The orders data from /api/orders returns *all* orders (history + active).
       // We need to filter for active ones. 
       // Note: getAllOrders (Dashboard) creates view models. We need to check 'status' === 'DOLU'.
       
       // Count unique tables that are currently busy
       const activeTables = new Set(
           ordersData.filter(o => o.status === 'DOLU').map(o => o.table_no)
       ).size;

       const rate = Math.round((activeTables / totalCapacity) * 100);
       setOccupancyRate(rate);

    } catch(err) {
        console.error('Occupancy calc error', err);
    }
  };

  useEffect(() => {
    // Initialize Socket connection
    socketRef.current = io(api.defaults.baseURL, {
      query: { tenantId }
    });

    // Listen for new orders
    socketRef.current.on('new_order', (data) => {
      // Refresh list to get db state or optimistic update
      // Simple re-fetch is safest for consistency
      fetchOrders();
    });
    
    // Also listen for closed tables to update status to COMPLETED
    socketRef.current.on('table_closed', () => {
        fetchOrders();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [tenantId]);

  const handleSimulateOrder = async () => {
    try {
      await api.post('/api/test/simulate-order', { tenantId });
    } catch (error) {
      console.error('Simulasyon hatası', error);
      alert('SİMULASYON BAŞARISIZ');
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  // 1. Daily Revenue Flow
  const calculateDailyRevenue = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => o.created_at && new Date(o.created_at).toDateString() === today);
    return todayOrders.map(o => ({
        time: new Date(o.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        amount: parseFloat(o.amount.replace('₺', '')) || 0
    }));
  };

  // 2. Branch Performance
  const calculateBranchPerf = () => {
    const perfMap = {};
    orders.forEach(o => {
        const amount = parseFloat(o.amount.replace('₺', '')) || 0;
        perfMap[o.branch_name] = (perfMap[o.branch_name] || 0) + amount;
    });
    return Object.entries(perfMap).map(([name, total]) => ({ name, total }));
  };

  // 3. Top Products
  const calculateTopProducts = () => {
    const prodMap = {};
    orders.forEach(o => {
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

  // 4. Category Distribution
  const calculateCategoryDist = () => {
    const distMap = {};
    orders.forEach(o => {
        if (!Array.isArray(o.details)) return;
        o.details.forEach(item => {
            const product = products.find(p => p.id === item.id);
            const category = categories.find(c => c.id === product?.category_id);
            const catName = category?.name || 'Diğer';
            const amount = (parseFloat(item.price) || 0) * (item.quantity || 1);
            distMap[catName] = (distMap[catName] || 0) + amount;
        });
    });
    return Object.entries(distMap).map(([name, value]) => ({ name, value }));
  };

  const dailyRevenueData = calculateDailyRevenue();
  const branchPerfData = calculateBranchPerf();
  const topProductsData = calculateTopProducts();
  const categoryDistData = calculateCategoryDist();

  if (isGodMode) {
    return (
      <div className="p-8 h-full bg-black text-white overflow-y-auto relative">
        <div className="flex justify-between items-center border-b-2 border-white pb-4 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-[0.2em]">
                ANALİTİK KONTROL ÜSSÜ // GOD MODE
            </h1>
            
            <div className="flex items-center gap-8">
                <div className="text-right hidden lg:block">
                    <div className="text-[10px] font-mono text-gray-500 uppercase">SİSTEM KAPASİTESİ</div>
                    <div className="text-3xl font-black">%{occupancyRate}</div>
                </div>

                <button 
                    onClick={toggleGodMode}
                    className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
                    title="PANELDEN ÇIK"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {/* DAILY REVENUE */}
          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: GÜNLÜK GELİR AKIŞI</span>
                <span className="text-white">CANLI // AKTİF</span>
             </div>
             <div className="h-64">
                <DailyRevenueChart data={dailyRevenueData} />
             </div>
          </div>

          {/* BRANCH PERFORMANCE */}
          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: ŞUBE PERFORMANSI</span>
                <span className="text-white">KARŞILAŞTIRMALI</span>
             </div>
             <div className="h-64">
                <BranchPerformanceChart data={branchPerfData} />
             </div>
          </div>

          {/* TOP PRODUCTS */}
          <div className="border border-white/20 bg-white/5 p-6 backdrop-blur-md">
             <div className="mb-4 flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <span>METRİK: EN ÇOK SATANLAR</span>
                <span className="text-white">İLK 5 ÜRÜN</span>
             </div>
             <div className="h-64">
                <TopProductsChart data={topProductsData} />
             </div>
          </div>

          {/* CATEGORY DISTRIBUTION */}
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

        {/* Global Stats Overlay */}


        <button 
          onClick={handleSimulateOrder}
          className="fixed bottom-8 right-8 bg-white text-black border-2 border-white px-6 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-white transition-colors z-50 flex items-center gap-2"
        >
          <Terminal size={20} />
          <span>TEST: SİPARİŞ SİMULE ET</span>
        </button>
      </div>
    );
  }

  // Standard View
  return (
    <div className="p-8 h-full relative">
      <h1 className="text-2xl font-bold uppercase mb-6">Canlı Durum</h1>
      
      <div className="w-full border border-black max-w-5xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black bg-gray-100">
              <th className="p-4 border-r border-black font-bold uppercase text-sm">Sipariş ID</th>
              <th className="p-4 border-r border-black font-bold uppercase text-sm">Bayi / Masa</th>
              <th className="p-4 border-r border-black font-bold uppercase text-sm">Durum</th>
              <th className="p-4 font-bold uppercase text-sm">Tutar</th>
              <th className="p-4 border-l border-black font-bold uppercase text-sm text-center">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
               <tr>
                 <td colSpan="5" className="p-4 text-center text-gray-400 italic">HENÜZ SİPARİŞ YOK</td>
               </tr>
            ) : orders.map((row, idx) => (
              <tr key={idx} className="border-b border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 border-r border-black font-mono">{row.id}</td>
                <td className="p-4 border-r border-black text-sm">
                    <div className="font-bold">{row.branch_name || '-'}</div>
                    <div className="text-xs text-gray-500">{row.table_no || '-'}</div>
                </td>
                <td className="p-4 border-r border-black text-xs font-bold">
                  <span className={`px-2 py-1 ${
                    row.status === 'DOLU' ? 'bg-red-600 text-black animate-pulse' : 
                    row.status === 'TAMAMLANDI' ? 'bg-green-600 text-black' :
                    'bg-gray-200 text-black'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="p-4 font-mono">{row.amount}</td>
                <td className="p-4 border-l border-black text-center">
                   <button 
                     onClick={() => handleViewOrder(row)}
                     className="text-xs underline hover:no-underline"
                   >
                     GÖRÜNTÜLE
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Simulation Button */}
       <button 
          onClick={handleSimulateOrder}
          className="fixed bottom-8 right-8 bg-black text-white border-2 border-black px-6 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors z-50 flex items-center gap-2"
        >
          <Terminal size={20} />
          <span>TEST: SİPARİŞ SİMULE ET</span>
        </button>

        {/* View Modal */}
        <Modal 
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title="SİPARİŞ DETAYI"
        >
          {selectedOrder && (
            <div>
              <p className="mb-2"><strong>ID:</strong> {selectedOrder.id}</p>
              <p className="mb-2"><strong>Tutar:</strong> {selectedOrder.amount}</p>
              <p className="mb-2"><strong>Durum:</strong> {selectedOrder.status}</p>
              <div className="mt-4 border-t border-gray-300 pt-2">
                <strong>İçerik:</strong>
                <pre className="text-xs bg-gray-100 p-2 mt-1">{JSON.stringify(selectedOrder.details, null, 2)}</pre>
              </div>
            </div>
          )}
        </Modal>
    </div>
  );
}
