import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';

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
        <div className="p-6 border-b border-black flex flex-col items-center justify-center bg-black text-white">
           <h1 className="text-xl font-bold uppercase tracking-widest">{data.company_name || 'RESTORAN MENÜ'}</h1>
           <p className="text-xs font-mono text-gray-400 mt-1">Masa No: {tableId}</p>
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
                  className="w-full flex justify-between items-center py-2 font-bold text-lg uppercase tracking-wider text-left"
                >
                  {cat.name}
                  {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>
                
                {/* Products List */}
                {isExpanded && (
                  <div className="flex flex-col gap-4 mt-2 animate-fadeIn">
                    {categoryProducts.map(product => (
                        <div key={product.id} className="border border-black p-4 flex flex-col gap-2">
                           <div className="flex gap-4">
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
                         
                         {/* Controls */}
                         <div className="flex items-center justify-end mt-2 gap-2">
                            {product.options && product.options.length > 0 ? (
                                // Product WITH Options
                                <div className="flex items-center gap-2">
                                    {getProductQty(product.id) > 0 && <span className="font-bold text-xs bg-gray-100 px-2 py-1 rounded">Sepette: {getProductQty(product.id)}</span>}
                                    <button 
                                      onClick={() => setOptionModal({ product, selected: [] })}
                                      className="bg-black text-white px-4 py-2 text-xs font-bold uppercase rounded hover:bg-gray-800"
                                    >
                                      EKLE +
                                    </button>
                                </div>
                            ) : (
                                // Standard Product
                                <>
                                    <button 
                                      onClick={() => removeFromCart(`${product.id}-`)}
                                      className="p-1 text-black hover:opacity-50 transition-opacity"
                                    >
                                      <Minus size={22} strokeWidth={3} />
                                 </button>
                                   
                                   <div className="font-mono font-bold w-6 text-center text-black text-lg">
                                     {getProductQty(product.id)}
                                   </div>

                                   <button 
                                     onClick={() => addToCart(product)}
                                     className="p-1 text-black hover:opacity-50 transition-opacity"
                                   >
                                     <Plus size={22} strokeWidth={3} />
                                   </button>
                                </>
                            )}
                         </div>
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
          <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 flex justify-between items-center z-40 border-t border-white" style={{paddingBottom: 'safe-area-inset-bottom'}}>
             <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-mono tracking-widest">TOPLAM ({cartItemCount} çeşit)</span>
               <span className="text-xl font-bold font-mono tracking-tighter">₺{totalAmount.toFixed(2)}</span>
             </div>
             
             <button 
               onClick={() => setShowCartModal(true)}
               className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs sm:text-sm"
             >
               SEPETİ GÖR & ONAYLA
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
              <div className="border-2 border-red-600 p-8">
                <h1 className="text-xl font-black text-red-600 uppercase mb-4">HATA OLUŞTU</h1>
                <p className="text-sm font-mono mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-black text-white px-6 py-2 text-xs font-bold uppercase"
                >
                    TEKRAR DENE
                </button>
              </div>
          </div>
      );
  }

  const totalAmount = calculateTotal();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      {/* Header */}
      <div className="p-6 border-b border-black flex flex-col items-center justify-center bg-black text-white">
         <h1 className="text-xl font-bold uppercase tracking-widest">{data.company_name || 'RESTORAN MENÜ'}</h1>
         <p className="text-xs font-mono text-gray-400 mt-1">Masa No: {tableId}</p>
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
                className="w-full flex justify-between items-center py-2 font-bold text-lg uppercase tracking-wider text-left"
              >
                {cat.name}
                {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              
              {/* Products List */}
              {isExpanded && (
                <div className="flex flex-col gap-4 mt-2 animate-fadeIn">
                  {categoryProducts.map(product => (
                      <div key={product.id} className="border border-black p-4 flex flex-col gap-2">
                         <div className="flex gap-4">
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
                       
                       {/* Controls */}
                       <div className="flex items-center justify-end mt-2 gap-2">
                          {product.options && product.options.length > 0 ? (
                              // Product WITH Options
                              <div className="flex items-center gap-2">
                                  {getProductQty(product.id) > 0 && <span className="font-bold text-xs bg-gray-100 px-2 py-1 rounded">Sepette: {getProductQty(product.id)}</span>}
                                  <button 
                                    onClick={() => setOptionModal({ product, selected: [] })}
                                    className="bg-black text-white px-4 py-2 text-xs font-bold uppercase rounded hover:bg-gray-800"
                                  >
                                    EKLE +
                                  </button>
                              </div>
                          ) : (
                              // Standard Product
                              <>
                                  <button 
                                    onClick={() => removeFromCart(`${product.id}-`)}
                                    className="p-1 text-black hover:opacity-50 transition-opacity"
                                  >
                                    <Minus size={22} strokeWidth={3} />
                                  </button>
                                  
                                  <div className="font-mono font-bold w-6 text-center text-black text-lg">
                                    {getProductQty(product.id)}
                                  </div>

                                  <button 
                                    onClick={() => addToCart(product)}
                                    className="p-1 text-black hover:opacity-50 transition-opacity"
                                  >
                                    <Plus size={22} strokeWidth={3} />
                                  </button>
                              </>
                          )}
                       </div>
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
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 flex justify-between items-center z-40 border-t border-white" style={{paddingBottom: 'safe-area-inset-bottom'}}>
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 font-mono tracking-widest">TOPLAM ({cartItemCount} çeşit)</span>
             <span className="text-xl font-bold font-mono tracking-tighter">₺{totalAmount.toFixed(2)}</span>
           </div>
           
           <button 
             onClick={() => setShowCartModal(true)}
             className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs sm:text-sm"
           >
             SEPETİ GÖR & ONAYLA
           </button>
        </div>
      )}

      {/* Cart Review Modal */}
      {showCartModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fadeIn">
              <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                      <h3 className="font-black text-lg uppercase tracking-wider">SEPET DETAYI</h3>
                      <button onClick={() => setShowCartModal(false)} className="text-gray-500 font-bold p-2 hover:bg-gray-200 rounded">KAPAT</button>
                  </div>
                  
                  <div className="p-4 overflow-y-auto flex-1">
                      {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start mb-4 border-b border-gray-100 pb-2 last:border-0">
                              <div>
                                  <div className="font-bold uppercase text-sm">{item.name}</div>
                                  <div className="text-xs text-gray-500 font-mono">₺{item.price} x {item.quantity}</div>
                                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                                      <div className="text-[10px] text-gray-400">
                                          {item.selectedOptions.map(o => o.name).join(', ')}
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  <div className="font-bold font-mono">₺{(item.price * item.quantity).toFixed(2)}</div>
                                  <button onClick={() => removeFromCart(item.key)} className="text-xs text-red-500 underline font-bold">ÇIKAR</button>
                              </div>
                          </div>
                      ))}

                      <div className="mt-4 pt-4 border-t border-black">
                          <label className="block text-xs font-bold uppercase mb-2">Sipariş Notu (Opsiyonel)</label>
                          <textarea 
                              className="w-full border-2 border-gray-200 p-3 rounded font-mono text-sm focus:border-black outline-none transition-colors"
                              placeholder="Acısız olsun, buzlu olsun vb."
                              rows={3}
                              value={orderNote}
                              onChange={e => setOrderNote(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-4 bg-black text-white shrink-0">
                       <div className="flex justify-between items-center mb-4 text-sm font-mono text-gray-400">
                           <span>TOPLAM TUTAR</span>
                           <span className="text-white font-bold text-xl">₺{totalAmount.toFixed(2)}</span>
                       </div>
                       <button 
                          onClick={handlePlaceOrder}
                          className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] hover:bg-lime-400 transition-colors"
                       >
                           SİPARİŞİ GÖNDER
                       </button>
                  </div>
              </div>
          </div>
      )}
      {/* Option Modal */}
      {optionModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end justify-center animate-fadeIn">
              <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="font-black text-xl uppercase">{optionModal.product.name}</h3>
                          <p className="text-gray-500 text-sm">Seçenekleri belirleyin</p>
                      </div>
                      <button onClick={() => setOptionModal(null)} className="p-2 bg-gray-100 rounded font-bold">IPTAL</button>
                  </div>

                  <div className="flex-1 overflow-y-auto pt-2 pb-6 flex flex-col gap-3">
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
                      className="w-full py-4 bg-green-600 text-white font-black uppercase rounded-lg text-lg tracking-widest"
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
