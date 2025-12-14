import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import Modal from '../../components/Modal';

export default function PosTerminal() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  
  // Fetch Branch Info
  useEffect(() => {
    const fetchBranch = async () => {
        try {
            // Need a single branch endpoint or filter from all
            // Ideally backend should have GET /api/branches/:id, but for now filtering from all if not exists
            // Now backend filters branches based on user role. 
            // If we are cashier, res.data will only contain our branch.
            const res = await api.get('/api/branches');
            const b = res.data.find(item => item.id === parseInt(branchId));
            
            if (b) setBranch(b);
            else {
                // If not found in the list, but we have an ID, it means unauthorized or invalid ID
                alert('Bu şubeye erişim yetkiniz yok veya şube bulunamadı.');
                window.close();
            }
        } catch (err) {
            console.error(err);
        }
    };
    fetchBranch();
  }, [branchId]);

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
        try {
            const res = await api.get('/api/categories');
            setCategories(res.data);
            if(res.data.length > 0) setSelectedCategory(res.data[0]);
        } catch (err) {
            console.error(err);
        }
    };
    fetchCats();
  }, []);

  // Fetch Products
  useEffect(() => {
    if (selectedCategory) {
        const fetchProds = async () => {
            try {
                const res = await api.get(`/api/products?category_id=${selectedCategory.id}`);
                setProducts(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProds();
    }
  }, [selectedCategory]);

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
      const payload = {
        tenant_id: branch.tenant_id,
        table_no: `POS-${branch.name.toUpperCase()}`,
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

  if (!branch) return <div className="p-10 font-mono">Şube Bilgisi Yükleniyor...</div>;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 bg-black text-white flex items-center justify-between px-6 flex-shrink-0">
         <div className="flex items-center gap-4">
             <button onClick={() => window.close()} className="hover:bg-white hover:text-black p-2 transition-colors border border-transparent hover:border-white">
                 <ArrowLeft size={20} />
             </button>
             <h1 className="text-xl font-bold uppercase tracking-widest">POS TERMİNALİ: <span className="text-gray-400">{branch.name}</span></h1>
         </div>
         <div className="font-mono text-xs">
            {new Date().toLocaleDateString()}
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Categories */}
        <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
            {categories.map(cat => (
            <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`p-6 text-left hover:bg-black hover:text-white transition-colors uppercase text-sm font-bold border-b border-gray-200 ${selectedCategory?.id === cat.id ? 'bg-black text-white' : ''}`}
            >
                {cat.name}
            </button>
            ))}
        </div>

        {/* Products */}
        <div className="flex-1 p-6 bg-white overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
                <div 
                key={p.id}
                onClick={() => addToCart(p)} 
                className="border-2 border-gray-100 p-4 cursor-pointer hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all flex flex-col justify-between h-40 group"
                >
                <div className="font-bold text-lg uppercase leading-tight line-clamp-2 group-hover:underline">{p.name}</div>
                <div className="font-mono text-xl font-bold mt-2">₺{p.price}</div>
                </div>
            ))}
            </div>
        </div>

        {/* Cart */}
        <div className="w-96 border-l border-black bg-white flex flex-col shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.1)]">
            <div className="p-6 border-b border-black bg-gray-50 flex justify-between items-center">
                <span className="font-bold tracking-widest text-lg">SEPET</span>
                <ShoppingCart size={24} />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.map(item => (
                <div key={item.id} className="flex flex-col border-b border-gray-100 pb-4">
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm uppercase w-2/3">{item.name}</span>
                    <span className="font-mono font-bold">₺{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center border border-black">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:bg-black hover:text-white"><Minus size={16}/></button>
                        <span className="w-10 text-center text-sm font-mono font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:bg-black hover:text-white"><Plus size={16}/></button>
                    </div>
                </div>
                </div>
            ))}
            </div>

            <div className="p-6 border-t font-mono border-black bg-black text-white">
            <div className="flex justify-between items-center mb-6 text-2xl font-bold">
                <span>TOPLAM</span>
                <span>₺{calculateTotal().toFixed(2)}</span>
            </div>
            
            <button 
                onClick={handleCheckout}
                className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors border-2 border-transparent hover:border-white"
            >
                ÖDEME AL
            </button>
            </div>
        </div>
      </div>
    </div>
  );
}
