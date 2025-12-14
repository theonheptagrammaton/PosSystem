import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone } from 'lucide-react';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Şubeler getirilemedi', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/branches/${editingId}`, formData);
      } else {
        await api.post('/api/branches', formData);
      }
      setIsModalOpen(false);
      setFormData({ name: '', address: '', phone: '' });
      setEditingId(null);
      fetchBranches();
    } catch (err) {
      alert('İşlem başarısız');
    }
  };

  const handleEdit = (branch) => {
    setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
    setEditingId(branch.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu şubeyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/branches/${id}`);
      fetchBranches();
    } catch (err) {
      alert('Silme işlemi başarısız');
    }
  };

  const openNewModal = () => {
    setFormData({ name: '', address: '', phone: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full">
       <div className="flex justify-between items-center mb-6 border-b border-black pb-2">
        <h1 className="text-2xl font-bold uppercase tracking-widest">Şube Yönetimi</h1>
        <button 
          onClick={openNewModal}
          className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Yeni Şube</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="border border-black p-6 flex flex-col gap-4 hover:bg-gray-50 transition-colors relative">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-2">
                 <Building2 className="w-5 h-5" />
                 <h2 className="font-bold uppercase text-lg">{branch.name}</h2>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => handleEdit(branch)} className="p-1 hover:bg-black hover:text-white transition-colors border border-transparent hover:border-black"><Pencil size={14} /></button>
                 <button onClick={() => handleDelete(branch.id)} className="p-1 hover:bg-red-600 hover:text-white transition-colors border border-transparent hover:border-red-600"><Trash2 size={14} /></button>
               </div>
            </div>

            <div className="text-sm font-mono space-y-2 text-gray-600">
              {branch.address && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="mt-1 flex-shrink-0" />
                  <span>{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{branch.phone}</span>
                </div>
              )}
               <div className="text-xs text-gray-400 mt-2">ID: {branch.id}</div>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 font-mono border border-dashed border-gray-300">
            HENÜZ ŞUBE EKLENMEMİŞ
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'ŞUBEYİ DÜZENLE' : 'YENİ ŞUBE EKLE'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Şube Adı</label>
            <input 
              type="text" 
              required
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Merkez Şube"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Adres</label>
            <textarea 
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Adres detayları..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Telefon</label>
            <input 
              type="text" 
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="0212..."
            />
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
