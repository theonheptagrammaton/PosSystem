import { useState, useEffect } from 'react';
import api from '../api';
import Modal from '../components/Modal';
import { User, Plus, Trash2, Key, Shield } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cashier',
    branch_id: '',
    full_name: ''
  });
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchBranches()]);
        setLoading(false);
    };
    init();
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
      showNotification({ title: 'BAŞARILI', message: 'Kullanıcı oluşturuldu', type: 'info' });
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
      showNotification({ 
        title: 'HATA', 
        message: 'Kullanıcı oluşturulamadı: ' + (err.response?.data?.error || 'Hata'),
        type: 'error'
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showNotification({ title: 'HATA', message: 'Şifre en az 6 karakter olmalı', type: 'error' });
      return;
    }
    try {
      await api.put(`/api/users/${selectedUser.id}`, { password: newPassword });
      showNotification({ title: 'BAŞARILI', message: `${selectedUser.username} şifresi güncellendi, oturumu sonlandırıldı`, type: 'info' });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err) {
      showNotification({ title: 'HATA', message: err.response?.data?.error || 'Şifre güncellenemedi', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showNotification({ 
      title: 'KULLANICIYI SİL', 
      message: 'Kullanıcıyı silmek istiyor musunuz?', 
      type: 'confirm' 
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      showNotification({ title: 'HATA', message: 'Silme işlemi başarısız', type: 'error' });
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
    <div className="p-8 h-full font-sans text-black">
       <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
        <h1 className="text-2xl font-black uppercase tracking-widest">Kullanıcı Yönetimi</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Yeni Kullanıcı</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="border-2 border-black p-6 hover:bg-gray-50 transition-colors shadow-sm relative group bg-white">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 border border-black">
                    <User className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="font-black uppercase text-lg leading-none tracking-wide">{user.username}</h2>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{user.full_name}</span>
                 </div>
               </div>
               
               {user.role !== 'admin' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
                      className="p-2 hover:bg-black hover:text-white transition-colors border-2 border-transparent hover:border-black opacity-0 group-hover:opacity-100"
                      title="Şifre Değiştir"
                    >
                      <Key size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-600 hover:text-white transition-colors border-2 border-transparent hover:border-black opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
               )}
            </div>

            <div className="space-y-3 text-xs font-mono border-t-2 border-black pt-4">
               <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase tracking-wide">ROL</span>
                  <span className={`font-black uppercase px-2 py-0.5 border ${
                      user.role === 'admin' ? 'bg-black text-white border-black' :
                      user.role === 'branch_manager' ? 'bg-white text-black border-black' : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    {user.role === 'branch_manager' ? 'Bayi Yetkilisi' :
                     user.role === 'cashier' ? 'Kasiyer' : 
                     user.role === 'waiter' ? 'Garson' :
                     user.role === 'kitchen' ? 'Mutfak' : 'Admin'}
                  </span>
               </div>
               {user.branch_id && (
                   <div className="flex justify-between items-center">
                     <span className="text-gray-500 font-bold uppercase tracking-wide">ŞUBE ID</span>
                     <span className="font-bold">{user.branch_id}</span>
                   </div>
               )}
            </div>
          </div>
        ))}
        {users.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-gray-300 text-gray-400 font-black uppercase tracking-widest italic">
                KULLANICI BULUNAMADI
            </div>
        )}
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => { setIsPasswordModalOpen(false); setNewPassword(''); setSelectedUser(null); }}
        title={`ŞİFRE DEĞİŞTİR — ${selectedUser?.username || ''}`}
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border border-yellow-400 bg-yellow-50 px-3 py-2">
            Şifre değiştirildiğinde kullanıcının mevcut oturumu <span className="text-black">anında sonlandırılır</span>.
          </p>
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Yeni Şifre</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full border-2 border-black p-3 text-sm font-bold focus:bg-gray-50 outline-none placeholder:text-gray-300"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="En az 6 karakter"
            />
          </div>
          <button
            type="submit"
            className="bg-black text-white w-full py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            ŞİFREYİ GÜNCELLE
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="YENİ KULLANICI EKLE"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Rol</label>
            <div className="relative">
                <select 
                className="w-full border-2 border-black p-3 text-sm font-bold uppercase outline-none bg-white appearance-none"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                >
                    <option value="cashier">Kasiyer (Sadece POS)</option>
                    <option value="waiter">Garson (Mobil Sipariş)</option>
                    <option value="kitchen">Mutfak (KDS Ekranı)</option>
                    <option value="branch_manager">Bayi Yetkilisi (Şube Yönetimi)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Şube</label>
            <div className="relative">
                <select 
                className="w-full border-2 border-black p-3 text-sm font-bold uppercase outline-none bg-white appearance-none"
                value={formData.branch_id}
                onChange={e => setFormData({...formData, branch_id: e.target.value})}
                required
                >
                    {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-wide">Kullanıcı sadece bu şubeye erişebilir.</p>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Ad Soyad</label>
            <input 
              type="text" 
              className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-gray-50 outline-none placeholder:text-gray-300"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              placeholder="Personel Adı"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Kullanıcı Adı</label>
            <input 
              type="text" 
              required
              className="w-full border-2 border-black p-3 text-sm font-bold uppercase focus:bg-gray-50 outline-none placeholder:text-gray-300"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-1 uppercase tracking-widest text-gray-500">Şifre</label>
            <input 
              type="password" 
              required
              minLength={6}
              className="w-full border-2 border-black p-3 text-sm font-bold focus:bg-gray-50 outline-none placeholder:text-gray-300"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="******"
            />
          </div>

          <button 
            type="submit" 
            className="bg-black text-white w-full py-4 font-black uppercase tracking-[0.2em] text-sm hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            OLUŞTUR
          </button>
        </form>
      </Modal>
    </div>
  );
}
