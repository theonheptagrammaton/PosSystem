import { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingCart, User, Plus, Minus, Trash2 } from 'lucide-react';

export default function Pos() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  
  // Initial Load: Check for stored branch or fetch branches
  useEffect(() => {
    const storedBranch = localStorage.getItem('pos_selected_branch');
    if (storedBranch) {
      setSelectedBranch(JSON.parse(storedBranch));
    }
    fetchBranches();
  }, []);

  // Fetch Data when branch is selected
  useEffect(() => {
    if (selectedBranch) {
      fetchCategories();
      // Fetch all products initially or per category
      // For simplicity, let's fetch all products or filter by category when selected
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Şubeler alınamadı', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !selectedCategory) {
        setSelectedCategory(res.data[0]);
      }
    } catch (err) {
       console.error('Kategoriler alınamadı', err);
    }
  };

  const fetchProducts = async (catId) => {
    try {
      const res = await api.get(`/api/products?category_id=${catId}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Ürünler alınamadı', err);
    }
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('pos_selected_branch', JSON.stringify(branch));
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Sepet boş');
    if (!confirm('Satışı tamamla?')) return;

    try {
      // Create backend order
      const payload = {
        tenant_id: selectedBranch.tenant_id, // This might need to come from user context actually, but branches have tenant_id too
        table_no: 'POS-TERMINAL', // Dummy for POS
        total_amount: calculateTotal(),
        items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity
        }))
      };
      
      await api.post('/api/orders', payload);
      setCart([]);
      alert('Satış Başarılı');
    } catch (err) {
      console.error(err);
      alert('Satış Hatası');
    }
  };

  // 1. Branch Selection View
  if (!selectedBranch) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold uppercase mb-8 tracking-widest">Kasa / Şube Seçimi</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {branches.map(branch => (
            <button 
              key={branch.id}
              onClick={() => handleBranchSelect(branch)}
              className="border-2 border-black p-8 hover:bg-black hover:text-white transition-colors flex flex-col items-center gap-4 group"
            >
               <User size={32} strokeWidth={1.5} />
               <span className="font-bold text-xl uppercase tracking-widest">{branch.name}</span>
               {branch.address && <span className="text-xs font-mono text-gray-500 group-hover:text-gray-300">{branch.address}</span>}
            </button>
          ))}
        </div>
        {branches.length === 0 && (
           <div className="text-gray-400">Önce "Şubeler" menüsünden şube ekleyiniz.</div>
        )}
      </div>
    );
  }

  // 2. POS Interface
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Categories */}
      <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-4 font-bold border-b border-gray-200">KATEGORİLER</div>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className={`p-4 text-left hover:bg-black hover:text-white transition-colors uppercase text-sm font-medium ${selectedCategory?.id === cat.id ? 'bg-black text-white' : ''}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Middle: Products */}
      <div className="flex-1 p-4 bg-white overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
           <h2 className="font-bold uppercase text-lg">{selectedCategory?.name || 'Ürünler'}</h2>
           <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">Şube: {selectedBranch.name}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div 
              key={p.id}
              onClick={() => addToCart(p)} 
              className="border border-gray-200 p-4 cursor-pointer hover:border-black hover:shadow-lg transition-all flex flex-col justify-between h-32 bg-white"
            >
               <div className="font-bold text-sm uppercase leading-tight line-clamp-2">{p.name}</div>
               <div className="font-mono text-lg font-bold">₺{p.price}</div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-10">Bu kategoride ürün yok</div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 border-l border-black bg-white flex flex-col">
        <div className="p-4 border-b border-black bg-black text-white flex justify-between items-center">
          <span className="font-bold tracking-widest">SEPET</span>
          <ShoppingCart size={18} />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex flex-col border-b border-gray-100 pb-2">
              <div className="flex justify-between items-start mb-2">
                 <span className="font-bold text-sm uppercase w-2/3">{item.name}</span>
                 <span className="font-mono">₺{(item.price * item.quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <div className="flex items-center border border-gray-300">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-100"><Minus size={14}/></button>
                    <span className="w-8 text-center text-sm font-mono">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-100"><Plus size={14}/></button>
                 </div>
                 <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-red-500 hover:text-red-700">
                   <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">Sepet boş</div>}
        </div>

        <div className="p-4 border-t border-black bg-gray-50">
          <div className="flex justify-between items-center mb-4 text-xl font-bold font-mono">
            <span>TOPLAM</span>
            <span>₺{calculateTotal().toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            ÖDEME AL
          </button>
          
          <button 
             onClick={() => { setSelectedBranch(null); localStorage.removeItem('pos_selected_branch'); }}
             className="w-full mt-2 text-xs underline text-gray-500 hover:text-black"
          >
             Şube Değiştir
          </button>
        </div>
      </div>
    </div>
  );
}
