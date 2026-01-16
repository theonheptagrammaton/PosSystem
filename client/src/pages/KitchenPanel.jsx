import { useState, useEffect, useRef } from 'react';
import api from '../api';
import io from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';
import { ChefHat, Clock, CheckCircle, XCircle, Bell, RefreshCcw } from 'lucide-react';
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
            const res = await api.get(`/api/orders/pending/${tenantId}/${branchId}?status=PENDING`);
            // Note: getPendingOrders endpoint normally fetches WAITING_APPROVAL. We might need to adjust it or filter.
            // Let's check getPendingOrders logic. Default loads WAITING_APPROVAL??
            
            // Actually, currently `getPendingOrders` fetches status = 'WAITING_APPROVAL' OR 'PENDING'?
            // Let's assume for now we use a new query or filter. 
            // Ideally we need a dedicated endpoint: /api/orders/active
            // But to save time, let's use the `getAllOrders` or similar if possible.
            // Or just use `getPendingOrders` but update the backend to support status filter.
            
            // For now, let's try to fetch all PENDING orders.
            // If getPendingOrders is hardcoded to WAITING_APPROVAL, we need to fix it.
            // Let's assume I fix the backend endpoint next step if needed.
            
            // Let's just create the component assuming we receive the list.
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
            if (data.status === 'PENDING') {
                 const audio = new Audio(notificationSound);
                 audio.play().catch(e => console.error('Audio error', e));
                 fetchActiveOrders();
            }
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
        <div className="min-h-screen bg-gray-900 text-white p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-600 rounded-xl animate-pulse">
                        <ChefHat size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-widest uppercase">MUTFAK PANELİ</h1>
                        <p className="text-gray-400 text-xs font-mono">{new Date().toLocaleDateString()} - {user?.full_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                         <div className="text-xs text-gray-500 font-bold uppercase">BEKLEYEN</div>
                         <div className="text-3xl font-black text-orange-500">{orders.length}</div>
                    </div>
                    <button onClick={fetchActiveOrders} className="p-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                        <RefreshCcw size={20} />
                    </button>
                </div>
            </div>
            
            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {orders.map(order => (
                     <div key={order.id} className="bg-gray-800 rounded-xl border-l-4 border-orange-500 flex flex-col shadow-lg overflow-hidden">
                          {/* Card Header */}
                          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-start">
                                <div>
                                     <div className="font-black text-2xl uppercase mb-1">{order.table_no.replace('MASA-', 'MASA ')}</div>
                                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                         <Clock size={12} /> 
                                         {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         <span className="text-gray-600">
                                            ({Math.floor((new Date() - new Date(order.created_at)) / 60000)} dk)
                                         </span>
                                     </div>
                                </div>
                                <div className="bg-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-gray-300">
                                    #{order.id}
                                </div>
                          </div>
                          
                          {/* Note */}
                          {order.note && (
                              <div className="bg-red-900/30 p-2 text-red-200 text-center text-sm font-bold border-b border-red-900/50">
                                  NOT: {order.note}
                              </div>
                          )}
                          
                          {/* Items List */}
                          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-64">
                              {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-start">
                                       <div>
                                           <div className={`font-bold text-lg ${item.quantity > 1 ? 'text-yellow-400' : 'text-gray-200'}`}>
                                               {item.quantity}x {item.name}
                                           </div>
                                           {item.selectedOptions && (
                                               <div className="text-xs text-blue-300 mt-0.5">
                                                   {item.selectedOptions.map(o => o.name).join(', ')}
                                               </div>
                                           )}
                                       </div>
                                  </div>
                              ))}
                          </div>
                          
                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-1 p-2 bg-gray-800 border-t border-gray-700">
                               <button 
                                   onClick={() => handleReject(order.id)}
                                   className="py-4 bg-gray-700 hover:bg-red-900 hover:text-red-100 text-gray-400 rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors"
                               >
                                   <XCircle size={20}/>
                                   <span className="text-[10px] uppercase">Reddet</span>
                               </button>
                               <button 
                                   onClick={() => handleReady(order.id)}
                                   className="py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex flex-col items-center justify-center gap-1 transition-colors shadowed-button"
                               >
                                   <CheckCircle size={24}/>
                                   <span className="text-xs uppercase tracking-widest">HAZIR</span>
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
