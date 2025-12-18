import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';

export default function MobileMenu() {
  const { tenantId, branchId, tableId } = useParams(); // Using tableId as table_no
  const [data, setData] = useState({ categories: [], products: [] });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/public/menu/${tenantId}`);
        setData(res.data);
        // Expand first category by default
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

  const toggleCategory = (id) => {
    setExpandedCategory(prev => prev === id ? null : id);
  };

  const updateCart = (productId, delta) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      const newCart = { ...prev };
      if (newQty === 0) {
        delete newCart[productId];
      } else {
        newCart[productId] = newQty;
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [productId, qty]) => {
      const product = data.products.find(p => p.id === parseInt(productId));
      return total + (product ? parseFloat(product.price) * qty : 0);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (!window.confirm('Siparişi onaylıyor musunuz?')) return;

    const items = Object.entries(cart).map(([productId, quantity]) => {
      const product = data.products.find(p => p.id === parseInt(productId));
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity
      };
    });

    const payload = {
      tenant_id: tenantId,
      branch_id: branchId,
      table_no: `MASA-${tableId}`,
      total_amount: calculateTotal(),
      items: items
    };

    try {
      await api.post('/api/orders', payload);
      setOrderPlaced(true);
      setCart({});
    } catch (err) {
      alert('Sipariş oluşturulurken bir hata oluştu');
      console.error(err);
    }
  };

  if (orderPlaced) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center p-8 z-50 animate-fadeIn text-center">
        <div className="border-4 border-white p-10 bg-black">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-4">SİPARİŞİNİZ ALINDI</h1>
          <p className="font-mono text-xs text-gray-500 mb-8">Masa No: {tableId}</p>
          <button 
            onClick={() => setOrderPlaced(false)}
            className="bg-white text-black px-10 py-5 font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors"
          >
            YENİ SİPARİŞ
          </button>
        </div>
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
  const cartItemCount = Object.keys(cart).length;

  return (
    <div className="bg-white min-h-screen pb-24">
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
                          <button 
                            onClick={() => updateCart(product.id, -1)}
                            className="p-1 text-black hover:opacity-50 transition-opacity"
                          >
                            <Minus size={22} strokeWidth={3} />
                          </button>
                          
                          <div className="font-mono font-bold w-6 text-center text-black text-lg">
                            {cart[product.id] || 0}
                          </div>

                          <button 
                            onClick={() => updateCart(product.id, 1)}
                            className="p-1 text-black hover:opacity-50 transition-opacity"
                          >
                            <Plus size={22} strokeWidth={3} />
                          </button>
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
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 flex justify-between items-center z-50 border-t border-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-400 font-mono tracking-widest">TOPLAM</span>
             <span className="text-xl font-bold font-mono tracking-tighter">₺{totalAmount.toFixed(2)}</span>
           </div>
           
           <button 
             onClick={handlePlaceOrder}
             className="bg-white text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-xs sm:text-sm"
           >
             SİPARİŞİ TAMAMLA
           </button>
        </div>
      )}
    </div>
  );
}
