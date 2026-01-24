import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { ChevronDown, ChevronUp, Minus, Plus, CheckCircle, X } from 'lucide-react';

export default function MobileMenu() {
  const { tenantId, branchId, tableId } = useParams(); 
  const [data, setData] = useState({ categories: [], products: [] });
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]); 
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [optionModal, setOptionModal] = useState(null); 
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/public/menu/${tenantId}`);
        setData(res.data);
        if (res.data.categories && res.data.categories.length > 0) {
          // Default to ALL, no need to set expandedCategory
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

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center p-8 animate-fadeIn">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 animate-slideUp">
             <CheckCircle size={48} className="text-black" />
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-widest text-center mb-4 leading-tight">SİPARİŞİNİZ ALINDI</h1>
        <div className="w-16 h-1 bg-white mb-6"></div>
        <p className="text-sm font-mono text-gray-400 text-center uppercase mb-12 max-w-xs leading-relaxed">
            Siparişiniz mutfağımıza iletildi. Hazırlanmaya başlandı.
        </p>

        <button 
            onClick={() => setOrderPlaced(false)}
            className="w-full max-w-xs bg-white text-black py-5 font-black uppercase tracking-[0.3em] text-xs hover:bg-gray-200 transition-all border-2 border-white active:scale-95"
        >
            YENİ SİPARİŞ VER
        </button>
        
        <div className="absolute bottom-8 flex flex-col items-center gap-2">
            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                MASA: {tableId}
            </div>
            <a 
              href="https://theon.com.tr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[9px] text-gray-700 opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest font-black"
            >
              theon.com.tr
            </a>
        </div>
      </div>
    );
  }

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 font-sans">
              <div className="spinner mb-4"></div>
              <p className="text-xs uppercase tracking-[0.2em] font-bold animate-pulse">Menü Yükleniyor...</p>
          </div>
      );
  }

  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center font-sans">
              <div className="p-8 border-2 border-black">
                <h1 className="text-lg font-black text-black uppercase mb-4 tracking-widest">HATA</h1>
                <p className="text-xs text-gray-500 mb-8 max-w-xs mx-auto uppercase font-bold">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-black text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all"
                >
                    TEKRAR DENE
                </button>
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white min-h-screen pb-24 relative font-sans text-black">
      {/* Header */}
      <div className="pt-8 pb-4 border-b border-gray-100 flex flex-col items-center justify-center bg-white sticky top-0 z-30 shadow-sm">
         <h1 className="text-xl font-black uppercase tracking-[0.3em] text-center leading-relaxed">{data.company_name || 'RESTORAN MENÜ'}</h1>
         <div className="h-4 w-[2px] bg-black my-2"></div>
         <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">MASA {tableId}</p>
      </div>

      {/* Sticky Categories Bar */}
      <div className="sticky top-[105px] z-20 bg-white border-b border-black shadow-md">
          <div className="flex overflow-x-auto whitespace-nowrap p-4 gap-3 scrollbar-hide">
              <button 
                  onClick={() => handleCategorySelect('ALL')}
                  className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all flex-shrink-0
                  ${selectedCategory === 'ALL' 
                      ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]' 
                      : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
              >
                  TÜM ÜRÜNLER
              </button>
              {data.categories.map(cat => (
                  <button 
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-2 transition-all flex-shrink-0
                      ${selectedCategory === cat.id 
                          ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]' 
                          : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
                  >
                      {cat.name}
                  </button>
              ))}
          </div>
      </div>

      {/* Categories & Products */}
      <div className="p-4 flex flex-col gap-8 pb-32">
        {data.categories.map(cat => {
          // Filter logic: Show if ALL is selected OR if this specific category is selected
          if (selectedCategory !== 'ALL' && selectedCategory !== cat.id) return null;

          const categoryProducts = data.products.filter(p => p.category_id === cat.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={cat.id} className="animate-fadeIn">
              
              {/* Products List */}
              <div className="flex flex-col gap-4">
                {categoryProducts.map(product => (
                    <div key={product.id} className="bg-white border-2 border-transparent hover:border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex flex-col">
                           {/* Image */}
                           {product.image_url && (
                             <div className="w-full h-48 bg-gray-100 border-b border-gray-100 overflow-hidden relative group">
                               <img 
                                 src={product.image_url.startsWith('http') ? product.image_url : `${api.defaults.baseURL}${product.image_url}`} 
                                 alt={product.name}
                                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                               />
                               <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                             </div>
                           )}
                           
                           {/* Content */}
                           <div className="p-5 flex flex-col gap-3">
                               <div className="flex justify-between items-start gap-4">
                                   <div className="flex-1">
                                       <h3 className="font-black text-lg uppercase tracking-tight leading-tight">{product.name}</h3>
                                       <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-1 leading-relaxed line-clamp-2">{product.description}</p>
                                   </div>
                                   <div className="font-black text-xl tracking-tighter text-right">
                                       ₺{product.price}
                                   </div>
                               </div>

                               <div className="pt-3 mt-2 border-t border-gray-100 flex justify-end">
                                  {product.options && product.options.length > 0 ? (
                                      <div className="flex items-center gap-3 w-full justify-end">
                                          {getProductQty(product.id) > 0 && (
                                              <span className="text-[10px] font-black text-black uppercase tracking-widest border-b-2 border-black">
                                                  SEPETTE: {getProductQty(product.id)}
                                              </span>
                                          )}
                                          <button 
                                            onClick={() => setOptionModal({ product, selected: [] })}
                                            className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                                          >
                                            SEÇENEKLER
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-4 w-full justify-between sm:justify-end">
                                          {getProductQty(product.id) > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 sm:hidden">ADET</span>}
                                          <div className="flex items-center border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                                              <button 
                                                onClick={() => removeFromCart(`${product.id}-`)}
                                                className="w-10 h-10 flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors border-r-2 border-white active:bg-gray-900"
                                              >
                                                <Minus size={16} strokeWidth={3} />
                                              </button>
                                              
                                              <div className="font-black min-w-[40px] text-center text-lg text-black bg-white">
                                                {getProductQty(product.id)}
                                              </div>

                                              <button 
                                                onClick={() => addToCart(product)}
                                                className="w-10 h-10 flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors border-l-2 border-white active:bg-gray-900"
                                              >
                                                <Plus size={16} strokeWidth={3} />
                                              </button>
                                          </div>
                                      </div>
                                  )}
                               </div>
                           </div>
                        </div>
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer Link */}
      <div className="flex justify-center pb-8 opacity-30">
        <a 
          href="https://theon.com.tr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[9px] font-black uppercase tracking-[0.3em] hover:opacity-100 transition-all"
        >
          Powered by theon.com.tr
        </a>
      </div>

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t-2 border-black z-40 animate-slideUp">
           <div className="bg-black text-white p-4 flex justify-between items-center shadow-2xl">
               <div className="flex flex-col">
                 <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">TOPLAM</span>
                 <span className="text-2xl font-black tracking-tighter font-mono">₺{totalAmount.toFixed(2)}</span>
               </div>
               
               <button 
                 onClick={() => setShowCartModal(true)}
                 className="bg-white text-black px-6 py-3 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 transition-colors"
               >
                 SEPETİ GÖR ({cartItemCount})
               </button>
           </div>
        </div>
      )}

      {/* Cart Review Modal */}
      {showCartModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fadeIn">
              <div className="bg-white w-full max-w-lg flex flex-col max-h-[90vh] border-2 border-white shadow-2xl">
                  <div className="p-6 border-b-2 border-black flex justify-between items-center bg-gray-50">
                      <h3 className="font-black text-lg uppercase tracking-[0.3em]">SİPARİŞ ÖZETİ</h3>
                      <button onClick={() => setShowCartModal(false)}>
                          <X size={24} className="hover:rotate-90 transition-transform"/>
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                      {cart.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4 last:border-0 last:mb-0">
                              <div className="flex-1 pr-4">
                                  <div className="font-black uppercase text-sm tracking-wide break-words">{item.name}</div>
                                  <div className="text-[10px] text-gray-500 mt-1 uppercase font-bold font-mono">₺{item.price} x {item.quantity}</div>
                                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                                      <div className="text-[9px] text-black border-l-2 border-black pl-2 mt-2 uppercase font-bold tracking-wide">
                                          {item.selectedOptions.map(o => o.name).join(' + ')}
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                  <div className="font-mono font-bold text-sm">₺{(item.price * item.quantity).toFixed(2)}</div>
                                  <button onClick={() => removeFromCart(item.key)} className="text-[9px] text-red-600 font-black uppercase tracking-widest hover:underline">KALDIR</button>
                              </div>
                          </div>
                      ))}

                      <div className="mt-8 pt-8 border-t-2 border-black">
                          <textarea 
                              className="w-full bg-gray-50 border-2 border-gray-200 p-4 font-bold text-xs focus:border-black outline-none transition-all placeholder:text-gray-400 uppercase tracking-wide"
                              placeholder="Sipariş Notu Ekleyin..."
                              rows={3}
                              value={orderNote}
                              onChange={e => setOrderNote(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-6 bg-black text-white shrink-0">
                       <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                           <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">GENEL TOPLAM</span>
                           <span className="text-3xl font-black tracking-tighter font-mono">₺{totalAmount.toFixed(2)}</span>
                       </div>
                       <button 
                          onClick={handlePlaceOrder}
                          className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.3em] text-[12px] hover:bg-gray-200 transition-all border-2 border-black active:translate-y-1"
                       >
                           SİPARİŞİ ONAYLA
                       </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Option Modal */}
      {optionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center animate-fadeIn p-0">
              <div className="bg-white w-full max-w-lg p-0 flex flex-col max-h-[90vh] border-t-4 border-black">
                  <div className="p-6 flex justify-between items-start bg-gray-50 border-b border-black">
                      <div>
                          <h3 className="font-black text-xl uppercase tracking-tight leading-tight">{optionModal.product.name}</h3>
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 mt-2">SEÇENEKLERİ DÜZENLE</p>
                      </div>
                      <button onClick={() => setOptionModal(null)} className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                      {optionModal.product.options.map((opt, idx) => {
                          const isSelected = optionModal.selected.some(o => o.name === opt.name);
                          const basePrice = parseFloat(optionModal.product.price);
                          const extraPrice = parseFloat(opt.price_change);
                          const totalPrice = basePrice + extraPrice;

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
                                  className={`p-5 text-left flex justify-between items-center transition-all border-2
                                      ${isSelected 
                                        ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
                              >
                                  <span className="font-black text-xs uppercase tracking-widest">{opt.name}</span>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-xs block">
                                        {opt.price_change > 0 ? `+₺${extraPrice.toFixed(2)}` : 'ÜCRETSİZ'}
                                    </span>
                                  </div>
                              </button>
                          );
                      })}
                  </div>

                  <button 
                      onClick={() => {
                          addToCart(optionModal.product, optionModal.selected);
                          setOptionModal(null);
                      }}
                      className="w-full py-6 bg-black text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-gray-900 transition-all border-t-2 border-white"
                  >
                      EKLE (+₺{optionModal.selected.reduce((a, b) => a + b.price_change, 0)})
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}
