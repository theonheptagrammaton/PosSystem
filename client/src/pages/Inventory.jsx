import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Pencil, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function Inventory() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  
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
  
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await fetchCategories();
    setLoading(false);
  };

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
      showNotification({ title: 'BAŞARILI', message: 'Kategori Eklendi', type: 'info' });
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
      e.stopPropagation(); 
      const confirmed = await showNotification({ 
        title: 'KATEGORİYİ SİL', 
        message: 'Bu kategoriyi ve içindeki ürünleri silmek istediğinize emin misiniz?', 
        type: 'confirm' 
      });
      if (!confirmed) return;
      
      try {
          await api.delete(`/api/categories/${id}`);
          if (selectedCategory?.id === id) setSelectedCategory(null);
          fetchCategories();
      } catch (err) {
          showNotification({ title: 'HATA', message: 'Kategori silinemedi', type: 'error' });
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
        await api.put(`/api/products/${editingProductId}`, {
          ...formData,
          category_id: selectedCategory.id,
          price: parseFloat(formData.price)
        });
      } else {
        await api.post('/api/products', {
          ...formData,
          category_id: selectedCategory.id,
          price: parseFloat(formData.price)
        });
      }
      
      setIsProductModalOpen(false);
      setEditingProductId(null); 
      setFormData({ name: '', price: '', description: '', is_available: true, image_url: '', options: [] });
      fetchProducts(selectedCategory.id);
      showNotification({ title: 'BAŞARILI', message: editingProductId ? 'Ürün güncellendi' : 'Ürün eklendi', type: 'info' });
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
      options: product.options || [] 
    });
    setIsProductModalOpen(true);
  };

  const handleToggleStatus = async (product) => {
    try {
      await api.put(`/api/products/${product.id}`, {
        ...product, 
        is_available: !product.is_available
      });
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
        fetchCategories(); // Refresh to sync
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
        fetchProducts(selectedCategory.id); // Refresh to sync
    } catch (err) {
        console.error('Sıralama hatası:', err);
        showNotification({ title: 'HATA', message: 'Sıralama kaydedilemedi', type: 'error' });
        fetchProducts(selectedCategory.id);
    }
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <div className="spinner"></div>
          </div>
      );
  }

  return (
    <div className="flex h-full p-8 gap-8 bg-white font-sans text-black">
      {/* Sidebar: Categories */}
      <div className="w-80 flex flex-col gap-4 border-r-2 border-dashed border-gray-200 pr-8">
        <h2 className="font-black uppercase tracking-widest text-lg border-b-2 border-black pb-4">KATEGORİLER</h2>
        
        {/* Add Category */}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="YENİ KATEGORİ ADI..."
            className="flex-1 border-2 border-black p-3 text-xs focus:bg-gray-50 outline-none placeholder:text-gray-400 font-bold uppercase transition-all"
          />
          <button 
            onClick={handleAddCategory}
            className="bg-black text-white px-4 font-black hover:bg-white hover:text-black border-2 border-black transition-all active:scale-95"
          >
            <Plus size={16}/>
          </button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
           {categories.map(cat => (
             <div 
               key={cat.id}
               onClick={() => setSelectedCategory(cat)}
               className={`p-4 cursor-pointer border-2 transition-all flex flex-col gap-3 group relative overflow-hidden
                 ${selectedCategory?.id === cat.id 
                    ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'bg-white text-black border-gray-200 hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'}`}
             >
                <div className="flex justify-between items-center w-full z-10 relative">
                    <div className="font-black text-sm uppercase tracking-wider truncate pr-2">{cat.name}</div>
                    
                    <div className={`flex gap-3 items-center ${selectedCategory?.id === cat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                        <div className="flex gap-1">
                            <button 
                                onClick={(e) => handleMoveCategory(e, categories.indexOf(cat), 'up')}
                                disabled={categories.indexOf(cat) === 0}
                                className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${selectedCategory?.id === cat.id ? 'text-white hover:bg-gray-800' : 'text-black hover:bg-gray-100'}`}
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button 
                                onClick={(e) => handleMoveCategory(e, categories.indexOf(cat), 'down')}
                                disabled={categories.indexOf(cat) === categories.length - 1}
                                className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${selectedCategory?.id === cat.id ? 'text-white hover:bg-gray-800' : 'text-black hover:bg-gray-100'}`}
                            >
                                <ArrowDown size={16} />
                            </button>
                        </div>
                        <div className="h-6 w-px bg-current opacity-20"></div>
                        <button 
                            onClick={(e) => openEditCategoryModal(e, cat)}
                            className={`p-1.5 hover:scale-110 transition-transform ${selectedCategory?.id === cat.id ? 'text-white' : 'text-black'}`}
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={(e) => handleDeleteCategory(e, cat.id)}
                            className={`p-1.5 transition-colors ${selectedCategory?.id === cat.id ? 'text-white hover:text-red-400' : 'text-black hover:text-red-600'}`}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Visual Indicator for Selected State */}
                {selectedCategory?.id === cat.id && (
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                        <div className="w-16 h-16 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>
                    </div>
                )}
             </div>
           ))}
           {categories.length === 0 && (
             <div className="p-8 text-xs text-gray-400 text-center font-bold uppercase italic border-2 border-dashed border-gray-200">KATEGORİ BULUNAMADI</div>
           )}
        </div>
      </div>

      {/* Main Content: Products */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {selectedCategory ? (
          <>
            <div className="flex justify-between items-center border-b-2 border-black pb-4">
              <h2 className="font-black uppercase tracking-widest text-lg truncate">
                {selectedCategory.name} <span className="text-gray-400 text-xs ml-2 font-medium">({products.length} ÜRÜN)</span>
              </h2>
              <button 
                onClick={() => {
                  setEditingProductId(null);
                  setFormData({ name: '', price: '', description: '', is_available: true, image_url: '', options: [] });
                  setIsProductModalOpen(true);
                }}
                className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                + YENİ ÜRÜN
              </button>
            </div>

            {/* Products Table */}
            <div className="border-2 border-black flex-1 overflow-y-auto shadow-lg bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-black text-white sticky top-0 z-10">
                  <tr>
                    <th className="p-4 border-r border-gray-800 font-bold text-xs w-20 text-center tracking-widest">FOTO</th>
                    <th className="p-4 border-r border-gray-800 font-bold text-xs uppercase tracking-widest">ÜRÜN DETAYI</th>
                    <th className="p-4 border-r border-gray-800 font-bold text-xs w-32 text-right tracking-widest">FİYAT</th>
                    <th className="p-4 border-r border-gray-800 font-bold text-xs w-24 text-center tracking-widest">DURUM</th>
                    <th className="p-4 font-bold text-xs w-48 text-center tracking-widest">İŞLEM</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group">
                      <td className="p-4 border-r border-gray-100 text-center align-top">
                         {p.image_url ? (
                           <img 
                            src={p.image_url.startsWith('http') ? p.image_url : `${api.defaults.baseURL}${p.image_url}`} 
                            alt={p.name} 
                            className="w-12 h-12 object-cover border-2 border-gray-200 inline-block transition-all"
                           />
                         ) : (
                           <div className="w-12 h-12 border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] font-black text-gray-400">NO IMG</div>
                         )}
                      </td>
                      <td className="p-4 border-r border-gray-100 align-top">
                        <div className="font-black text-sm uppercase tracking-wide">{p.name}</div>
                        {p.description && <div className="text-[10px] text-gray-500 mt-1 font-medium bg-gray-100 p-1 inline-block uppercase break-words">{p.description}</div>}
                        {p.options && p.options.length > 0 && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                                {p.options.map((o, i) => (
                                    <span key={i} className="text-[9px] border border-black px-1.5 py-0.5 font-bold uppercase">{o.name}</span>
                                ))}
                            </div>
                        )}
                      </td>
                      <td className="p-4 border-r border-gray-100 font-mono text-sm text-right font-bold align-top">₺{parseFloat(p.price).toFixed(2)}</td>
                      <td className="p-4 border-r border-gray-100 text-center align-top">
                        <label className="inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={p.is_available} 
                              onChange={() => handleToggleStatus(p)}
                              className="sr-only peer"
                            />
                            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none ring-0 rounded-none peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-black"></div>
                        </label>
                      </td>
                      <td className="p-4 text-center align-top">
                        <div className="flex items-center justify-center gap-3 h-full">
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => handleMoveProduct(products.indexOf(p), 'up')}
                                    disabled={products.indexOf(p) === 0}
                                    className="p-1 hover:bg-black hover:text-white border border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black transition-colors"
                                >
                                    <ArrowUp size={10} />
                                </button>
                                <button 
                                    onClick={() => handleMoveProduct(products.indexOf(p), 'down')}
                                    disabled={products.indexOf(p) === products.length - 1}
                                    className="p-1 hover:bg-black hover:text-white border border-gray-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black transition-colors"
                                >
                                    <ArrowDown size={10} />
                                </button>
                            </div>
                            <button 
                                onClick={() => handleEditProduct(p)}
                                className="p-2 border border-black hover:bg-black hover:text-white transition-colors"
                                title="Düzenle"
                            >
                                <Pencil size={14} />
                            </button> 
                            <button 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                title="Sil"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-400 text-xs font-black uppercase tracking-widest italic">
                        BU KATEGORİDE HENÜZ ÜRÜN YOK
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
           <div className="flex-1 border-2 border-black border-dashed flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-4">
             <div className="text-4xl opacity-20 font-black">←</div>
             <div className="font-black text-sm uppercase tracking-widest">LÜTFEN BİR KATEGORİ SEÇİN</div>
           </div>
        )}
      </div>

      {/* Product Modal */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title={editingProductId ? "ÜRÜNÜ DÜZENLE" : "YENİ ÜRÜN EKLE"}
      >
        <form onSubmit={handleAddProduct} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Ürün Adı</label>
                <input 
                  type="text" 
                  required
                  className="w-full border-2 border-black p-3 text-sm font-bold focus:bg-gray-50 outline-none uppercase placeholder:text-gray-300"
                  placeholder="ÖRN: CHEESEBURGER"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Fiyat (₺)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  className="w-full border-2 border-black p-3 text-sm font-bold font-mono focus:bg-gray-50 outline-none"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Açıklama</label>
            <textarea 
              className="w-full border-2 border-black p-3 text-sm font-medium focus:bg-gray-50 outline-none resize-none h-24 uppercase placeholder:text-gray-300"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="ÜRÜN İÇERİĞİ VE DETAYLAR..."
            />
          </div>

          <div>
             <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Görsel</label>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="URL GİRİN VEYA YÜKLEYİN..."
                  className="flex-1 border-2 border-black p-3 text-xs focus:bg-gray-50 outline-none font-mono"
                  value={formData.image_url}
                  onChange={e => setFormData({...formData, image_url: e.target.value})}
                />
                <label className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase cursor-pointer hover:bg-gray-800 transition-colors flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] border-2 border-black">
                  YÜKLE
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
             </div>
             {formData.image_url && (
               <div className="mt-2 border-2 border-dashed border-gray-300 p-4 bg-gray-50 flex items-center justify-between">
                  <img 
                    src={formData.image_url.startsWith('http') ? formData.image_url : `${api.defaults.baseURL}${formData.image_url}`} 
                    className="h-16 w-16 object-cover border border-black" 
                    alt="Önizleme"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, image_url: ''})}
                    className="text-[10px] font-black text-red-600 hover:text-black uppercase tracking-widest border-b border-red-600 hover:border-black transition-colors"
                  >
                    GÖRSELİ KALDIR
                  </button>
               </div>
             )}
          </div>

          {/* Options Section */}
          <div className="border-2 border-black p-4 bg-gray-50">
             <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-2">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest">SEÇENEKLER / VARYANTLAR</label>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Müşterinin seçebileceği ekstra özellikler (Örn: Sos, Ekstra Peynir)</p>
                 </div>
                 <button 
                    type="button"
                    onClick={() => setFormData({...formData, options: [...formData.options, { name: '', price_change: 0 }]})}
                    className="text-[9px] bg-black text-white px-3 py-2 font-bold uppercase hover:bg-gray-800 transition-colors shadow-sm"
                 >
                     + SEÇENEK EKLE
                 </button>
             </div>
             
             <div className="flex flex-col gap-2">
                 {formData.options.length === 0 && (
                     <div className="text-center text-[10px] text-gray-400 font-bold uppercase py-4 border-2 border-dashed border-gray-200">
                        Henüz seçenek eklenmedi.
                     </div>
                 )}
                 {formData.options.map((opt, idx) => (
                     <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-gray-200 shadow-sm">
                         <div className="flex-1">
                             <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider block mb-1">Seçenek Adı</label>
                             <input 
                                 type="text" 
                                 placeholder="ÖRN: ACILI"
                                 className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-black font-bold uppercase"
                                 value={opt.name}
                                 onChange={(e) => {
                                     const newOpts = [...formData.options];
                                     newOpts[idx].name = e.target.value;
                                     setFormData({...formData, options: newOpts});
                                 }}
                             />
                         </div>
                         <div className="w-24">
                             <label className="text-[8px] font-black text-gray-400 uppercase tracking-wider block mb-1">Ek Ücret</label>
                             <input 
                                 type="number" 
                                 placeholder="0"
                                 className="w-full border border-gray-300 p-2 text-xs outline-none focus:border-black font-mono font-bold"
                                 value={opt.price_change}
                                 onChange={(e) => {
                                     const newOpts = [...formData.options];
                                     newOpts[idx].price_change = parseFloat(e.target.value) || 0;
                                     setFormData({...formData, options: newOpts});
                                 }}
                             />
                         </div>
                         <div className="self-end pb-1">
                             <button 
                                 type="button" 
                                 onClick={() => {
                                     const newOpts = formData.options.filter((_, i) => i !== idx);
                                     setFormData({...formData, options: newOpts});
                                 }}
                                 className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50"
                                 title="Seçeneği Sil"
                             >
                                 <Trash2 size={16}/>
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
             <input 
               type="checkbox" 
               id="is_available"
               className="w-5 h-5 accent-black cursor-pointer"
               checked={formData.is_available}
               onChange={e => setFormData({...formData, is_available: e.target.checked})}
             />
             <label htmlFor="is_available" className="text-xs font-black uppercase tracking-widest cursor-pointer select-none">
               SATIŞA UYGUN (AKTİF)
             </label>
          </div>

          <button 
            type="submit" 
            className="bg-black text-white w-full py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            {editingProductId ? 'GÜNCELLEMEYİ KAYDET' : 'ÜRÜNÜ OLUŞTUR'}
          </button>
        </form>
      </Modal>

      {/* Category Edit Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="KATEGORİ DÜZENLE"
      >
          <form onSubmit={handleUpdateCategory} className="flex flex-col gap-6">
              <div>
                  <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Kategori Adı</label>
                  <input
                      type="text"
                      className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-gray-50 outline-none"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                  />
              </div>
              <button 
                  type="submit" 
                  className="bg-black text-white py-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                  GÜNCELLE
              </button>
          </form>
      </Modal>
    </div>
  );
}
