import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShoppingCart, ArrowLeft, Trash2, Utensils, CheckCircle, RefreshCcw, Bell, XCircle } from 'lucide-react';
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
  const [tables, setTables] = useState([]); // List of table IDs
  const [busyTables, setBusyTables] = useState([]); // List of table IDs with active orders
  const [selectedTable, setSelectedTable] = useState(null); // Currently selected table ID
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  
  // Cart is now "Table Orders"
  const [tableOrders, setTableOrders] = useState([]); 
  const [tableTotal, setTableTotal] = useState(0);

  // Pending Orders
  const [pendingOrders, setPendingOrders] = useState([]);
  const [viewingPendingOrder, setViewingPendingOrder] = useState(null); // Pending order being reviewed in Modal

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
      
      // Setup Socket for THIS branch/tenant
      if (!socketRef.current) {
         socketRef.current = io(api.defaults.baseURL, {
            query: { tenantId: branch.tenant_id }
         });
         
          socketRef.current.on('new_order', (data) => {
             // If this is a pending order, play sound and refresh pending list
             if (data.status === 'WAITING_APPROVAL') {
                 const audio = new Audio(notificationSound);
                 audio.play().catch(e => console.error('Audio play error', e));
                 fetchPendingOrders();
             } else {
                 // Normal active order (or approval event)
                 const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;
                 if (data.table_no === formattedTableNo) {
                     fetchTableOrders(selectedTable);
                 }
                 fetchBranchStatus(branch.tenant_id, branch.id);
                 // If it was an approval, we also refresh pending to remove it
                 if (data.is_approval) fetchPendingOrders();
             }
         });
         
         socketRef.current.on('table_closed', () => {
             fetchBranchStatus(branch.tenant_id, branch.id); // Refresh status when a table is paid
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
      // Generate Tables based on count
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
          if (!tId || !bId) return; // Need IDs

          const res = await api.get(`/api/orders/status/${tId}/${bId}`); 
          // response is array of strings e.g. ["MASA-1", "MASA-5"]
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
          // table_no format: MASA-1 or just "TRENDYOL"
          // If tableId is number (standard table), prefix MASA-. If string (Quick Order), use as is.
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

    const handleProductClick = async (product, selectedOptions = []) => {
      if (!selectedTable) {
        showNotification({ title: 'UYARI', message: 'Lütfen önce bir masa veya sipariş türü seçin!', type: 'info' });
        return;
      }

      // If product has options and none selected yet, open modal
      if (!selectedOptions.length && product.options && product.options.length > 0) {
          setOptionModal({ product, selected: [] });
          return;
      }
      
      const optionPrice = selectedOptions.reduce((acc, opt) => acc + opt.price_change, 0);
      const finalPrice = parseFloat(product.price) + optionPrice;
      const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;

      // Immediate Persistence: Add item as a new order row
      try {
          const payload = {
            tenant_id: branch.tenant_id,
            branch_id: branch.id, // SEND BRANCH ID
            table_no: formattedTableNo,
            total_amount: finalPrice, // Price of this single addition
            items: [{
                id: product.id,
                name: product.name,
                price: finalPrice,
                quantity: 1,
                selectedOptions
            }],
            status: 'PENDING', // Explicitly set as Active/Approved for POS
            source: typeof selectedTable === 'number' ? 'POS' : selectedTable // Set Source to Platform Name if Quick Order
          };
          
          await api.post('/api/orders', payload);
          // Refresh to show in list
          fetchTableOrders(selectedTable);
          setOptionModal(null); // Close modal if open
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Ürün eklenirken hata oluştu.', type: 'error' });
      }
  };

  const handleItemRemove = async (productId) => {
      if (!selectedTable) return;
      try {
          const formattedTableNo = typeof selectedTable === 'number' ? `MASA-${selectedTable}` : selectedTable;
          await api.delete(`/api/orders/table/${branch.tenant_id}/${branch.id}/${formattedTableNo}/item/${productId}`);
          // Refresh happens via socket, but valid to optimistic update or fetch
          fetchTableOrders(selectedTable);
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Ürün silinirken hata oluştu.', type: 'error' });
      }
  };

  // Helper to group identical items
  const groupTableOrders = (items) => {
      const grouped = {};
      items.forEach(item => {
          // Create unique key based on ID and Options
          const optionsKey = item.selectedOptions 
              ? item.selectedOptions.map(o => o.name).sort().join('-') 
              : '';
          const key = `${item.id}-${optionsKey}`;

          if (grouped[key]) {
              grouped[key].quantity += item.quantity;
          } else {
              grouped[key] = { ...item, key }; // Store key for reference if needed
          }
      });
      return Object.values(grouped);
  };

  const [optionModal, setOptionModal] = useState(null);

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

  if (!branch) return <div className="p-10 font-bold">Yükleniyor...</div>;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-black text-white flex items-center justify-between px-4 shrink-0 shadow-md z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => window.close()} className="hover:text-gray-300"><ArrowLeft /></button>
                <h1 className="font-bold tracking-widest text-lg">{branch.name} POS</h1>
            </div>
            <div className="font-mono text-sm">{new Date().toLocaleTimeString()}</div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* COLUMN 1: TABLES (Left Sidebar) */}
            <div className="w-80 bg-white border-r border-gray-300 flex flex-col shadow-lg z-10">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                    <Utensils size={16}/> Masalar
                </div>

                {/* Quick Orders Section */}
                <div className="p-3 grid grid-cols-3 gap-3 border-b border-gray-200 bg-white">
                    {[
                        { id: 'GEL-AL', label: 'GEL AL', color: 'bg-green-100 text-green-800 border-green-200' },
                        { id: 'TELEFON', label: 'TELEFON', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                        { id: 'TRENDYOL', label: 'TRENDYOL', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                        { id: 'YEMEKSEPETI', label: 'YEMEKSEPETİ', color: 'bg-red-100 text-red-800 border-red-200' },
                        { id: 'GETIR', label: 'GETİR', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                        { id: 'MIGROS', label: 'MIGROS', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleTableSelect(type.id)}
                            className={`p-3 rounded-xl border font-bold text-[10px] uppercase transition-all shadow-sm flex items-center justify-center text-center leading-tight
                                ${selectedTable === type.id 
                                    ? 'bg-black text-white border-black scale-95 ring-2 ring-black ring-offset-1 z-10' 
                                    : `${type.color} hover:brightness-95`}`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                {/* Pending Orders Section */}
                {pendingOrders.length > 0 && (
                    <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                        <div className="flex items-center gap-2 text-yellow-800 font-bold text-xs uppercase mb-2 animate-pulse">
                            <Bell size={14} /> Bekleyen Siparişler ({pendingOrders.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {pendingOrders.map(order => (
                                <button 
                                    key={order.id}
                                    onClick={() => setViewingPendingOrder(order)}
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border border-yellow-300 rounded p-2 text-center"
                                >
                                    <div className="font-bold text-sm">{order.table_no}</div>
                                    <div className="text-[10px]">₺{order.total_amount}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start">
                    {tables.map(tId => {
                        const isBusy = busyTables.includes(tId);
                        const isSelected = selectedTable === tId;
                        
                        return (
                        <button 
                            key={tId}
                            onClick={() => handleTableSelect(tId)}
                            className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all shadow-sm
                                ${isSelected 
                                    ? 'bg-black text-white border-black scale-105 z-10' 
                                    : isBusy
                                        ? 'bg-red-600 text-black border-red-600' // Occupied Style: Red BG with Black Text
                                        : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
                        >
                            {/* Table Number - Always Visible */}
                            <span className="font-bold text-xl">{tId}</span>
                            
                            {/* Status Text */}
                            <span className="text-[10px] uppercase tracking-widest mt-1">
                                {isBusy ? 'DOLU' : ''}
                            </span>
                        </button>
                    )})}
                </div>
            </div>

            {/* COLUMN 2: PRODUCTS (Middle) */}
            <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
                {/* Categories */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {categories.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-bold uppercase transition-colors
                                ${selectedCategory?.id === cat.id ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => handleProductClick(p)}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-black text-left flex flex-col overflow-hidden h-56 group"
                            >
                                <div className="h-24 bg-gray-50 flex-shrink-0 relative overflow-hidden">
                                     {p.image_url ? (
                                         <img 
                                            src={p.image_url.startsWith('http') ? p.image_url : `${api.defaults.baseURL}${p.image_url}`} 
                                            alt={p.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                         />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-gray-300">
                                             <Utensils size={32} />
                                         </div>
                                     )}
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="font-bold text-gray-800 leading-tight group-hover:underline text-sm line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{p.description}</div>
                                    </div>
                                    <div className="font-mono text-sm font-bold text-black mt-1">₺{p.price}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* COLUMN 3: ORDER / CART (Right) */}
            <div className="w-96 bg-white border-l border-gray-300 flex flex-col shadow-xl z-10">
                {/* Header */}
                <div className="h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6">
                    <div>
                        <div className="text-xs text-gray-500 font-bold uppercase">SEÇİLİ MASA / SİPARİŞ</div>
                        <div className="text-2xl font-black">{typeof selectedTable === 'number' ? `MASA ${selectedTable}` : selectedTable}</div>
                    </div>
                    {selectedTable && (
                        <button onClick={() => fetchTableOrders(selectedTable)} className="p-2 hover:bg-gray-200 rounded-full">
                            <RefreshCcw size={16} />
                        </button>
                    )}
                </div>

                {/* Order List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {!selectedTable ? (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-50">
                            <Utensils size={48} className="mb-4"/>
                            <p>Sipariş eklemek için<br/>soldan bir masa seçin.</p>
                         </div>
                    ) : tableOrders.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 italic">Henüz sipariş yok.</div>
                    ) : (
                        groupTableOrders(tableOrders).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                                <div className="flex-1">
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">₺{item.price}</div>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                        <div className="text-[10px] text-blue-600 font-bold mt-1">
                                            {item.selectedOptions.map(o => o.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleItemRemove(item.id)}
                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => handleProductClick(item)} 
                                        className="w-8 h-8 rounded-full bg-black text-white hover:bg-gray-800 flex items-center justify-center transition-colors font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="font-mono font-bold w-16 text-right">
                                    ₺{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-bold text-sm">TOPLAM</span>
                        <span className="text-3xl font-black">₺{tableTotal.toFixed(2)}</span>
                    </div>

                    <button 
                        onClick={handlePayment}
                        disabled={!selectedTable || tableOrders.length === 0}
                        className="w-full bg-black text-white h-16 rounded-xl font-bold text-lg uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                        <CheckCircle />
                        Hesabı Kapat
                    </button>
                </div>
            </div>
        </div>
        
        {/* Pending Order Modal */}
        {viewingPendingOrder && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-yellow-400 p-4 flex justify-between items-center">
                        <h3 className="font-black text-black uppercase">SİPARİŞ ONAYI</h3>
                        <button onClick={() => setViewingPendingOrder(null)} className="p-1 hover:bg-white/20 rounded"><ArrowLeft/></button>
                    </div>
                    <div className="p-6">
                        {/* Header Info */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-[10px] text-gray-500 font-bold uppercase">MASA</div>
                                <div className="text-xl font-black">{viewingPendingOrder.table_no}</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-[10px] text-gray-500 font-bold uppercase">KAYNAK</div>
                                <div className="text-xl font-black text-blue-600">{viewingPendingOrder.source || 'POS'}</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded col-span-2">
                                <div className="text-[10px] text-gray-500 font-bold uppercase">SİPARİŞ SAATİ</div>
                                <div className="text-lg font-bold">
                                    {new Date(viewingPendingOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    <span className="text-xs font-normal text-gray-400 ml-2">
                                        ({Math.floor((new Date() - new Date(viewingPendingOrder.created_at)) / 60000)} dk önce)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order Note */}
                        {viewingPendingOrder.note && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
                                <div className="text-[10px] font-bold uppercase mb-1">SİPARİŞ NOTU</div>
                                <div className="font-bold italic">"{viewingPendingOrder.note}"</div>
                            </div>
                        )}
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 max-h-60 overflow-y-auto">
                            {viewingPendingOrder.items.map((item, i) => (
                                <div key={i} className="flex justify-between border-b border-gray-200 pb-2 last:border-0 mb-2 last:mb-0">
                                    <div className="flex-1 pr-4 min-w-0">
                                        <div className="font-bold truncate" title={item.name}>{item.name}</div>
                                        <div className="text-xs text-gray-400">₺{item.price}</div>
                                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                                            <div className="text-[10px] text-blue-600 font-bold mt-1">
                                                {item.selectedOptions.map(o => o.name).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="font-mono font-bold whitespace-nowrap">x{item.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mb-6 font-bold text-lg">
                            <span>TOPLAM TUTAR</span>
                            <span>₺{viewingPendingOrder.total_amount}</span>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleRejectOrder(viewingPendingOrder)}
                                className="flex-1 bg-red-600 text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-lg border-2 border-black"
                            >
                                ✗ REDDET
                            </button>
                            <button 
                                onClick={() => handleApproveOrder(viewingPendingOrder)}
                                className="flex-1 bg-green-600 text-white py-4 rounded-lg font-black uppercase tracking-widest hover:bg-green-700 active:scale-95 transition-all shadow-lg border-2 border-black"
                            >
                                ✓ ONAYLA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* Option Selection Modal */}
        {optionModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-lg">{optionModal.product.name}</h3>
                        <button onClick={() => setOptionModal(null)} className="p-2 hover:bg-gray-800 rounded-full"><XCircle size={24}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1">
                        <p className="text-sm text-gray-500 mb-4 font-bold uppercase tracking-wide">Lütfen Seçenekleri Belirleyin</p>
                        <div className="space-y-3">
                            {optionModal.product.options.map((opt, idx) => {
                                const isSelected = optionModal.selected.some(s => s.name === opt.name);
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
                                        className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all
                                            ${isSelected 
                                                ? 'border-black bg-gray-50' 
                                                : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center
                                                ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`}>
                                                {isSelected && <CheckCircle size={14} className="text-white"/>}
                                            </div>
                                            <span className={`font-bold ${isSelected ? 'text-black' : 'text-gray-600'}`}>{opt.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-gray-500">
                                            {opt.price_change > 0 ? `+₺${opt.price_change}` : ''}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                        <button 
                            onClick={() => handleProductClick(optionModal.product, optionModal.selected)}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg"
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
