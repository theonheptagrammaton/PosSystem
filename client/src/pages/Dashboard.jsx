import { useState, useEffect, useRef } from 'react';
import { useGodMode } from '../context/GodModeContext';
import RevenueChart from '../components/GodMode/RevenueChart';
import OccupancyGauge from '../components/GodMode/OccupancyGauge';
import io from 'socket.io-client';
import api from '../api';
import Modal from '../components/Modal'; // Assuming Modal exists, verified in file list
import { Terminal } from 'lucide-react';

export default function Dashboard() {
  const { isGodMode } = useGodMode();
  const [orders, setOrders] = useState([]);
  const [chartData, setChartData] = useState([
    { time: '09:00', amount: 1200 },
    { time: '10:00', amount: 2100 },
    { time: '11:00', amount: 1800 },
    { time: '12:00', amount: 4500 },
    { time: '13:00', amount: 3200 },
  ]);
  const [selectedOrder, setSelectedOrder] = useState(null); // For View Button
  
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const tenantId = user?.tenant_id;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
      try {
          const res = await api.get('/api/orders'); // Fetch persistent history
          setOrders(res.data);
      } catch (err) {
          console.error(err);
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

  if (isGodMode) {
    return (
      <div className="p-8 h-full bg-black text-white overflow-y-auto relative">
        <h1 className="text-2xl font-bold uppercase mb-6 tracking-widest border-b border-white pb-2 inline-block">
          ANALİTİK KONTROL MODU
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRİK: SATIŞ AKIŞI // BÖLGE: A</div>
             <RevenueChart data={chartData} />
          </div>

          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRİK: KAPASİTE // BÖLGE: A</div>
             <OccupancyGauge percentage={75} />
          </div>

          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRİK: KAPASİTE // BÖLGE: B</div>
             <OccupancyGauge percentage={42} />
          </div>

          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRİK: SATIŞ AKIŞI // PAKET SERVİS</div>
             <RevenueChart data={chartData} />
          </div>
        </div>

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
                    row.status === 'DOLU' ? 'bg-red-600 text-white animate-pulse' : 
                    row.status === 'TAMAMLANDI' ? 'bg-green-600 text-white' :
                    'bg-gray-200'
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
