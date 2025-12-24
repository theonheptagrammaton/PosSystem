import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleOnboard = async (e) => {
    e.preventDefault();
    
    try {
      await api.put('/api/users/onboard', {
        company_name: companyName,
        full_name: fullName,
        phone: phone
      });

      // LocalStorage'daki kullanıcıyı güncelle
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        user.is_onboarded = true;
        user.full_name = fullName;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Dashboard'a yönlendir
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Onboarding failed', error);
      alert('KURULUM HATASI: ' + (error.response?.data?.error || 'Sunucu Hatası'));
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
      <div className="w-full max-w-lg border-2 border-black p-12">
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-tighter mb-2">Başlangıç Kurulumu</h1>
          <p className="text-sm font-mono text-gray-500">KAYIT_PROTOKOLUNU_TAMAMLA</p>
        </div>

        <form onSubmit={handleOnboard} className="space-y-8">
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">Firma Adı</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border-b-2 border-black px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-mono bg-transparent"
              placeholder="İŞLETME ADINI GİRİNİZ"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b-2 border-black px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-mono bg-transparent"
              placeholder="AD SOYAD GİRİNİZ"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">Telefon Numarası</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-b-2 border-black px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-mono bg-transparent"
              placeholder="5XX XXX XX XX"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="group w-full flex items-center justify-between bg-white border-2 border-black text-black px-6 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors rounded-none"
            >
              <span>Kurulumu Tamamla</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}