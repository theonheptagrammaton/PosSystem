import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { ChevronDown, ChevronUp, Minus, Plus, CheckCircle, X } from 'lucide-react';

export default function MobileMenu() {
  const { tenantId, branchId, tableId } = useParams(); // Using tableId as table_no
  const [data, setData] = useState({ categories: [], products: [] });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cart, setCart] = useState([]); // Array of { productId, quantity, selectedOptions, key, price }
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Option Modal State
  const [optionModal, setOptionModal] = useState(null); // { product, selected: [] }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/public/menu/${tenantId}`);
        setData(res.data);
        if (res.data.categories && res.data.categories.length > 0) {
          setExpandedCategory(res.data.categories[0].id);
        }
      } catch (err) {
        console.error('Menü getirilemedi:', err);
        setError('Bağlantı hatası: Sunucuya ulaşılamıyor.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId]);

  const [showCartModal, setShowCartModal] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  const toggleCategory = (id) => {
    setExpandedCategory(prev => prev === id ? null : id);
  };

  const addToCart = (product, selectedOptions = []) => {
      const optionPrice = selectedOptions.reduce((acc, opt) => acc + opt.price_change, 0);
      const finalPrice = parseFloat(product.price) + optionPrice;
      const optionsKey = selectedOptions.map(o => o.name).sort().join('-');
      const itemKey = `${product.id}-${optionsKey}`;

      setCart(prev => {
          const existingIndex = prev.findIndex(item => item.key === itemKey);
          if (existingIndex > -1) {
              const newCart = [...prev];
              newCart[existingIndex].quantity += 1;
              return newCart;
          }
          return [...prev, {
              productId: product.id,
              name: product.name,
              price: finalPrice,
              originalPrice: product.price,
              quantity: 1,
              selectedOptions,
              key: itemKey
          }];
      });
  };

  const removeFromCart = (itemKey) => {
      setCart(prev => {
          const existingIndex = prev.findIndex(item => item.key === itemKey);
          if (existingIndex === -1) return prev;
          
          const newCart = [...prev];
          if (newCart[existingIndex].quantity > 1) {
              newCart[existingIndex].quantity -= 1;
          } else {
              newCart.splice(existingIndex, 1);
          }
          return newCart;
      });
  };

  const getProductQty = (productId) => {
      return cart.filter(item => item.productId === productId).reduce((acc, item) => acc + item.quantity, 0);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    // Final Submission from Modal
    const items = cart.map(item => ({
        id: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions
    }));

    const payload = {
      tenant_id: tenantId,
      branch_id: branchId,
      table_no: `MASA-${tableId}`,
      total_amount: calculateTotal(),
      items: items,
      source: 'QR',
      note: orderNote
    };

    try {
      await api.post('/api/orders', payload);
      setOrderPlaced(true);
      setCart([]);
      setShowCartModal(false);
      setOrderNote('');
    } catch (err) {
      alert('Sipariş oluşturulurken bir hata oluştu');
      console.error(err);
    }
  };

  const totalAmount = calculateTotal();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (orderPlaced) {
    // Show success banner instead of full-screen blocker
    return (
      <div className="bg-white min-h-screen pb-24 relative">
        {/* Success Banner */}
        <div className="sticky top-0 z-50 bg-green-600 text-white p-4 flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={24} />
            <div>
              <div className="font-bold">Sipariş Alındı!</div>
              <div className="text-xs opacity-90">Mutfağımız hazırlıyor...</div>
            </div>
          </div>
          <button 
            onClick={() => setOrderPlaced(false)}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold"
          >
            YENİ SİPARİŞ
          </button>
        </div>

        {/* Continue with normal menu view */}
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex flex-col items-center justify-center bg-white text-black">
           <h1 className="text-xl font-light uppercase tracking-[0.3em] font-sans">{data.company_name || 'RESTORAN MENÜ'}</h1>
           <div className="h-4 w-px bg-zinc-200 my-2"></div>
           <p className="text-[10px] font-medium text-zinc-400 tracking-tighter uppercase italic">Masa {tableId}</p>
        </div>

        {/* Categories Accordion */}
        <div className="p-4 flex flex-col gap-4">
          {data.categories.map(cat => {
            const categoryProducts = data.products.filter(p => p.category_id === cat.id);
            const isExpanded = expandedCategory === cat.id;

            if (categoryProducts.length === 0) return null;

            return (
              <div key={cat.id} className="border-b border-black last:border-b-0 pb-4">
                <button 
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex justify-between items-center py-4 font-medium text-sm uppercase tracking-[0.2em] text-zinc-800 text-left"
                >
                  {cat.name}
                  {isExpanded ? <ChevronUp size={16} className="text-zinc-400"/> : <ChevronDown size={16} className="text-zinc-400"/>}
                </button>
                
                {/* Products List */}
                {isExpanded && (
                  <div className="flex flex-col gap-6 mt-2 animate-fadeIn">
                    {categoryProducts.map(product => (
                        <div key={product.id} className="flex flex-col gap-4 group">
                           <div className="flex gap-5">
                             {product.image_url && (
                               <div className="w-20 h-20 shrink-0 border border-black overflow-hidden bg-gray-50">
                                 <img 
                                   src={product.image_url.startsWith('http') ? product.image_url : `${api.defaults.baseURL}${product.image_url}`} 
                                   alt={product.name}
                                   className="w-full h-full object-cover"
                                 />
                               </div>
                             )}
                             <div className="flex-1">
                               <div className="flex justify-between items-start">
                                 <h3 className="font-bold text-sm uppercase">{product.name}</h3>
                                 <div className="font-mono font-bold whitespace-nowrap ml-2">
                                   ₺{product.price}
                                 </div>
                               </div>
                               <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                             </div>
                           </div>
                         
                         <div className="flex items-center justify-end mt-4 gap-4">
                            {product.options && product.options.length > 0 ? (
                                // Product WITH Options
                                <div className="flex items-center gap-4">
                                    {getProductQty(product.id) > 0 && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Sepette: {getProductQty(product.id)}</span>}
                                    <button 
                                      onClick={() => setOptionModal({ product, selected: [] })}
                                      className="bg-zinc-900 text-white px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all active:scale-95 shadow-lg shadow-zinc-200"
                                    >
                                      EKLE +
                                    </button>
                                </div>
                            ) : (
                                // Standard Product
                                <div className="flex items-center bg-zinc-50 rounded-full px-2 py-1 border border-zinc-100">
                                    <button 
                                      onClick={() => removeFromCart(`${product.id}-`)}
                                      className="p-2 text-zinc-400 hover:text-black transition-colors"
                                    >
                                      <Minus size={16} />
                                 </button>
                                   
                                   <div className="font-medium min-w-[32px] text-center text-zinc-900 text-sm">
                                     {getProductQty(product.id)}
                                   </div>
 
                                   <button 
                                     onClick={() => addToCart(product)}
                                     className="p-2 text-zinc-900 hover:text-black transition-colors"
                                   >
                                     <Plus size={16} />
                                   </button>
                                </div>
                            )}
                         </div>
                         <div className="h-px bg-zinc-50 w-full mt-2"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {cartItemCount > 0 && (
          <div className="fixed bottom-6 left-6 right-6 bg-zinc-900 text-white p-5 flex justify-between items-center z-40 rounded-2xl shadow-2xl animate-slideUp">
             <div className="flex flex-col">
               <span className="text-[9px] text-zinc-400 font-bold tracking-[0.2em] uppercase">Sipariş Toplamı</span>
               <span className="text-xl font-light tracking-tighter">₺{totalAmount.toFixed(2)}</span>
             </div>
             
             <button 
               onClick={() => setShowCartModal(true)}
               className="bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all text-[10px] active:scale-95"
             >
               SEPETE GİT
             </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 font-mono">
              <div className="w-10 h-10 border-4 border-black border-t-transparent animate-spin mb-4"></div>
              <p className="text-xs uppercase tracking-[0.2em]">Menü Yükleniyor...</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center">
              <div className="p-8">
                <h1 className="text-xl font-light text-black uppercase mb-4 tracking-[0.2em]">BİR HATA OLUŞTU</h1>
                <p className="text-xs text-zinc-500 mb-8 max-w-xs mx-auto uppercase leading-relaxed">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] rounded-full"
                >
                    TEKRAR DENE
                </button>
              </div>
          </div>
      );
  }

  // Totals calculated at the top for use in both view states
  return (
    <div className="bg-white min-h-screen pb-24 relative">
      {/* Header */}
      <div className="p-10 border-b border-zinc-50 flex flex-col items-center justify-center bg-white text-black">
         <h1 className="text-2xl font-light uppercase tracking-[0.3em] font-sans text-center">{data.company_name || 'RESTORAN MENÜ'}</h1>
         <div className="h-6 w-[1px] bg-zinc-200 my-4"></div>
         <p className="text-[10px] font-bold text-zinc-400 tracking-[0.2em] uppercase">MASA {tableId}</p>
      </div>

      {/* Categories Accordion */}
      <div className="p-4 flex flex-col gap-4">
        {data.categories.map(cat => {
          const categoryProducts = data.products.filter(p => p.category_id === cat.id);
          const isExpanded = expandedCategory === cat.id;

          if (categoryProducts.length === 0) return null;

          return (
            <div key={cat.id} className="pb-2">
              <button 
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex justify-between items-center py-5 font-medium text-xs uppercase tracking-[0.3em] text-zinc-900 text-left border-b border-zinc-50"
              >
                {cat.name}
                {isExpanded ? <ChevronUp size={14} className="text-zinc-300"/> : <ChevronDown size={14} className="text-zinc-300"/>}
              </button>
              
              {/* Products List */}
              {isExpanded && (
                <div className="flex flex-col gap-10 mt-6 animate-fadeIn">
                  {categoryProducts.map(product => (
                      <div key={product.id} className="flex flex-col gap-4 group">
                         <div className="flex gap-6">
                           {product.image_url && (
                             <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-zinc-50 shadow-sm border border-zinc-50">
                               <img 
                                 src={product.image_url.startsWith('http') ? product.image_url : `${api.defaults.baseURL}${product.image_url}`} 
                                 alt={product.name}
                                 className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                               />
                             </div>
                           )}
                           <div className="flex-1 flex flex-col justify-center">
                             <div className="flex justify-between items-baseline mb-1">
                               <h3 className="font-medium text-sm text-zinc-900 uppercase tracking-widest">{product.name}</h3>
                               <div className="text-xs font-light text-zinc-400 ml-4 italic">
                                 ₺{product.price}
                               </div>
                             </div>
                             <p className="text-[10px] text-zinc-400 leading-relaxed font-light mt-1 line-clamp-2 uppercase tracking-tighter">{product.description}</p>
                           </div>
                         </div>
                       
                       <div className="flex items-center justify-end mt-4 gap-6">
                          {product.options && product.options.length > 0 ? (
                              // Product WITH Options
                              <div className="flex items-center gap-4">
                                  {getProductQty(product.id) > 0 && <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Sepette: {getProductQty(product.id)}</span>}
                                  <button 
                                    onClick={() => setOptionModal({ product, selected: [] })}
                                    className="bg-zinc-900 text-white px-8 py-2 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-black transition-all shadow-xl shadow-zinc-100 active:scale-95"
                                  >
                                    EKLE +
                                  </button>
                              </div>
                          ) : (
                              // Standard Product
                              <div className="flex items-center bg-zinc-50 rounded-full px-2 py-1 border border-zinc-100">
                                  <button 
                                    onClick={() => removeFromCart(`${product.id}-`)}
                                    className="p-2 text-zinc-400 hover:text-black transition-colors"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  
                                  <div className="font-medium min-w-[32px] text-center text-zinc-900 text-xs tracking-tighter">
                                    {getProductQty(product.id)}
                                  </div>

                                  <button 
                                    onClick={() => addToCart(product)}
                                    className="p-2 text-zinc-900 hover:text-black transition-colors"
                                  >
                                    <Plus size={14} />
                                  </button>
                              </div>
                          )}
                       </div>
                       <div className="h-px bg-zinc-50 w-full mt-6"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Footer */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-6 right-6 bg-zinc-900 text-white p-6 flex justify-between items-center z-40 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-slideUp border border-zinc-800">
           <div className="flex flex-col">
             <span className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase mb-1">Toplam</span>
             <span className="text-2xl font-light tracking-tighter">₺{totalAmount.toFixed(2)}</span>
           </div>
           
           <button 
             onClick={() => setShowCartModal(true)}
             className="bg-white text-black px-8 py-3 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all text-[10px] active:scale-95 shadow-lg"
           >
             SEPETİ GÖR
           </button>
        </div>
      )}

      {/* Cart Review Modal */}
      {showCartModal && (
          <div className="fixed inset-0 z-50 bg-white/20 backdrop-blur-3xl flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeIn">
              <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[2rem] overflow-hidden flex flex-col max-h-[92vh] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)] border-t border-zinc-50">
                  <div className="p-8 pb-4 flex justify-between items-center">
                      <h3 className="font-light text-xl uppercase tracking-[0.3em] text-zinc-900">SİPARİŞİNİZ</h3>
                      <button onClick={() => setShowCartModal(false)} className="text-zinc-300 hover:text-black p-2 transition-colors">
                          <X size={24} strokeWidth={1}/>
                      </button>
                  </div>
                  
                  <div className="p-8 pt-4 overflow-y-auto flex-1">
                      {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start mb-6 border-b border-zinc-50 pb-4 last:border-0">
                              <div>
                                  <div className="font-medium uppercase text-xs tracking-widest text-zinc-800">{item.name}</div>
                                  <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-tight italic">₺{item.price} x {item.quantity}</div>
                                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                                      <div className="text-[9px] text-zinc-400 mt-2 uppercase tracking-widest bg-zinc-50 px-2 py-1 inline-block rounded">
                                          {item.selectedOptions.map(o => o.name).join(' · ')}
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                  <div className="font-light text-sm tracking-tight">₺{(item.price * item.quantity).toFixed(2)}</div>
                                  <button onClick={() => removeFromCart(item.key)} className="text-[9px] text-zinc-300 hover:text-red-500 font-bold uppercase tracking-[0.2em] transition-colors">ÇIKAR</button>
                              </div>
                          </div>
                      ))}

                      <div className="mt-8 pt-8 border-t border-zinc-100">
                          <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300 mb-4">Sipariş Notu</label>
                          <textarea 
                              className="w-full bg-zinc-50 border-none p-5 rounded-3xl font-sans text-xs focus:ring-1 focus:ring-zinc-200 outline-none transition-all placeholder:text-zinc-300"
                              placeholder="Özel isteklerinizi belirtebilirsiniz..."
                              rows={3}
                              value={orderNote}
                              onChange={e => setOrderNote(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-8 bg-white shrink-0">
                       <div className="flex justify-between items-center mb-8">
                           <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-300 uppercase">Toplam Tutar</span>
                           <span className="text-3xl font-light text-black tracking-tighter">₺{totalAmount.toFixed(2)}</span>
                       </div>
                       <button 
                          onClick={handlePlaceOrder}
                          className="w-full bg-zinc-900 text-white py-5 rounded-3xl font-bold uppercase tracking-[0.4em] text-[11px] hover:bg-black transition-all active:scale-95 shadow-2xl shadow-zinc-200"
                       >
                           SİPARİŞİ ONAYLA
                       </button>
                       <div className="h-4"></div>
                  </div>
              </div>
          </div>
      )}
      {/* Option Modal */}
      {optionModal && (
          <div className="fixed inset-0 z-50 bg-white/40 backdrop-blur-3xl flex items-end justify-center animate-fadeIn p-0">
              <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] p-10 flex flex-col max-h-[92vh] shadow-[0_-30px_70px_-15px_rgba(0,0,0,0.15)] border-t border-zinc-100">
                  <div className="flex justify-between items-start mb-10">
                      <div>
                          <h3 className="font-light text-2xl uppercase tracking-[0.2em] text-zinc-900">{optionModal.product.name}</h3>
                          <div className="h-4 w-[1px] bg-zinc-200 my-3"></div>
                          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em]">Tercihlerinizi seçin</p>
                      </div>
                      <button onClick={() => setOptionModal(null)} className="p-3 text-zinc-300 hover:text-black">
                          <X size={28} strokeWidth={1} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto pb-10 flex flex-col gap-4">
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
                                  className={`p-6 rounded-[2rem] text-left flex justify-between items-center transition-all duration-500
                                      ${isSelected 
                                        ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200 scale-[1.02]' 
                                        : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                              >
                                  <span className="font-medium text-xs uppercase tracking-widest">{opt.name}</span>
                                  <span className="font-light text-xs italic">{opt.price_change > 0 ? `+₺${opt.price_change}` : '0'}</span>
                              </button>
                          );
                      })}
                  </div>

                  <button 
                      onClick={() => {
                          addToCart(optionModal.product, optionModal.selected);
                          setOptionModal(null);
                      }}
                      style={{ backgroundColor: '#18181b', color: 'white' }}
                      className="w-full py-5 rounded-[2rem] font-bold uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-zinc-300 active:scale-95 transition-all"
                  >
                      SİPARİŞE EKLE (+₺{optionModal.selected.reduce((a, b) => a + b.price_change, 0)})
                  </button>
                  <div className="h-6"></div> {/* Safe area spacer */}
              </div>
          </div>
      )}
    </div>
  );
}
