import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', table_count: 10 });
  const [editingId, setEditingId] = useState(null);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Şubeler getirilemedi', err);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/branches/${editingId}`, formData);
        showNotification({ title: 'BAŞARILI', message: 'Şube güncellendi', type: 'info' });
      } else {
        await api.post('/api/branches', formData);
        showNotification({ title: 'BAŞARILI', message: 'Şube oluşturuldu', type: 'info' });
      }
      setIsModalOpen(false);
      setFormData({ name: '', address: '', phone: '', table_count: 10 });
      setEditingId(null);
      fetchBranches();
    } catch (err) {
      showNotification({ title: 'HATA', message: 'İşlem başarısız', type: 'error' });
    }
  };

  const handleEdit = (branch) => {
    setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '', table_count: branch.table_count || 10 });
    setEditingId(branch.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showNotification({ 
      title: 'ŞUBEYİ SİL', 
      message: 'Bu şubeyi silmek istediğinize emin misiniz?', 
      type: 'confirm' 
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/branches/${id}`);
      fetchBranches();
    } catch (err) {
      showNotification({ title: 'HATA', message: 'Silme işlemi başarısız', type: 'error' });
    }
  };

  const openNewModal = () => {
    setFormData({ name: '', address: '', phone: '', table_count: 10 });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <div className="spinner"></div>
          </div>
      );
  }

  return (
    <div className="p-8 h-full font-sans text-black">
       <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase tracking-widest">Şube Yönetimi</h1>
        <button 
          onClick={openNewModal}
          className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Yeni Şube</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="border-2 border-black p-6 flex flex-col gap-4 hover:bg-gray-50 transition-colors relative bg-white shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 group">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                 <div className="p-2 border border-black bg-gray-100">
                    <Building2 className="w-5 h-5" />
                 </div>
                 <h2 className="font-black uppercase text-lg tracking-wide">{branch.name}</h2>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => handleEdit(branch)} className="p-2 border border-black hover:bg-black hover:text-white transition-colors"><Pencil size={14} /></button>
                 <button onClick={() => handleDelete(branch.id)} className="p-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={14} /></button>
               </div>
            </div>

            <div className="text-xs font-mono font-bold space-y-3 text-gray-700 mt-2 border-t-2 border-black pt-4">
              {branch.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="uppercase">{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{branch.phone}</span>
                </div>
              )}
               <div className="flex items-center gap-2 mt-2">
                 <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 tracking-widest">KAPASİTE: {branch.table_count || 10} MASA</span>
               </div>
               <div className="text-[9px] text-gray-400 mt-2 text-right">ID: {branch.id}</div>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 font-black uppercase tracking-widest italic border-2 border-dashed border-gray-300">
            HENÜZ ŞUBE EKLENMEMİŞ
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'ŞUBEYİ DÜZENLE' : 'YENİ ŞUBE EKLE'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Şube Adı</label>
            <input 
              type="text" 
              required
              className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-gray-50 outline-none placeholder:text-gray-300"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Merkez Şube"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Adres</label>
            <textarea 
              className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-gray-50 outline-none resize-none placeholder:text-gray-300"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Adres detayları..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Telefon</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-gray-50 outline-none placeholder:text-gray-300"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="0212..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Masa Sayısı</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  className="w-full border-2 border-black p-3 text-sm font-bold font-mono focus:bg-gray-50 outline-none"
                  value={formData.table_count}
                  onChange={e => setFormData({...formData, table_count: parseInt(e.target.value)})}
                />
              </div>
          </div>

          <button 
            type="submit" 
            className="bg-black text-white w-full py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'ŞUBE OLUŞTUR'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
