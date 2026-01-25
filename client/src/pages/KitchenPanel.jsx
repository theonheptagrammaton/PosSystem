import { useState, useEffect, useRef } from 'react';
import api from '../api';
import io from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';
import { ChefHat, Clock, CheckCircle, XCircle, Bell, RefreshCcw, LogOut } from 'lucide-react';
import notificationSound from '../assets/zil.mp3';
import NotificationCenter from '../components/NotificationCenter';

export default function KitchenPanel() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const { showNotification } = useNotification();
    
    const user = JSON.parse(localStorage.getItem('user'));
    const tenantId = user?.tenant_id;
    const branchId = user?.branch_id; 

    useEffect(() => {
        if (tenantId && branchId) {
            setupSocket();
            fetchActiveOrders();
        }
        
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [tenantId, branchId]);

    const fetchActiveOrders = async () => {
        setLoading(true);
        try {
             // Using query param if backend supports it, otherwise default endpoint
             const res = await api.get(`/api/orders/pending/${tenantId}/${branchId}?status=PENDING`);
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
            showNotification({ title: 'HAZIRLANDI', message: 'Sipariş hazır olarak işaretlendi.', type: 'info' });
            fetchActiveOrders();
        } catch (err) {
            console.error(err);
            showNotification({ title: 'HATA', message: 'İşlem başarısız.', type: 'error' });
        }
    };

    const handleReject = async (orderId) => {
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-xs uppercase tracking-widest font-bold text-gray-500 animate-pulse">SİPARİŞLER YÜKLENİYOR...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans text-black">
            <div className="bg-white shadow-sm p-6 mb-6 flex justify-between items-center border border-black">
                <div className="flex items-center gap-4">
                    <div className="bg-black text-white p-3 shadow-lg">
                        <ChefHat size={32} />
                    </div>
                    <div>
                        <h1 className="text-black text-2xl font-black tracking-widest uppercase">MUTFAK PANELİ</h1>
                        <p className="text-gray-500 text-xs font-mono font-bold uppercase">{new Date().toLocaleDateString()} — {user?.full_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                         <div className="text-gray-400 text-[10px] font-black uppercase tracking-tighter">BEKLEYEN SİPARİŞ</div>
                         <div className="text-black text-4xl font-black">{orders.length}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <button onClick={fetchActiveOrders} className="bg-white text-black border border-black p-3 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none group">
                            <RefreshCcw size={20} className="group-active:rotate-180 transition-transform" />
                        </button>
                    </div>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }} className="bg-red-50 text-red-600 border border-red-200 p-3 hover:bg-red-600 hover:text-white transition-all">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
            
            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                 {orders.map(order => (
                     <div key={order.id} className="bg-white border-2 border-black flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all group h-full">
                          {/* Card Header */}
                          <div className="bg-gray-50 p-4 border-b-2 border-dashed border-black flex justify-between items-center">
                                <div>
                                     <div className="text-black font-black text-2xl uppercase tracking-tight">{order.table_no.replace('MASA-', 'MASA ')}</div>
                                     <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                         <Clock size={12} /> 
                                         {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                         <span className="text-orange-600">
                                            ({Math.floor((new Date() - new Date(order.created_at)) / 60000)} dk önce)
                                         </span>
                                     </div>
                                </div>
                                <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                    #{order.id}
                                </div>
                          </div>
                          
                          {/* Note */}
                          {order.note && (
                              <div className="bg-red-50 p-3 text-red-700 text-center text-xs font-black border-b border-red-100 uppercase tracking-tight">
                                  NOT: {order.note}
                              </div>
                          )}
                          
                          {/* Items List */}
                          <div className="flex-1 p-4 space-y-3 bg-white">
                              {order.items && order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0 last:mb-0">
                                       <div>
                                           <div className={`font-black text-lg leading-tight ${item.quantity > 1 ? 'text-orange-600' : 'text-black'}`}>
                                               {item.quantity}x {item.name}
                                           </div>
                                           {item.selectedOptions && item.selectedOptions.length > 0 && (
                                               <div className="text-blue-600 text-[10px] mt-1 font-black uppercase tracking-tight pl-2 border-l-2 border-blue-600">
                                                   {item.selectedOptions.map(o => o.name).join(', ')}
                                               </div>
                                           )}
                                       </div>
                                  </div>
                              ))}
                          </div>
                          
                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-0 border-t-2 border-black h-16">
                               <button 
                                   onClick={() => handleReject(order.id)}
                                   className="h-full bg-white text-red-600 border-r-2 border-black hover:bg-red-600 hover:text-white font-black flex flex-col items-center justify-center gap-1 transition-all text-xs border-0"
                               >
                                   <XCircle size={20}/>
                                   <span className="uppercase tracking-widest">İPTAL</span>
                               </button>
                               <button 
                                   onClick={() => handleReady(order.id)}
                                   className="h-full bg-black text-white hover:bg-gray-800 font-black flex flex-col items-center justify-center gap-1 transition-all text-xs border-0"
                               >
                                   <CheckCircle size={24}/>
                                   <span className="uppercase tracking-widest">HAZIR</span>
                               </button>
                          </div>
                     </div>
                 ))}
                 
                 {orders.length === 0 && !loading && (
                     <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-black bg-white">
                         <Bell size={48} className="mb-4 opacity-20" />
                         <p className="font-mono text-sm uppercase">Bekleyen sipariş yok</p>
                     </div>
                 )}
            </div>
        </div>
    );
}
