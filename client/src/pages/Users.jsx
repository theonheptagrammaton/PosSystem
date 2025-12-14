import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { User, Plus, Trash2, Key, Shield } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    role: 'cashier', 
    branch_id: '',
    full_name: '' 
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Kullanıcılar alınamadı', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, branch_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Şubeler alınamadı', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/users', formData);
      setIsModalOpen(false);
      setFormData({ 
        username: '', 
        password: '', 
        role: 'cashier', 
        branch_id: branches[0]?.id || '',
        full_name: '' 
      });
      fetchUsers();
    } catch (err) {
      alert('Kullanıcı oluşturulamadı: ' + (err.response?.data?.error || 'Hata'));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Kullanıcıyı silmek istiyor musunuz?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Silme işlemi başarısız');
    }
  };

  return (
    <div className="p-8 h-full">
       <div className="flex justify-between items-center mb-6 border-b border-black pb-2">
        <h1 className="text-2xl font-bold uppercase tracking-widest">Kullanıcı Yönetimi</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="border border-black p-6 hover:bg-gray-50 transition-colors relative">
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-2">
                 <User className="w-5 h-5" />
                 <div>
                    <h2 className="font-bold uppercase text-lg leading-none">{user.username}</h2>
                    <span className="text-xs text-gray-400 font-mono">{user.full_name}</span>
                 </div>
               </div>
               
               {user.role !== 'admin' && ( // Prevent deleting other admins or self if api allowed
                  <button onClick={() => handleDelete(user.id)} className="p-1 hover:bg-red-600 hover:text-white transition-colors border border-transparent hover:border-red-600">
                    <Trash2 size={14} />
                  </button>
               )}
            </div>

            <div className="space-y-2 text-sm font-mono border-t border-gray-100 pt-2">
               <div className="flex justify-between">
                  <span className="text-gray-500">ROL:</span>
                  <span className={`font-bold uppercase ${
                      user.role === 'admin' ? 'text-purple-600' :
                      user.role === 'branch_manager' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {user.role === 'branch_manager' ? 'Bayi Yetkilisi' :
                     user.role === 'cashier' ? 'Kasiyer' : user.role}
                  </span>
               </div>
               {user.branch_id && (
                   <div className="flex justify-between">
                     <span className="text-gray-500">ŞUBE ID:</span>
                     <span>{user.branch_id}</span>
                   </div>
               )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="YENİ KULLANICI EKLE"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Rol</label>
            <select 
              className="w-full border border-black p-2 text-sm outline-none bg-white"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
                <option value="cashier">Kasiyer (Sadece POS)</option>
                <option value="branch_manager">Bayi Yetkilisi (Şube Yönetimi)</option>
                {/* Admin creation can be restricted or allowed */}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Şube</label>
            <select 
              className="w-full border border-black p-2 text-sm outline-none bg-white"
              value={formData.branch_id}
              onChange={e => setFormData({...formData, branch_id: e.target.value})}
              required
            >
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Bu kullanıcı sadece seçili şubeye erişebilecek.</p>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Ad Soyad</label>
            <input 
              type="text" 
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              placeholder="Personel Adı"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Kullanıcı Adı</label>
            <input 
              type="text" 
              required
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase">Şifre</label>
            <input 
              type="text" 
              required
              className="w-full border border-black p-2 text-sm focus:bg-gray-50 outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="En az 6 karakter"
            />
          </div>

          <button 
            type="submit" 
            className="bg-black text-white p-3 font-bold uppercase tracking-widest hover:bg-gray-800 mt-4"
          >
            OLUŞTUR
          </button>
        </form>
      </Modal>
    </div>
  );
}
