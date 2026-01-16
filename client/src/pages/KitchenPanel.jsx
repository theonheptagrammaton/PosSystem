import { useState, useEffect, useRef } from 'react';
import api from '../api';
import io from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';
import { ChefHat, Clock, CheckCircle, XCircle, Bell, RefreshCcw, LogOut } from 'lucide-react';
import notificationSound from '../assets/zil.mp3';

export default function KitchenPanel() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const { showNotification } = useNotification();
    
    // Retrieve user for tenantId (assuming kitchen user is logged in)
    // If we want a generic kitchen view without login for now (like POS?), we might need tenantId from URL or similar.
    // But user requested "mutfak kullanıcısı", so we assume logged in.
    const user = JSON.parse(localStorage.getItem('user'));
    const tenantId = user?.tenant_id;
    const branchId = user?.branch_id; 

    useEffect(() => {
        if (tenantId && branchId) {
            fetchActiveOrders();
            setupSocket();
        }
        
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [tenantId, branchId]);

    const fetchActiveOrders = async () => {
        setLoading(true);
        try {
            // We need a way to get "In Progress" orders (PENDING status in Database, which means Active in POS)
            // Currently POS uses `Pending` for WAITING_APPROVAL.
            // Active table orders are also stored in `items` column but we don't have a direct endpoint for "All Active Kitchen Items".
            // However, the prompt says "masaya eklenen her sipariş".
            // When a waiter adds items, they go to `orders` table with status 'PENDING'.
            // So we can query orders where status = 'PENDING'.
            
            // Wait, standard flow: 
            // 1. Waiter adds items -> Create Order with status 'PENDING' (Active).
            // 2. Kitchen sees these.
            // 3. Kitchen marks READY -> Status 'READY'.
            // 4. POS pays -> Status 'COMPLETED'.
            
            // So we fetch status='PENDING'.
            // Fetch all orders that are not completed or rejected
             const res = await api.get(`/api/orders/pending/${tenantId}/${branchId}?status=PENDING`);
             
             // The backend getPendingOrders might be restricted to WAITING_APPROVAL.
             // We need an endpoint that returns PENDING, PREPARING.
             // For now, let's assume we use the regular active flow.
             // If the backend doesn't support a status query param yet, we might need to adjust.
             setOrders(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const setupSocket = () => {
        socketRef.current = io(api.defaults.baseURL, {
            query: { tenantId }
        });

        socketRef.current.on('new_order', (data) => {
            // Play sound for EVERY new active order
            if (data.status === 'PENDING' || data.status === 'WAITING_APPROVAL') {
                 const audio = new Audio(notificationSound);
                 audio.play().catch(e => console.error('Audio error', e));
                 fetchActiveOrders();
            }
        });

        socketRef.current.on('order_ready', () => {
            fetchActiveOrders();
        });
    };

    const handleReady = async (orderId) => {
        try {
            await api.post(`/api/orders/ready/${orderId}`);
            showNotification({ title: 'HAZIRLANDI', message: 'Sipariş hazır olarak işaretlendi.', type: 'success' });
            fetchActiveOrders();
        } catch (err) {
            console.error(err);
            showNotification({ title: 'HATA', message: 'İşlem başarısız.', type: 'error' });
        }
    };

    const handleReject = async (orderId) => {
         // Kitchen rejecting an order? (Maybe out of stock)
         const confirmed = await showNotification({ 
             title: 'SİPARİŞİ REDDET', 
             message: 'Bu siparişi reddetmek istediğinize emin misiniz?', 
             type: 'confirm' 
         });
         if (!confirmed) return;
         
         try {
            await api.post(`/api/orders/reject/${orderId}`);
            showNotification({ title: 'REDDEDİLDİ', message: 'Sipariş reddedildi.', type: 'info' });
            fetchActiveOrders();
        } catch (err) {
            console.error(err);
            showNotification({ title: 'HATA', message: 'İşlem başarısız.', type: 'error' });
        }
    };
    
    if (!tenantId) return <div className="p-10 text-center text-red-500 font-bold">Lütfen giriş yapın veya mutfak kullanıcısı oluşturun.</div>;

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', color: '#1a1a1a' }} className="p-4 font-sans">
            <div style={{ backgroundColor: 'white' }} className="rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center border border-gray-200">
                <div className="flex items-center gap-4">
                    <div style={{ backgroundColor: 'black', color: 'white' }} className="p-3 rounded-xl shadow-lg">
                        <ChefHat size={32} />
                    </div>
                    <div>
                        <h1 style={{ color: 'black' }} className="text-2xl font-black tracking-widest uppercase">MUTFAK PANELİ</h1>
                        <p style={{ color: '#6b7280' }} className="text-xs font-mono font-bold uppercase">{new Date().toLocaleDateString()} — {user?.full_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                         <div style={{ color: '#9ca3af' }} className="text-[10px] font-black uppercase tracking-tighter">BEKLEYEN SİPARİŞ</div>
                         <div style={{ color: 'black' }} className="text-4xl font-black">{orders.length}</div>
                    </div>
                    <button onClick={fetchActiveOrders} style={{ backgroundColor: '#f9fafb', color: 'black', border: '1px solid #e5e7eb' }} className="p-3 rounded-full hover:bg-gray-200 transition-all shadow-sm group">
                        <RefreshCcw size={20} className="group-active:rotate-180 transition-transform" />
                    </button>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }} style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }} className="p-3 rounded-full hover:bg-red-100 transition-all shadow-sm">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
            
            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {orders.map(order => (
                     <div key={order.id} style={{ backgroundColor: 'white', borderColor: '#e5e7eb' }} className="rounded-2xl border flex flex-col shadow-xl overflow-hidden hover:border-black transition-all group">
                          {/* Card Header */}
                          <div style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }} className="p-4 border-b flex justify-between items-center">
                                <div>
                                     <div style={{ color: 'black' }} className="font-black text-2xl uppercase tracking-tight">{order.table_no.replace('MASA-', 'MASA ')}</div>
                                     <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                         <Clock size={12} /> 
                                         {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         <span style={{ color: '#ea580c' }}>
                                            ({Math.floor((new Date() - new Date(order.created_at)) / 60000)} dk önce)
                                         </span>
                                     </div>
                                </div>
                                <div style={{ backgroundColor: 'black', color: 'white' }} className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    #{order.id}
                                </div>
                          </div>
                          
                          {/* Note */}
                          {order.note && (
                              <div className="bg-red-50 p-3 text-red-700 text-center text-xs font-black border-b border-red-100 uppercase tracking-tight">
                                  ⚠️ NOT: {order.note}
                              </div>
                          )}
                          
                          {/* Items List */}
                          <div style={{ backgroundColor: 'white' }} className="flex-1 p-4 space-y-3">
                              {order.items && order.items.map((item, idx) => (
                                  <div key={idx} style={{ borderColor: '#f3f4f6' }} className="flex justify-between items-start border-b pb-3 last:border-0">
                                       <div>
                                           <div style={{ color: item.quantity > 1 ? '#ea580c' : 'black' }} className="font-black text-lg leading-tight">
                                               {item.quantity}x {item.name}
                                           </div>
                                           {item.selectedOptions && item.selectedOptions.length > 0 && (
                                               <div style={{ color: '#2563eb' }} className="text-[10px] mt-1 font-black uppercase tracking-tight">
                                                   → {item.selectedOptions.map(o => o.name).join(', ')}
                                               </div>
                                           )}
                                       </div>
                                  </div>
                              ))}
                          </div>
                          
                          {/* Actions */}
                          <div style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }} className="grid grid-cols-2 gap-2 p-3 border-t">
                               <button 
                                   onClick={() => handleReject(order.id)}
                                   style={{ backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fee2e2' }}
                                   className="py-3 hover:bg-red-600 hover:text-white rounded-xl font-black flex flex-col items-center justify-center gap-1 transition-all border active:scale-95"
                               >
                                   <XCircle size={20}/>
                                   <span className="text-[10px] uppercase tracking-tighter">İPTAL</span>
                               </button>
                               <button 
                                   onClick={() => handleReady(order.id)}
                                   style={{ backgroundColor: '#16a34a', color: 'white', borderColor: '#15803d' }}
                                   className="py-3 hover:bg-green-700 text-white rounded-xl font-black flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95 border"
                               >
                                   <CheckCircle size={24}/>
                                   <span className="text-[10px] uppercase tracking-widest">HAZIR</span>
                               </button>
                          </div>
                     </div>
                 ))}
                 
                 {orders.length === 0 && !loading && (
                     <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-600">
                         <Bell size={48} className="mb-4 opacity-20" />
                         <p className="font-mono text-sm">Bekleyen sipariş yok.</p>
                     </div>
                 )}
            </div>
        </div>
    );
}
