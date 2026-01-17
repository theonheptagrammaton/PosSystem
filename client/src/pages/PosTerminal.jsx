import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShoppingCart, ArrowLeft, Trash2, Utensils, CheckCircle, RefreshCcw, Bell, XCircle, ChevronRight, AlertCircle } from 'lucide-react';
import notificationSound from '../assets/zil.mp3';
import io from 'socket.io-client';
import { useNotification } from '../context/NotificationContext';

export default function PosTerminal() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const { showNotification } = useNotification();

  // --- State ---
  const [branch, setBranch] = useState(null);
  const [tables, setTables] = useState([]); 
  const [busyTables, setBusyTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  
  const [tableOrders, setTableOrders] = useState([]); 
  const [tableTotal, setTableTotal] = useState(0);

  const [pendingOrders, setPendingOrders] = useState([]);
  const [viewingPendingOrder, setViewingPendingOrder] = useState(null);
  const [optionModal, setOptionModal] = useState(null);

  // --- Initialization ---
  useEffect(() => {
    fetchBranchAndTables();
    fetchCategories();
  }, [branchId]);

  useEffect(() => {
    if (selectedCategory) fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedTable && branch) {
      fetchTableOrders(selectedTable);
      
      if (!socketRef.current) {
         socketRef.current = io(api.defaults.baseURL, {
            query: { tenantId: branch.tenant_id }
         });
         
          socketRef.current.on('new_order', (data) => {
             if (data.status === 'WAITING_APPROVAL' || (data.status === 'PENDING' && data.source === 'GARSON')) {
                 const audio = new Audio(notificationSound);
                 audio.play().catch(e => console.error('Audio play error', e));
                 if (data.status === 'WAITING_APPROVAL') fetchPendingOrders();
             }
             
             const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;
             if (data.table_no === formattedTableNo) {
                 fetchTableOrders(selectedTable);
             }
             
             fetchBranchStatus(branch.tenant_id, branch.id);
             
             if (data.is_approval) fetchPendingOrders();
         });
         
         socketRef.current.on('table_closed', () => {
             fetchBranchStatus(branch.tenant_id, branch.id);
         });
      }
    }
  }, [selectedTable, branch]);

  // --- API Calls ---
  const fetchBranchAndTables = async () => {
    try {
      const res = await api.get('/api/branches');
      const b = res.data.find(item => item.id === parseInt(branchId));
      if (!b) {
        showNotification({ title: 'HATA', message: 'Şube bulunamadı veya yetki yok.', type: 'error' });
        return;
      }
      
      setBranch(b);
      const tableList = Array.from({ length: b.table_count || 10 }, (_, i) => i + 1);
      setTables(tableList);
      fetchBranchStatus(b.tenant_id, b.id); 
      fetchPendingOrders(b.tenant_id, b.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBranchStatus = async (tenantIdOverride = null, branchIdOverride = null) => {
      try {
          const tId = tenantIdOverride || branch?.tenant_id;
          const bId = branchIdOverride || branch?.id;
          if (!tId || !bId) return;

          const res = await api.get(`/api/orders/status/${tId}/${bId}`); 
          const busyIds = res.data.map(str => parseInt(str.replace('MASA-', '')));
          setBusyTables(busyIds);
      } catch (err) { console.error('Status fetch error', err); }
  };

  const fetchCategories = async () => {
    try {
        const res = await api.get('/api/categories');
        setCategories(res.data);
        if (res.data.length > 0) setSelectedCategory(res.data[0]);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
        const res = await api.get(`/api/products?category_id=${selectedCategory.id}`);
        setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTableOrders = async (tableId) => {
      if (!branch) return;
      try {
          const formattedTableNo = typeof tableId === 'number' ? `MASA-${tableId}` : tableId;
          const res = await api.get(`/api/orders/table/${branch.tenant_id}/${branch.id}/${formattedTableNo}`);
          setTableOrders(res.data.items || []);
          setTableTotal(res.data.total_amount || 0);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchPendingOrders = async (tIdOverride = null, bIdOverride = null) => {
      const tId = tIdOverride || branch?.tenant_id;
      const bId = bIdOverride || branch?.id;
      if (!tId || !bId) return;
      try {
          const res = await api.get(`/api/orders/pending/${tId}/${bId}`);
          setPendingOrders(res.data);
      } catch (err) { console.error('Error fetching pending orders', err); }
  };

  const handleApproveOrder = async (order) => {
      try {
          await api.post(`/api/orders/approve/${order.id}`);
          setViewingPendingOrder(null);
          showNotification({ title: 'BAŞARILI', message: 'Sipariş onaylandı ve masaya eklendi.', type: 'info' });
          fetchPendingOrders();
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Onaylama başarısız', type: 'error' });
      }
  };

  const handleRejectOrder = async (order) => {
      try {
          await api.post(`/api/orders/reject/${order.id}`);
          setViewingPendingOrder(null);
          showNotification({ title: 'REDDEDİLDİ', message: 'Sipariş reddedildi.', type: 'info' });
          fetchPendingOrders();
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Reddetme başarısız', type: 'error' });
      }
  };

  // --- Actions ---
  const handleTableSelect = (id) => {
      setSelectedTable(id);
  };

    const handleProductClick = async (product, selectedOptions = [], forceAdd = false) => {
      if (!selectedTable) {
        showNotification({ title: 'UYARI', message: 'Lütfen önce bir masa veya sipariş türü seçin!', type: 'info' });
        return;
      }

      // Only force modal open if NOT coming from the modal confirmation (forceAdd is false)
      if (!forceAdd && !selectedOptions.length && product.options && product.options.length > 0) {
          setOptionModal({ product, selected: [] });
          return;
      }
      
      const optionPrice = selectedOptions.reduce((acc, opt) => acc + opt.price_change, 0);
      const finalPrice = parseFloat(product.price) + optionPrice;
      const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;

      try {
          const payload = {
            tenant_id: branch.tenant_id,
            branch_id: branch.id,
            table_no: formattedTableNo,
            total_amount: finalPrice,
            items: [{
                id: product.id,
                name: product.name,
                price: finalPrice,
                quantity: 1,
                selectedOptions
            }],
            status: 'PENDING',
            source: typeof selectedTable === 'number' ? 'POS' : selectedTable 
          };
          
          await api.post('/api/orders', payload);
          fetchTableOrders(selectedTable);
          setOptionModal(null);
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Ürün eklenirken hata oluştu.', type: 'error' });
      }
  };

  const handleItemRemove = async (productId) => {
      if (!selectedTable) return;
      try {
          const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;
          await api.delete(`/api/orders/table/${branch.tenant_id}/${branch.id}/${formattedTableNo}/item/${productId}`);
          fetchTableOrders(selectedTable);
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Ürün silinirken hata oluştu.', type: 'error' });
      }
  };

   const groupTableOrders = (items) => {
       const grouped = {};
       items.forEach(item => {
           const optionsKey = item.selectedOptions 
               ? item.selectedOptions.map(o => o.name).sort().join('-') 
               : '';
           const status = item.parent_status || 'PENDING';
           const key = `${item.id}-${optionsKey}-${status}`;

           if (grouped[key]) {
               grouped[key].quantity += item.quantity;
           } else {
               grouped[key] = { ...item, key, status }; 
           }
       });
       return Object.values(grouped);
   };

  const handlePayment = async () => {
      if (!selectedTable) return;
      if (tableOrders.length === 0) {
        showNotification({ title: 'BİLGİ', message: 'Bu masada açık sipariş yok.', type: 'info' });
        return;
      }
      
      const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;

      const confirmed = await showNotification({
        title: 'ÖDEME ONAYI',
        message: `${formattedTableNo} ödemesi alındı mı? Tutar: ₺${tableTotal.toFixed(2)}`,
        type: 'confirm'
      });
      
      if (!confirmed) return;

      try {
          await api.post(`/api/orders/table/${branch.tenant_id}/${branch.id}/${formattedTableNo}/pay`);
          showNotification({ title: 'BAŞARILI', message: 'Ödeme Alındı, Masa Temizlendi.', type: 'info' });
          fetchTableOrders(selectedTable);
      } catch (err) {
          console.error('Ödeme hatası:', err);
          showNotification({ 
            title: 'HATA', 
            message: 'Ödeme işlemi başarısız: ' + (err.response?.data?.error || err.message),
            type: 'error'
          });
      }
  };

  if (!branch) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="spinner"></div>
      </div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden font-sans">
        {/* Top Bar */}
        <div className="h-14 bg-black text-white flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => window.close()} className="hover:text-gray-300"><ArrowLeft /></button>
                <h1 className="font-black tracking-widest text-lg uppercase">{branch.name} POS</h1>
            </div>
            <div className="font-mono text-sm font-bold opacity-75">{new Date().toLocaleTimeString()}</div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* COLUMN 1: TABLES (Left Sidebar) */}
            <div className="w-64 lg:w-80 bg-white border-r border-black flex flex-col shadow-lg z-10 flex-shrink-0 transition-all duration-300">
                <div className="p-4 bg-black text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                    <Utensils size={14}/> MASALAR
                </div>

                {/* Quick Orders Section */}
                <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-200 bg-white shadow-sm">
                    {[
                        { id: 'GEL-AL', label: 'GEL AL' },
                        { id: 'TELEFON', label: 'TELEFON' },
                        { id: 'TRENDYOL', label: 'TRENDYOL' },
                        { id: 'YEMEKSEPETI', label: 'YEMEKSEPETİ' },
                        { id: 'GETIR', label: 'GETİR' },
                        { id: 'MIGROS', label: 'MIGROS' },
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleTableSelect(type.id)}
                            className={`p-4 border-2 font-black text-xs uppercase transition-all flex items-center justify-center text-center leading-tight tracking-widest
                                ${selectedTable === type.id 
                                    ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                                    : 'bg-white text-black border-gray-200 hover:bg-black hover:text-white hover:border-black'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Pending Orders Section */}
                {pendingOrders.length > 0 && (
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2 text-black font-black text-xs uppercase mb-2 animate-pulse">
                            <Bell size={14} /> Bekleyen Siparişler ({pendingOrders.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {pendingOrders.map(order => (
                                <button 
                                    key={order.id}
                                    onClick={() => setViewingPendingOrder(order)}
                                    className="bg-white hover:bg-black hover:text-white text-black border border-black p-2 text-center transition-colors shadow-sm"
                                >
                                    <div className="font-black text-sm">{order.table_no}</div>
                                    <div className="text-[10px] font-mono">₺{order.total_amount}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 content-start bg-gray-50">
                    {tables.map(tId => {
                        const isBusy = busyTables.includes(tId);
                        const isSelected = selectedTable === tId;
                        
                        return (
                        <button 
                            key={tId}
                            onClick={() => handleTableSelect(tId)}
                            className={`h-20 lg:h-24 border-2 flex flex-col items-center justify-center transition-all relative
                                ${isSelected 
                                    ? 'bg-black text-white border-black z-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] translate-x-[-2px] translate-y-[-2px]' 
                                    : isBusy
                                        ? 'bg-gray-800 text-white border-gray-800' // Dark Gray for Busy 
                                        : 'bg-white text-black border-gray-200 hover:border-black hover:bg-black hover:text-white'}`}
                        >
                            {/* Table Number */}
                            <span className="font-black text-2xl tracking-tighter">{tId}</span>
                            
                            {/* Status Text */}
                            <span className={`text-[9px] uppercase tracking-[0.2em] mt-2 font-bold ${isBusy || isSelected ? 'text-white/70' : 'text-gray-400 group-hover:text-white/70'}`}>
                                {isBusy ? 'DOLU' : 'BOŞ'}
                            </span>
                        </button>
                    )})}
                </div>
            </div>

            {/* COLUMN 2: PRODUCTS (Middle) */}
            <div className="flex-1 flex flex-col bg-white min-w-0">
                {/* Categories */}
                <div className="h-16 bg-white border-b border-black flex items-center px-4 gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {categories.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-colors border border-transparent
                                ${selectedCategory?.id === cat.id ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'bg-gray-100 text-gray-500 hover:text-black hover:border-black'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1 p-3 lg:p-6 overflow-y-auto bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4">
                        {products.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => handleProductClick(p)}
                                className="bg-white border-2 border-transparent hover:border-black transition-all text-left flex flex-col overflow-hidden min-h-[14rem] lg:min-h-[18rem] h-auto group shadow-md hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="h-32 lg:h-40 bg-gray-100 flex-shrink-0 relative overflow-hidden border-b border-gray-100 group-hover:border-black transition-colors">
                                     {p.image_url ? (
                                         <img 
                                            src={p.image_url.startsWith('http') ? p.image_url : `${api.defaults.baseURL}${p.image_url}`} 
                                            alt={p.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                         />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-black transition-colors">
                                             <Utensils size={40} />
                                         </div>
                                     )}
                                     <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                         EKLE +
                                     </div>
                                </div>
                                <div className="p-3 lg:p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="font-black text-black leading-tight uppercase text-xs lg:text-base break-words mb-2">{p.name}</div>
                                        <div className="text-[10px] lg:text-xs text-gray-500 font-mono uppercase break-words leading-relaxed group-hover:text-black transition-colors">{p.description}</div>
                                    </div>
                                    <div className="font-black text-base lg:text-xl text-black mt-2 lg:mt-4 text-right tracking-tight">₺{p.price}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLUMN 3: ORDER / CART (Right) */}
            <div className="w-80 lg:w-96 bg-white border-l border-black flex flex-col shadow-2xl z-10 flex-shrink-0 transition-all duration-300">
                {/* Header */}
                <div className="h-14 lg:h-16 bg-black text-white border-b border-gray-800 flex items-center justify-between px-4 lg:px-6">
                    <div>
                        <div className="text-[9px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest">SİPARİŞ ÖZETİ</div>
                        <div className="text-lg lg:text-xl font-black uppercase tracking-tighter">{typeof selectedTable === 'number' ? `MASA ${selectedTable}` : selectedTable}</div>
                    </div>
                    {selectedTable && (
                        <button onClick={() => fetchTableOrders(selectedTable)} className="p-2 hover:bg-gray-800 transition-colors">
                            <RefreshCcw size={16} />
                        </button>
                    )}
                </div>

                {/* Order List */}
                <div className="flex-1 overflow-y-auto p-0 bg-gray-50">
                    {!selectedTable ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center">
                            <Utensils size={48} className="mb-4 opacity-50"/>
                            <p className="font-bold uppercase text-xs tracking-widest">Masa Seçiniz</p>
                         </div>
                    ) : tableOrders.length === 0 ? (
                        <div className="text-center text-gray-400 py-20 italic font-mono text-xs">SİPARİŞ YOK</div>
                    ) : (
                        groupTableOrders(tableOrders).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start p-4 border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex-1 pr-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-black text-sm uppercase">{item.name}</div>
                                        {item.status === 'READY' && <CheckCircle size={12} className="text-green-600"/>}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">₺{item.price}</div>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                        <div className="text-[10px] text-black font-bold uppercase mt-1 pl-2 border-l-2 border-black">
                                            {item.selectedOptions.map(o => o.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="font-mono font-black text-sm">
                                        ₺{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                    </div>
                                    <div className="flex items-center gap-1 bg-white border-2 border-black">
                                        <button 
                                            onClick={() => handleItemRemove(item.id)}
                                            className="w-6 h-6 lg:w-8 lg:h-8 hover:bg-black hover:text-white flex items-center justify-center transition-colors font-black text-base lg:text-lg active:scale-95"
                                        >
                                            -
                                        </button>
                                        <span className="font-black w-6 lg:w-8 text-center text-xs lg:text-sm">{item.quantity}</span>
                                        <button 
                                            onClick={() => handleProductClick(item)} 
                                            className="w-6 h-6 lg:w-8 lg:h-8 hover:bg-black hover:text-white flex items-center justify-center transition-colors font-black text-base lg:text-lg active:scale-95 border-l-2 border-black"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 bg-white border-t-2 border-black shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">TOPLAM TUTAR</span>
                        <span className="text-3xl font-black tracking-tighter">₺{tableTotal.toFixed(2)}</span>
                    </div>

                    <button 
                        onClick={handlePayment}
                        disabled={!selectedTable || tableOrders.length === 0}
                        className="w-full bg-black text-white h-16 font-black text-lg uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-black active:translate-x-[2px] active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                    >
                        <CheckCircle />
                        Hesabı Kapat
                    </button>
                </div>
            </div>
        </div>
        
        {/* Pending Order Modal */}
        {viewingPendingOrder && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg overflow-hidden border-2 border-white shadow-2xl animate-slideUp">
                    <div className="bg-white p-6 border-b-2 border-black flex justify-between items-center">
                        <h3 className="font-black text-2xl uppercase tracking-tighter">SİPARİŞ ONAYI</h3>
                        <button onClick={() => setViewingPendingOrder(null)} className="hover:rotate-90 transition-transform"><XCircle size={28}/></button>
                    </div>
                    <div className="p-8">
                        {/* Header Info */}
                        <div className="mb-8 grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-gray-50 border border-black">
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">MASA</div>
                                <div className="text-3xl font-black">{viewingPendingOrder.table_no}</div>
                            </div>
                            <div className="text-center p-4 bg-gray-50 border border-black">
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">KAYNAK</div>
                                <div className="text-xl font-black text-black">{viewingPendingOrder.source || 'POS'}</div>
                            </div>
                        </div>

                        {/* Order Note */}
                        {viewingPendingOrder.note && (
                            <div className="mb-8 p-4 bg-black text-white text-center border-2 border-black">
                                <div className="text-[10px] font-bold uppercase mb-2 tracking-widest opacity-70">SİPARİŞ NOTU</div>
                                <div className="font-bold text-lg">"{viewingPendingOrder.note}"</div>
                            </div>
                        )}
                        
                        <div className="border-t-2 border-b-2 border-black py-4 mb-8 max-h-60 overflow-y-auto">
                            {viewingPendingOrder.items.map((item, i) => (
                                <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                    <div className="flex-1 pr-4 min-w-0">
                                        <div className="font-black text-lg uppercase">{item.name}</div>
                                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                                            <div className="text-[10px] font-bold uppercase mt-1 pl-2 border-l-2 border-black">
                                                {item.selectedOptions.map(o => o.name).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-mono font-bold whitespace-nowrap text-lg">x{item.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mb-8 font-black text-2xl border-2 border-black p-4 bg-gray-50">
                            <span className="text-sm text-gray-500 uppercase tracking-widest">TOPLAM</span>
                            <span>₺{viewingPendingOrder.total_amount}</span>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleRejectOrder(viewingPendingOrder)}
                                className="flex-1 bg-white text-black border-2 border-black py-4 font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all text-sm"
                            >
                                REDDET
                            </button>
                            <button 
                                onClick={() => handleApproveOrder(viewingPendingOrder)}
                                className="flex-1 bg-black text-white border-2 border-black py-4 font-black uppercase tracking-widest hover:bg-gray-800 transition-all text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                ONAYLA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Option Selection Modal */}
        {optionModal && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white w-full max-w-lg border-2 border-black shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="bg-black text-white p-6 flex justify-between items-center shrink-0">
                        <div>
                             <h3 className="font-black text-xl uppercase tracking-tighter">{optionModal.product.name}</h3>
                             <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">SEÇENEK BELİRLEYİN</p>
                        </div>
                        <button onClick={() => setOptionModal(null)} className="hover:rotate-90 transition-transform"><XCircle size={24}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                        <div className="space-y-3">
                            {optionModal.product.options.map((opt, idx) => {
                                const isSelected = optionModal.selected.some(s => s.name === opt.name);
                                const basePrice = parseFloat(optionModal.product.price);
                                const extraPrice = parseFloat(opt.price_change);
                                const totalPrice = basePrice + extraPrice;
                                
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (isSelected) {
                                                setOptionModal(prev => ({
                                                    ...prev,
                                                    selected: prev.selected.filter(s => s.name !== opt.name)
                                                }));
                                            } else {
                                                setOptionModal(prev => ({
                                                    ...prev,
                                                    selected: [...prev.selected, opt]
                                                }));
                                            }
                                        }}
                                        className={`w-full flex justify-between items-center p-4 border-2 transition-all
                                            ${isSelected 
                                                ? 'border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                                                : 'border-gray-200 bg-white hover:border-black text-gray-500'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`}>
                                                {isSelected && <CheckCircle size={12} className="text-white"/>}
                                            </div>
                                            <span className={`font-bold uppercase text-sm ${isSelected ? 'text-black' : 'text-gray-500'}`}>{opt.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono font-bold text-xs block">
                                                {opt.price_change > 0 ? `+₺${extraPrice.toFixed(2)}` : 'ÜCRETSİZ'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 border-t-2 border-black bg-white shrink-0">
                        <button 
                            onClick={() => handleProductClick(optionModal.product, optionModal.selected, true)}
                            className="w-full bg-black text-white py-4 font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none border-2 border-black"
                        >
                            EKLE (₺{(parseFloat(optionModal.product.price) + optionModal.selected.reduce((a,b)=>a+b.price_change,0)).toFixed(2)})
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
