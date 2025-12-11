import { useState, useEffect, useRef } from 'react';
import { useGodMode } from '../context/GodModeContext';
import RevenueChart from '../components/GodMode/RevenueChart';
import OccupancyGauge from '../components/GodMode/OccupancyGauge';
import io from 'socket.io-client';
import axios from 'axios';
import { Terminal } from 'lucide-react';

export default function Dashboard() {
  const { isGodMode } = useGodMode();
  const [orders, setOrders] = useState([
    { id: 'T-01', status: 'OCCUPIED', amount: '$124.50' },
    { id: 'T-02', status: 'AVAILABLE', amount: '-' },
    { id: 'T-03', status: 'OCCUPIED', amount: '$45.00' },
    { id: 'T-04', status: 'RESERVED', amount: '-' },
    { id: 'T-05', status: 'OCCUPIED', amount: '$210.00' },
  ]);
  const [chartData, setChartData] = useState([
    { time: '09:00', amount: 1200 },
    { time: '10:00', amount: 2100 },
    { time: '11:00', amount: 1800 },
    { time: '12:00', amount: 4500 },
    { time: '13:00', amount: 3200 },
  ]);
  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const tenantId = user?.tenant_id;

  useEffect(() => {
    // Initialize Socket connection
    socketRef.current = io('http://localhost:5001', {
      query: { tenantId }
    });

    // Listen for new orders
    socketRef.current.on('new_order', (data) => {
      console.log('New Order Received:', data);
      
      // Update Chart Data (Rolling Window)
      setChartData(prev => {
        const newData = {
          time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: data.amount
        };
        const updated = [...prev, newData];
        if (updated.length > 20) return updated.slice(updated.length - 20);
        return updated;
      });

      // Update Orders Table
      setOrders(prev => {
        const newOrder = {
          id: `ORD-${Math.floor(Math.random() * 1000)}`,
          status: 'JUST PLACED',
          amount: `$${data.amount}`
        };
        return [newOrder, ...prev].slice(0, 10); // Keep last 10
      });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [tenantId]);

  const handleSimulateOrder = async () => {
    try {
      await axios.post('http://localhost:5001/api/test/simulate-order', { tenantId });
    } catch (error) {
      console.error('Simulation failed', error);
      alert('SIMULATION FAILED');
    }
  };

  if (isGodMode) {
    return (
      <div className="p-8 h-full bg-black text-white overflow-y-auto relative">
        <h1 className="text-2xl font-bold uppercase mb-6 tracking-widest border-b border-white pb-2 inline-block">
          ANALYTICS_OVERRIDE_ENABLED
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Chart 1: Revenue - Main Floor */}
          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRIC: SALES_FLOW // ZONE: A</div>
             <RevenueChart data={chartData} />
          </div>

          {/* Chart 2: Occupancy - Main Floor */}
          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRIC: CAPACITY // ZONE: A</div>
             <OccupancyGauge percentage={75} />
          </div>

          {/* Chart 3: Occupancy - Terrace (Simulated) */}
          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRIC: CAPACITY // ZONE: B</div>
             <OccupancyGauge percentage={42} />
          </div>

          {/* Chart 4: Revenue - Delivery (Simulated) */}
          <div className="border border-white p-4">
             <div className="mb-2 text-xs font-mono text-gray-400">METRIC: SALES_FLOW // DELIVERY</div>
             <RevenueChart data={chartData} />
          </div>
        </div>

        {/* Simulation Button (Fixed Bottom Right) */}
        <button 
          onClick={handleSimulateOrder}
          className="fixed bottom-8 right-8 bg-white text-black border-2 border-white px-6 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-white transition-colors z-50 flex items-center gap-2"
        >
          <Terminal size={20} />
          <span>TEST: SIMULATE ORDER</span>
        </button>
      </div>
    );
  }

  // Standard View
  return (
    <div className="p-8 h-full relative">
      <h1 className="text-2xl font-bold uppercase mb-6">Live Status</h1>
      
      <div className="w-full border border-black max-w-4xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black bg-gray-100">
              <th className="p-4 border-r border-black font-bold uppercase text-sm w-1/4">Order / Table</th>
              <th className="p-4 border-r border-black font-bold uppercase text-sm w-1/4">Status</th>
              <th className="p-4 font-bold uppercase text-sm w-1/4">Amount</th>
              <th className="p-4 border-l border-black font-bold uppercase text-sm w-1/4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row, idx) => (
              <tr key={idx} className="border-b border-black last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 border-r border-black font-mono">{row.id}</td>
                <td className="p-4 border-r border-black text-xs font-bold">
                  <span className={`px-2 py-1 ${
                    row.status === 'OCCUPIED' ? 'bg-black text-white' : 
                    row.status === 'JUST PLACED' ? 'bg-black text-white animate-pulse' :
                    row.status === 'AVAILABLE' ? 'border border-gray-400 text-gray-400' : 'bg-gray-200'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="p-4 font-mono">{row.amount}</td>
                <td className="p-4 border-l border-black text-center">
                   <button className="text-xs underline hover:no-underline">VIEW</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Simulation Button (Fixed Bottom Right) */}
       <button 
          onClick={handleSimulateOrder}
          className="fixed bottom-8 right-8 bg-black text-white border-2 border-black px-6 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors z-50 flex items-center gap-2"
        >
          <Terminal size={20} />
          <span>TEST: SIMULATE ORDER</span>
        </button>
    </div>
  );
}
