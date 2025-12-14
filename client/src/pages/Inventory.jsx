import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';

export default function Inventory() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    is_available: true
  });
  
  // Auth Token automatically handled by api interceptor

  // Fetch Categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch Products when Category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory.id);
    } else {
      setProducts([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !selectedCategory) {
        setSelectedCategory(res.data[0]);
      }
    } catch (err) {
      console.error('Kategoriler alınamadı:', err);
    }
  };

  const fetchProducts = async (categoryId) => {
    try {
      const res = await api.get(`/api/products?category_id=${categoryId}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Ürünler alınamadı:', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await api.post('/api/categories', { name: newCategoryName });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      alert('Kategori eklenemedi');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return alert('Önce bir kategori seçmelisiniz');
    
    try {
      await api.post('/api/products', {
        ...formData,
        category_id: selectedCategory.id,
        price: parseFloat(formData.price)
      });
      
      setIsProductModalOpen(false);
      setFormData({ name: '', price: '', description: '', is_available: true });
      fetchProducts(selectedCategory.id);
    } catch (err) {
      alert('Ürün eklenemedi');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Emin misiniz?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts(selectedCategory.id);
    } catch (err) {
      alert('Ürün silinemedi');
    }
  };

  return (
    <div className="flex h-full p-8 gap-8">
      {/* Sidebar: Categories */}
      <div className="w-1/4 flex flex-col gap-4">
        <h2 className="font-bold uppercase tracking-widest border-b border-black pb-2">KATEGORİLER</h2>
        
        {/* Add Category */}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="YENİ KAT..."
            className="flex-1 border border-black p-2 text-xs focus:bg-gray-100 outline-none placeholder:text-gray-400"
          />
          <button 
            onClick={handleAddCategory}
            className="bg-black text-white px-3 font-bold hover:bg-gray-800"
          >
            +
          </button>
        </div>

        {/* Categories List */}
        <div className="border border-black flex-1 overflow-y-auto">
           {categories.map(cat => (
             <div 
               key={cat.id}
               onClick={() => setSelectedCategory(cat)}
               className={`p-3 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors ${
                 selectedCategory?.id === cat.id ? 'bg-black text-white hover:bg-black' : ''
               }`}
             >
                <div className="font-mono text-sm uppercase">{cat.name}</div>
             </div>
           ))}
           {categories.length === 0 && (
             <div className="p-4 text-xs text-gray-400 text-center">KATEGORİ YOK</div>
           )}
        </div>
      </div>

      {/* Main Content: Products */}
      <div className="flex-1 flex flex-col gap-4">
        {selectedCategory ? (
          <>
            <div className="flex justify-between items-center border-b border-black pb-2">
              <h2 className="font-bold uppercase tracking-widest">
                {selectedCategory.name} <span className="text-gray-400 text-xs ml-2">({products.length} ÜRÜN)</span>
              </h2>
              <button 
                onClick={() => setIsProductModalOpen(true)}
                className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-colors"
              >
                YENİ ÜRÜN EKLE
              </button>
            </div>

            {/* Products Table */}
            <div className="border border-black flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 border-b border-r border-black font-bold text-xs w-1/2">ÜRÜN ADI</th>
                    <th className="p-3 border-b border-r border-black font-bold text-xs w-1/4">FİYAT</th>
                    <th className="p-3 border-b border-r border-black font-bold text-xs w-1/6 text-center">AKTİF</th>
                    <th className="p-3 border-b border-black font-bold text-xs text-center">İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <td className="p-3 border-r border-black font-mono text-sm">{p.name}</td>
                      <td className="p-3 border-r border-black font-mono text-sm">₺{p.price}</td>
                      <td className="p-3 border-r border-black text-center">
                        <input type="checkbox" checked={p.is_available} readOnly className="accent-black" />
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button className="text-xs underline hover:no-underline">DÜZENLE</button> 
                        <span className="text-gray-300">|</span>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-xs underline hover:no-underline text-gray-500 hover:text-black"
                        >
                          SİL
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400 text-xs italic">
                        BU KATEGORİDE ÜRÜN YOK
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
           <div className="flex-1 border border-black border-dashed flex items-center justify-center text-gray-400 font-mono text-sm">
             ÜRÜN YÖNETİMİ İÇİN BİR KATEGORİ SEÇİN
           </div>
        )}
      </div>

      {/* Product Modal */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title="YENİ ÜRÜN EKLE"
      >
        <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Ürün Adı</label>
            <input 
              type="text" 
              required
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Fiyat (₺)</label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>

          <div>
             <label className="flex items-center gap-2 cursor-pointer">
               <input 
                 type="checkbox" 
                 className="accent-black w-4 h-4"
                 checked={formData.is_available}
                 onChange={e => setFormData({...formData, is_available: e.target.checked})}
               />
               <span className="text-xs font-bold uppercase">Satışa Uygun</span>
             </label>
          </div>

          <button 
            type="submit" 
            className="bg-black text-white p-3 font-bold uppercase tracking-widest hover:bg-gray-800 mt-4"
          >
            KAYDET
          </button>
        </form>
      </Modal>
    </div>
  );
}
