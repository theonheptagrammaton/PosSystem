import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function Onboarding() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      if (user.role === 'cashier') {
        navigate(`/pos-terminal/${user.branch_id}`, { replace: true });
      } else if (user.is_onboarded) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleOnboard = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.put('/api/users/onboard', {
        company_name: companyName,
        full_name: fullName,
        phone: phone
      });

      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        user.is_onboarded = true;
        user.full_name = fullName;
        localStorage.setItem('user', JSON.stringify(user));
      }

      navigate('/dashboard');
      
    } catch (error) {
      console.error('Onboarding failed', error);
      showNotification({ 
        title: 'KURULUM HATASI', 
        message: error.response?.data?.error || 'Sunucu Hatası', 
        type: 'error' 
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
      <div className="w-full max-w-lg border-2 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-widest mb-2">BAŞLANGIÇ KURULUMU</h1>
          <div className="h-1 w-20 bg-black mx-auto mb-4"></div>
          <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">SİSTEM KAYDI & AKTİVASYON</p>
        </div>

        <form onSubmit={handleOnboard} className="space-y-8">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest block text-gray-400">Firma Adı</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border-b-2 border-black px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-black bg-transparent uppercase placeholder:text-gray-200"
              placeholder="İŞLETME ADI"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest block text-gray-400">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b-2 border-black px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-black bg-transparent uppercase placeholder:text-gray-200"
              placeholder="ADINIZ SOYADINIZ"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest block text-gray-400">Telefon Numarası</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-b-2 border-black px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-black bg-transparent uppercase placeholder:text-gray-200 font-mono"
              placeholder="5XX XXX XX XX"
              pattern="[0-9]{10}"
              title="10 haneli telefon numarası giriniz (5XXXXXXXXX)"
              required
            />
          </div>

          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-between bg-black text-white px-8 py-6 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black border-2 border-black transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span>{loading ? 'KURULUM YAPILIYOR...' : 'KURULUMU TAMAMLA'}</span>
              {!loading && <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}