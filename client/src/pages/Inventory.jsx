import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function Inventory() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { showNotification } = useNotification();
  
  // Category Edit State
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null); 
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    is_available: true,
    image_url: '',
    options: [] 
  });
  
  // ... (useEffects and fetch functions remain same, omitted for brevity if using replace_file_content but here I need to be careful not to delete them if I'm replacing a chunk. I will target specific blocks to avoid deleting standard logic)
  
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
      showNotification({ title: 'HATA', message: 'Kategori eklenemedi', type: 'error' });
    }
  };

  const handleUpdateCategory = async (e) => {
      e.preventDefault();
      if (!editingCategory || !editCategoryName.trim()) return;
      
      try {
          await api.put(`/api/categories/${editingCategory.id}`, { name: editCategoryName });
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          fetchCategories();
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Kategori güncellenemedi', type: 'error' });
      }
  };

  const handleDeleteCategory = async (e, id) => {
      e.stopPropagation(); // Prevent selection
      const confirmed = await showNotification({ 
        title: 'KATEGORİYİ SİL', 
        message: 'Bu kategoriyi ve içindeki ürünleri silmek istediğinize emin misiniz?', 
        type: 'confirm' 
      });
      if (!confirmed) return;
      
      try {
          await api.delete(`/api/categories/${id}`);
          // If selected was deleted, clear selection
          if (selectedCategory?.id === id) setSelectedCategory(null);
          fetchCategories();
      } catch (err) {
          alert('Kategori silinemedi');
      }
  };

  const openEditCategoryModal = (e, cat) => {
      e.stopPropagation();
      setEditingCategory(cat);
      setEditCategoryName(cat.name);
      setIsCategoryModalOpen(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      showNotification({ title: 'UYARI', message: 'Önce bir kategori seçmelisiniz', type: 'info' });
      return;
    }
    
    try {
      if (editingProductId) {
        // UPDATE existing product
        await api.put(`/api/products/${editingProductId}`, {
          ...formData,
          category_id: selectedCategory.id,
          price: parseFloat(formData.price)
        });
      } else {
        // CREATE new product
        await api.post('/api/products', {
          ...formData,
          category_id: selectedCategory.id,
          price: parseFloat(formData.price)
        });
      }
      
      setIsProductModalOpen(false);
      setEditingProductId(null); // Reset editing state
      setFormData({ name: '', price: '', description: '', is_available: true, image_url: '', options: [] });
      fetchProducts(selectedCategory.id);
    } catch (err) {
      showNotification({ 
        title: 'HATA', 
        message: editingProductId ? 'Ürün güncellenemedi' : 'Ürün eklenemedi', 
        type: 'error' 
      });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
        const res = await api.post('/api/products/upload', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData({ ...formData, image_url: res.data.imageUrl });
    } catch (err) {
        showNotification({ title: 'HATA', message: 'Fotoğraf yüklenemedi', type: 'error' });
        console.error(err);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || '',
      is_available: product.is_available,
      image_url: product.image_url || '',
      options: product.options || [] // Load existing options
    });
    setIsProductModalOpen(true);
  };

  const handleToggleStatus = async (product) => {
    try {
      await api.put(`/api/products/${product.id}`, {
        ...product, // Send other fields if needed by backend, usually backend handles partial updates or we send full object
        is_available: !product.is_available
      });
      // Refresh list to show new status
      fetchProducts(selectedCategory.id);
    } catch (err) {
      console.error('Durum değiştirilemedi', err);
      showNotification({ title: 'HATA', message: 'Durum güncellenemedi', type: 'error' });
    }
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = await showNotification({ 
      title: 'ÜRÜNÜ SİL', 
      message: 'Bu ürünü silmek istediğinize emin misiniz?', 
      type: 'confirm' 
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts(selectedCategory.id);
    } catch (err) {
      showNotification({ title: 'HATA', message: 'Ürün silinemedi', type: 'error' });
    }
  };

  const handleMoveCategory = async (e, index, direction) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
    setCategories(newCats);

    const updates = [];
    newCats.forEach((cat, idx) => {
        if (cat.rank !== idx) {
            updates.push({ id: cat.id, rank: idx, name: cat.name });
        }
    });

    try {
        await Promise.all(updates.map(u => api.put(`/api/categories/${u.id}`, { name: u.name, rank: u.rank })));
        const updatedCats = newCats.map((c, i) => ({ ...c, rank: i }));
        setCategories(updatedCats);
    } catch (err) {
        console.error('Sıralama hatası:', err);
        showNotification({ title: 'HATA', message: 'Sıralama kaydedilemedi', type: 'error' });
        fetchCategories();
    }
  };

  const handleMoveProduct = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;

    const newProds = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newProds[index], newProds[targetIndex]] = [newProds[targetIndex], newProds[index]];
    setProducts(newProds);

    const updates = [];
    newProds.forEach((prod, idx) => {
        if (prod.rank !== idx) {
            updates.push({ id: prod.id, rank: idx });
        }
    });

    try {
        await Promise.all(updates.map(u => api.put(`/api/products/${u.id}`, { rank: u.rank })));
        const updatedProds = newProds.map((p, i) => ({ ...p, rank: i }));
        setProducts(updatedProds);
    } catch (err) {
        console.error('Sıralama hatası:', err);
        showNotification({ title: 'HATA', message: 'Sıralama kaydedilemedi', type: 'error' });
        fetchProducts(selectedCategory.id);
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
               className={`p-3 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition-colors flex justify-between items-center group ${
                 selectedCategory?.id === cat.id ? 'bg-black text-white hover:bg-black' : ''
               }`}
             >
                <div className="font-mono text-sm uppercase">{cat.name}</div>
                <div className={`flex gap-1 ${selectedCategory?.id === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <div className="flex flex-col mr-1">
                        <button 
                            onClick={(e) => handleMoveCategory(e, categories.indexOf(cat), 'up')}
                            disabled={categories.indexOf(cat) === 0}
                            className={`p-0.5 hover:bg-white/20 rounded disabled:opacity-30 ${selectedCategory?.id === cat.id ? 'text-white' : 'text-black'}`}
                        >
                            <ArrowUp size={10} />
                        </button>
                        <button 
                            onClick={(e) => handleMoveCategory(e, categories.indexOf(cat), 'down')}
                            disabled={categories.indexOf(cat) === categories.length - 1}
                            className={`p-0.5 hover:bg-white/20 rounded disabled:opacity-30 ${selectedCategory?.id === cat.id ? 'text-white' : 'text-black'}`}
                        >
                            <ArrowDown size={10} />
                        </button>
                    </div>
                    <button 
                        onClick={(e) => openEditCategoryModal(e, cat)}
                        className={`p-1 hover:bg-white/20 rounded ${selectedCategory?.id === cat.id ? 'text-white' : 'text-black'}`}
                    >
                        <Pencil size={14} />
                    </button>
                    <button 
                        onClick={(e) => handleDeleteCategory(e, cat.id)}
                        className={`p-1 hover:bg-red-500 hover:text-white rounded ${selectedCategory?.id === cat.id ? 'text-white' : 'text-black'}`}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
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
                onClick={() => {
                  setEditingProductId(null);
                  setFormData({ name: '', price: '', description: '', is_available: true, image_url: '', options: [] });
                  setIsProductModalOpen(true);
                }}
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
                    <th className="p-3 border-b border-r border-black font-bold text-xs w-16 text-center">FOTO</th>
                    <th className="p-3 border-b border-r border-black font-bold text-xs uppercase">Ürün Adı / Açıklama</th>
                    <th className="p-3 border-b border-r border-black font-bold text-xs w-24 text-right">Fiyat</th>
                    <th className="p-3 border-b border-r border-black font-bold text-xs w-20 text-center">Aktif</th>
                    <th className="p-3 border-b border-black font-bold text-xs w-40 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <td className="p-3 border-r border-black text-center">
                         {p.image_url ? (
                           <img 
                            src={p.image_url.startsWith('http') ? p.image_url : `${api.defaults.baseURL}${p.image_url}`} 
                            alt={p.name} 
                            className="w-10 h-10 object-cover border border-black inline-block"
                           />
                         ) : (
                           <div className="w-10 h-10 border border-black bg-gray-100 flex items-center justify-center text-[8px] font-mono text-gray-400">NO IMG</div>
                         )}
                      </td>
                      <td className="p-3 border-r border-black">
                        <div className="font-bold text-sm uppercase">{p.name}</div>
                        {p.description && <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{p.description}</div>}
                      </td>
                      <td className="p-3 border-r border-black font-mono text-sm text-right">₺{parseFloat(p.price).toFixed(2)}</td>
                      <td className="p-3 border-r border-black text-center">
                        <input 
                          type="checkbox" 
                          checked={p.is_available} 
                          onChange={() => handleToggleStatus(p)}
                          className="accent-black cursor-pointer w-4 h-4" 
                        />
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <div className="flex flex-col gap-0.5 border border-gray-200 rounded p-0.5">
                            <button 
                                onClick={() => handleMoveProduct(products.indexOf(p), 'up')}
                                disabled={products.indexOf(p) === 0}
                                className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 text-black"
                            >
                                <ArrowUp size={12} />
                            </button>
                            <button 
                                onClick={() => handleMoveProduct(products.indexOf(p), 'down')}
                                disabled={products.indexOf(p) === products.length - 1}
                                className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 text-black"
                            >
                                <ArrowDown size={12} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button 
                            onClick={() => handleEditProduct(p)}
                            className="text-xs underline hover:no-underline font-bold"
                            >
                            DÜZENLE
                            </button> 
                            <span className="text-gray-300">|</span>
                            <button 
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-xs underline hover:no-underline text-gray-500 hover:text-black font-bold"
                            >
                            SİL
                            </button>
                        </div>
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
        title={editingProductId ? "ÜRÜNÜ DÜZENLE" : "YENİ ÜRÜN EKLE"}
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
            <label className="block text-xs font-bold mb-1 uppercase">Açıklama</label>
            <textarea 
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none resize-none h-20"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Ürün açıklaması..."
            />
          </div>

          <div>
             <label className="block text-xs font-bold mb-1 uppercase">Ürün Fotoğrafı</label>
             <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  placeholder="Fotoğraf URL..."
                  className="flex-1 border border-black p-2 text-sm focus:bg-gray-50 outline-none"
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                />
                <label className="bg-black text-white px-4 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-gray-800 transition-colors flex items-center">
                  YÜKLE
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
             </div>
             {formData.image_url && (
               <div className="border border-black p-2 bg-gray-50 flex items-center justify-center">
                  <img 
                    src={formData.image_url.startsWith('http') ? formData.image_url : `${api.defaults.baseURL}${formData.image_url}`} 
                    className="max-h-32 object-contain" 
                    alt="Önizleme"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, image_url: ''})}
                    className="ml-4 text-xs font-bold text-red-600 underline"
                  >
                    KALDIR
                  </button>
               </div>
             )}
          </div>

          {/* Options Section */}
          <div className="border border-black p-4 bg-gray-50">
             <label className="block text-xs font-bold mb-2 uppercase">Varyantlar / Seçenekler</label>
             <div className="flex flex-col gap-2 mb-2 max-h-40 overflow-y-auto">
                 {formData.options.map((opt, idx) => (
                     <div key={idx} className="flex gap-2 items-center">
                         <input 
                             type="text" 
                             placeholder="Seçenek Adı (örn: 1.5 Porsiyon)"
                             className="flex-1 border border-gray-300 p-1 text-xs outline-none focus:border-black"
                             value={opt.name}
                             onChange={(e) => {
                                 const newOpts = [...formData.options];
                                 newOpts[idx].name = e.target.value;
                                 setFormData({...formData, options: newOpts});
                             }}
                         />
                         <input 
                             type="number" 
                             placeholder="Fiyat Farkı (₺)"
                             className="w-24 border border-gray-300 p-1 text-xs outline-none focus:border-black"
                             value={opt.price_change}
                             onChange={(e) => {
                                 const newOpts = [...formData.options];
                                 newOpts[idx].price_change = parseFloat(e.target.value) || 0;
                                 setFormData({...formData, options: newOpts});
                             }}
                         />
                         <button 
                             type="button" 
                             onClick={() => {
                                 const newOpts = formData.options.filter((_, i) => i !== idx);
                                 setFormData({...formData, options: newOpts});
                             }}
                             className="text-red-500 hover:text-red-700"
                         >
                             <Trash2 size={14}/>
                         </button>
                     </div>
                 ))}
             </div>
             <button 
                type="button"
                onClick={() => setFormData({...formData, options: [...formData.options, { name: '', price_change: 0 }]})}
                className="text-xs bg-black text-white px-2 py-1 font-bold uppercase hover:bg-gray-700"
             >
                 + SeÇenek Ekle
             </button>
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

      {/* Category Edit Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="KATEGORİ DÜZENLE"
      >
          <form onSubmit={handleUpdateCategory} className="flex flex-col gap-4">
              <div>
                  <label className="block text-xs font-bold mb-1 uppercase">Kategori Adı</label>
                  <input
                      type="text"
                      className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                  />
              </div>
              <button 
                  type="submit" 
                  className="bg-black text-white p-3 font-bold uppercase tracking-widest hover:bg-gray-800"
              >
                  GÜNCELLE
              </button>
          </form>
      </Modal>
    </div>
  );
}
