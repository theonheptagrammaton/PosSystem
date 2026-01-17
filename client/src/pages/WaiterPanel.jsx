import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Send, Trash2, ArrowLeft, ArrowRight, Table } from 'lucide-react';
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
      const cartId = `${product.id}-${selectedOptions.map(o => o.name).sort().join('-')}`; 

      setCart(prev => {
          const existing = prev.find(item => item.cartId === cartId);
          if (existing) {
              return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { 
              ...product, 
              cartId, 
              quantity: 1, 
              price: finalPrice,
              originalPrice: product.price,
              selectedOptions 
          }];
      });
      showNotification({ title: 'EKLENDİ', message: `${product.name} sepete eklendi`, type: 'info' });
  };

  const removeFromCart = (cartId) => {
      setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const submitOrder = async () => {
      if (cart.length === 0) return;
      setIsSubmitting(true);
      try {
          const items = [];
          let total = 0;
          cart.forEach(item => {
              items.push(item);
              total += parseFloat(item.price) * item.quantity;
          });

          const bRes = await api.get('/api/branches');
          const branch = bRes.data.find(b => b.id === parseInt(branchId));

          await api.post('/api/orders', {
              tenant_id: branch.tenant_id,
              branch_id: branch.id,
              table_no: `MASA-${selectedTable}`,
              total_amount: total,
              items: items,
              status: 'PENDING', 
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
          <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
                  <div>
                      <h1 className="text-3xl font-black uppercase tracking-tighter">Masa Seçimi</h1>
                      <p className="text-xs font-bold text-gray-400 font-mono">LÜTFEN İŞLEM YAPILACAK MASAYI SEÇİNİZ</p>
                  </div>
                  <button onClick={() => navigate('/')} className="p-3 bg-black text-white hover:bg-white hover:text-black border border-black transition-all">
                      <LogOut size={20}/>
                  </button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {tables.map(t => (
                      <button 
                          key={t}
                          onClick={() => handleTableSelect(t)}
                          className="h-40 bg-white border-2 border-black flex flex-col items-center justify-center hover:bg-black hover:text-white transition-all group shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none"
                      >
                          <div className="mb-4 group-hover:scale-110 transition-transform duration-300"><Table size={32}/></div>
                          <span className="text-4xl font-black">{t}</span>
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase mt-2 opacity-50 group-hover:opacity-100 transition-opacity">MASA</span>
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  return (
      <div className="h-screen flex flex-col bg-white overflow-hidden relative font-sans">
          {/* Header */}
          <div className="bg-black text-white p-4 flex justify-between items-center shrink-0 border-b border-white/20">
              <button onClick={() => setActiveTab('TABLES')} className="p-2 hover:bg-white/20 transition-colors"><ArrowLeft/></button>
              <div className="font-black text-xl tracking-widest uppercase">MASA {selectedTable}</div>
              <div className="bg-white text-black w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-white">
                  {cart.reduce((a,b) => a + b.quantity, 0)}
              </div>
          </div>

          {/* Categories */}
          <div className="p-2 bg-white overflow-x-auto whitespace-nowrap gap-2 flex shrink-0 border-b-2 border-black">
              {categories.map(cat => (
                  <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all
                          ${selectedCategory?.id === cat.id 
                              ? 'bg-black text-white ring-2 ring-black ring-offset-2' 
                              : 'bg-white text-black border border-black hover:bg-gray-100'}`}
                  >
                      {cat.name}
                  </button>
              ))}
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-0 bg-gray-50">
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
                      className="w-full bg-white border-b border-gray-100 p-6 flex justify-between items-center active:bg-black active:text-white group transition-all text-left hover:bg-gray-50 min-h-[5rem]"
                  >
                      <div>
                          <div className="font-black text-xl uppercase mb-1">{p.name}</div>
                          <div className="text-xs text-gray-500 group-active:text-gray-400 font-mono uppercase tracking-wide">{p.description}</div>
                          {p.options && p.options.length > 0 && (
                              <div className="text-[10px] font-bold mt-3 flex items-center gap-2 uppercase tracking-widest text-black group-active:text-white border-l-2 border-black group-active:border-white pl-2">
                                  <span>SEÇENEKLER MEVCUT</span> <ArrowRight size={14}/>
                              </div>
                          )}
                      </div>
                      <div className="font-black text-2xl tracking-tight">₺{parseFloat(p.price).toFixed(2)}</div>
                  </button>
              ))}
          </div>

          {/* Cart / Actions */}
          <div className="bg-white border-t-2 border-black p-4 shrink-0 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
             {cart.length > 0 ? (
                 <>
                    <div className="mb-4 max-h-32 overflow-y-auto bg-gray-50 border border-black p-2">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-dashed border-gray-300 last:border-0 hover:bg-white transition-colors px-2">
                                <div className="flex-1">
                                    <div className="text-sm font-bold uppercase">{item.name} <span className="text-xs font-mono ml-1 text-gray-500">x{item.quantity}</span></div>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                                        <div className="text-[10px] text-gray-500 font-mono">
                                            {item.selectedOptions.map(o => o.name).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm font-bold">₺{(item.price * item.quantity).toFixed(2)}</span>
                                    <button onClick={() => removeFromCart(item.cartId)} className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <textarea 
                        className="w-full p-3 border border-black mb-4 text-xs font-mono bg-white focus:bg-gray-50 transition-colors resize-none placeholder-gray-500"
                        placeholder="SİPARİŞ NOTU EKLE..."
                        rows={2}
                        value={orderNote}
                        onChange={e => setOrderNote(e.target.value)}
                    />

                    <button 
                        onClick={submitOrder} 
                        disabled={isSubmitting}
                        className="w-full h-20 bg-black text-white border-2 border-black font-black text-xl uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        {isSubmitting ? <div className="spinner w-6 h-6 border-white border-t-transparent" /> : <Send size={24} />}
                        SİPARİŞİ GÖNDER • ₺{cart.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
                    </button>
                 </>
             ) : (
                 <div className="text-center py-4 text-gray-400 font-bold uppercase text-xs tracking-widest">Sepet Boş</div>
             )}
          </div>

          {/* Option Modal */}
          {optionModal && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-fadeIn">
                  <div className="bg-white w-full border-t-2 border-black p-6 flex flex-col gap-6 max-h-[85vh] animate-slideUp">
                      <div className="flex justify-between items-start border-b border-black pb-4">
                          <div>
                              <h3 className="font-black text-2xl uppercase tracking-tighter">{optionModal.product.name}</h3>
                              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Lütfen Seçenekleri Belirleyin</p>
                          </div>
                          <button onClick={() => setOptionModal(null)} className="p-2 border border-black hover:bg-black hover:text-white transition-colors">
                            <span className="font-bold text-xs uppercase">VAZGEÇ</span>
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
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
                                      className={`p-4 border-2 text-left flex justify-between items-center transition-all group
                                          ${isSelected ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white border-gray-200 hover:border-black text-black'}`}
                                  >
                                      <span className="font-bold text-sm uppercase">{opt.name}</span>
                                      <span className="font-mono text-xs font-bold">{opt.price_change > 0 ? `+₺${opt.price_change}` : 'ÜCRETSİZ'}</span>
                                  </button>
                              );
                          })}
                      </div>

                      <button 
                          onClick={() => {
                              addToCart(optionModal.product, optionModal.selected);
                              setOptionModal(null);
                          }}
                          className="w-full py-4 bg-green-600 border-2 border-green-700 text-white font-black uppercase tracking-widest text-lg hover:bg-green-700 active:scale-[0.98] transition-all"
                      >
                          EKLE (+₺{optionModal.selected.reduce((a, b) => a + b.price_change, 0)})
                      </button>
                  </div>
              </div>
          )}
      </div>
  );
}