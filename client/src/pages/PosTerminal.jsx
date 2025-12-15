import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShoppingCart, ArrowLeft, Trash2, Utensils, CheckCircle, RefreshCcw } from 'lucide-react';
import io from 'socket.io-client';

export default function PosTerminal() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // --- State ---
  const [branch, setBranch] = useState(null);
  const [tables, setTables] = useState([]); // List of table IDs
  const [selectedTable, setSelectedTable] = useState(null); // Currently selected table ID
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  
  // Cart is now "Table Orders"
  const [tableOrders, setTableOrders] = useState([]); 
  const [tableTotal, setTableTotal] = useState(0);

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
             // If update is for THIS table, refresh
             if (data.table_no === `MASA-${selectedTable}`) {
                 fetchTableOrders(selectedTable);
             }
         });
      }
    }
  }, [selectedTable, branch]);

  // --- API Calls ---
  const fetchBranchAndTables = async () => {
    try {
      const res = await api.get('/api/branches');
      const b = res.data.find(item => item.id === parseInt(branchId));
      if (!b) return alert('Şube bulunamadı veya yetki yok.');
      
      setBranch(b);
      // Generate Tables based on count
      const tableList = Array.from({ length: b.table_count || 10 }, (_, i) => i + 1);
      setTables(tableList);
    } catch (err) {
      console.error(err);
    }
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
          // table_no format: MASA-1
          const res = await api.get(`/api/orders/table/${branch.tenant_id}/MASA-${tableId}`);
          setTableOrders(res.data.items || []);
          setTableTotal(res.data.total_amount || 0);
      } catch (err) {
          console.error(err);
      }
  };

  // --- Actions ---
  const handleTableSelect = (id) => {
      setSelectedTable(id);
  };

  const handleProductClick = async (product) => {
      if (!selectedTable) return alert('Lütfen önce bir masa seçin!');
      
      // Immediate Persistence: Add item as a new order row
      try {
          const payload = {
            tenant_id: branch.tenant_id,
            table_no: `MASA-${selectedTable}`,
            total_amount: product.price, // Price of this single addition
            items: [{
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            }]
          };
          
          await api.post('/api/orders', payload);
          // Refresh to show in list
          fetchTableOrders(selectedTable);
      } catch (err) {
          alert('Ürün eklenirken hata oluştu.');
      }
  };

  const handlePayment = async () => {
      if (!selectedTable) return;
      if (tableOrders.length === 0) return alert('Bu masada açık sipariş yok.');
      if (!confirm(`MASA-${selectedTable} ödemesi alındı mı? Tutar: ₺${tableTotal}`)) return;

      try {
          await api.post(`/api/orders/table/${branch.tenant_id}/MASA-${selectedTable}/pay`);
          alert('Ödeme Alındı, Masa Temizlendi.');
          fetchTableOrders(selectedTable);
      } catch (err) {
          alert('Ödeme işlemi başarısız.');
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
            <div className="w-64 bg-white border-r border-gray-300 flex flex-col shadow-lg z-10">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold uppercase text-sm tracking-wider flex items-center gap-2">
                    <Utensils size={16}/> Masalar
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                    {tables.map(tId => (
                        <button 
                            key={tId}
                            onClick={() => handleTableSelect(tId)}
                            className={`h-20 rounded-lg border-2 flex flex-col items-center justify-center transition-all shadow-sm
                                ${selectedTable === tId 
                                    ? 'bg-black text-white border-black scale-105' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
                        >
                            <span className="font-bold text-xl">{tId}</span>
                            <span className="text-[10px] uppercase tracking-widest">MASA</span>
                        </button>
                    ))}
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
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map(p => (
                            <button 
                                key={p.id}
                                onClick={() => handleProductClick(p)}
                                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-black text-left flex flex-col justify-between h-32 group"
                            >
                                <div className="font-bold text-gray-800 leading-tight group-hover:underline">{p.name}</div>
                                <div className="font-mono text-lg font-bold text-black mt-2">₺{p.price}</div>
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
                        <div className="text-xs text-gray-500 font-bold uppercase">SEÇİLİ MASA</div>
                        <div className="text-2xl font-black">MASA {selectedTable || '-'}</div>
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
                        tableOrders.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0">
                                <div>
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500">x{item.quantity}</div>
                                </div>
                                <div className="font-mono font-bold">₺{item.price}</div>
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
    </div>
  );
}
