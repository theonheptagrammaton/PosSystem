import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ShoppingCart, LogOut, Send, Trash2, ArrowLeft } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function WaiterPanel() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // State
  const [activeTab, setActiveTab] = useState('TABLES'); // TABLES, ORDER
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBranchInfo();
    fetchCategories();
  }, [branchId]);

  useEffect(() => {
    if (selectedCategory) fetchProducts();
  }, [selectedCategory]);

  const fetchBranchInfo = async () => {
    try {
        const res = await api.get('/api/branches');
        const branch = res.data.find(b => b.id === parseInt(branchId));
        if (branch) {
            const tList = Array.from({ length: branch.table_count || 10 }, (_, i) => i + 1);
            setTables(tList);
        }
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
      try {
          const res = await api.get('/api/categories');
          setCategories(res.data);
      } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
      try {
          const res = await api.get(`/api/products?category_id=${selectedCategory.id}`);
          setProducts(res.data);
      } catch (err) { console.error(err); }
  };

  const handleTableSelect = (tId) => {
      setSelectedTable(tId);
      setActiveTab('ORDER');
      setCart([]);
      setOrderNote('');
  };

  const [optionModal, setOptionModal] = useState(null);

  const addToCart = (product, selectedOptions = []) => {
      const optionPrice = selectedOptions.reduce((acc, opt) => acc + opt.price_change, 0);
      const finalPrice = parseFloat(product.price) + optionPrice;
      const cartId = `${product.id}-${selectedOptions.map(o => o.name).sort().join('-')}`; // Unique ID for variant

      setCart(prev => {
          const existing = prev.find(item => item.cartId === cartId);
          if (existing) {
              return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { 
              ...product, 
              cartId, // Use custom cartId for removal
              quantity: 1, 
              price: finalPrice,
              originalPrice: product.price,
              selectedOptions 
          }];
      });
      showNotification({ title: 'Eklendi', message: `${product.name} sepete eklendi`, type: 'info' });
  };

  const removeFromCart = (cartId) => {
      setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const submitOrder = async () => {
      if (cart.length === 0) return;
      setIsSubmitting(true);
      try {
          // Flatten cart for API
          const items = [];
          let total = 0;
          cart.forEach(item => {
              items.push(item);
              total += parseFloat(item.price) * item.quantity;
          });

          // In real implementation we need TenantID. Assuming we have it in user context or local storage or fetch it.
          // For now fetching from branches api stored in state would be better but let's re-fetch or use props if available.
          // Quick fix: Fetch branch again or assume we have it. Let's assume we can get tenant_id from user session or branch endpoint needs to return it.
          
          // RE-FETCH Branch to get TenantID safely
          const bRes = await api.get('/api/branches');
          const branch = bRes.data.find(b => b.id === parseInt(branchId));

          await api.post('/api/orders', {
              tenant_id: branch.tenant_id,
              branch_id: branch.id,
              table_no: `MASA-${selectedTable}`,
              total_amount: total,
              items: items,
              status: 'WAITING_APPROVAL', // Goes to pending list
              source: 'GARSON',
              note: orderNote
          });

          showNotification({ title: 'BAŞARILI', message: 'Sipariş gönderildi', type: 'info' });
          setCart([]);
          setSelectedTable(null);
          setActiveTab('TABLES');

      } catch (error) {
          console.error(error);
          showNotification({ title: 'HATA', message: 'Sipariş gönderilemedi', type: 'error' });
      } finally {
          setIsSubmitting(false);
      }
  };

  if (activeTab === 'TABLES') {
      return (
          <div className="min-h-screen bg-gray-100 p-4">
              <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-bold">Masa Seçimi</h1>
                  <button onClick={() => navigate('/')} className="p-2 bg-white rounded shadow text-red-600"><LogOut size={20}/></button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  {tables.map(t => (
                      <button 
                          key={t}
                          onClick={() => handleTableSelect(t)}
                          className="h-24 bg-white rounded-lg shadow flex flex-col items-center justify-center border border-gray-200 active:bg-gray-200"
                      >
                          <span className="text-2xl font-bold">{t}</span>
                          <span className="text-xs text-gray-400">MASA</span>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  return (
      <div className="h-screen flex flex-col bg-white overflow-hidden relative">
          {/* Header */}
          <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
              <button onClick={() => setActiveTab('TABLES')}><ArrowLeft/></button>
              <div className="font-bold">MASA {selectedTable}</div>
              <div className="bg-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs">
                  {cart.reduce((a,b) => a + b.quantity, 0)}
              </div>
          </div>

          {/* Categories */}
          <div className="p-2 bg-gray-100 overflow-x-auto whitespace-nowrap gap-2 flex shrink-0 border-b">
              {categories.map(cat => (
                  <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-bold ${selectedCategory?.id === cat.id ? 'bg-black text-white' : 'bg-white border'}`}
                  >
                      {cat.name}
                  </button>
              ))}
          </div>

          {/* Product List - Text Only */}
          <div className="flex-1 overflow-y-auto p-2">
              {products.map(p => (
                  <button 
                      key={p.id}
                      onClick={() => {
                          if (p.options && p.options.length > 0) {
                              setOptionModal({ product: p, selected: [] });
                          } else {
                              addToCart(p);
                          }
                      }}
                      className="w-full bg-white border-b p-4 flex justify-between items-center active:bg-gray-50 text-left"
                  >
                      <div>
                          <div className="font-bold text-lg">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.description}</div>
                          {p.options && p.options.length > 0 && <div className="text-[10px] text-blue-600 font-bold mt-1">SEÇENEKLER MEVCUT</div>}
                      </div>
                      <div className="font-mono font-bold text-lg">₺{p.price}</div>
                  </button>
              ))}
          </div>

          {/* Cart / Actions */}
          <div className="bg-gray-50 border-t p-4 shrink-0">
             {cart.length > 0 && (
                 <>
                    <div className="mb-4 max-h-32 overflow-y-auto bg-white border rounded p-2">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b last:border-0 border-dashed">
                                <div className="flex-1">
                                    <div className="text-sm font-bold">{item.name} <span className="text-xs font-mono ml-1">x{item.quantity}</span></div>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                        <div className="text-[10px] text-gray-500">
                                            {item.selectedOptions.map(o => o.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">₺{(item.price * item.quantity).toFixed(2)}</span>
                                    <button onClick={() => removeFromCart(item.cartId)} className="text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <textarea 
                        className="w-full p-2 border rounded mb-4 text-sm"
                        placeholder="Sipariş Notu (Opsiyonel)"
                        value={orderNote}
                        onChange={e => setOrderNote(e.target.value)}
                    />

                    <button 
                        onClick={submitOrder} 
                        disabled={isSubmitting}
                        className="w-full py-4 bg-green-600 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2"
                    >
                        <Send size={20} />
                        SİPARİŞİ GÖNDER (₺{cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)})
                    </button>
                 </>
             )}
          </div>

          {/* Option Modal */}
          {optionModal && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-fadeIn">
                  <div className="bg-white w-full rounded-t-2xl p-6 flex flex-col gap-4 max-h-[80vh]">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-black text-xl uppercase">{optionModal.product.name}</h3>
                              <p className="text-gray-500 text-sm">Seçenekleri belirleyin</p>
                          </div>
                          <button onClick={() => setOptionModal(null)} className="p-2 bg-gray-100 rounded font-bold">IPTAL</button>
                      </div>

                      <div className="flex-1 overflow-y-auto border-t border-b py-2 flex flex-col gap-2">
                          {optionModal.product.options.map((opt, idx) => {
                              const isSelected = optionModal.selected.some(o => o.name === opt.name);
                              return (
                                  <button 
                                      key={idx}
                                      onClick={() => {
                                          if (isSelected) {
                                              setOptionModal({...optionModal, selected: optionModal.selected.filter(o => o.name !== opt.name)});
                                          } else {
                                              setOptionModal({...optionModal, selected: [...optionModal.selected, opt]});
                                          }
                                      }}
                                      className={`p-4 rounded border text-left flex justify-between items-center transition-all
                                          ${isSelected ? 'bg-black text-white border-black ring-2 ring-black ring-offset-2' : 'bg-white border-gray-200 text-gray-700'}`}
                                  >
                                      <span className="font-bold">{opt.name}</span>
                                      <span className="font-mono">{opt.price_change > 0 ? `+₺${opt.price_change}` : ''}</span>
                                  </button>
                              );
                          })}
                      </div>

                      <button 
                          onClick={() => {
                              addToCart(optionModal.product, optionModal.selected);
                              setOptionModal(null);
                          }}
                          className="w-full py-4 bg-green-600 text-white font-bold uppercase rounded-lg text-lg"
                      >
                          EKLE (+₺{optionModal.selected.reduce((a, b) => a + b.price_change, 0)})
                      </button>
                  </div>
              </div>
          )}
      </div>
  );
}
