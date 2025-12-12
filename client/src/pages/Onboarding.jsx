import { useState } from 'react';
import api from '../api'; // Merkezi API dosyamız
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleOnboard = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      // DÜZELTME 1: Genelde güncelleme işlemleri PUT ile yapılır.
      // DÜZELTME 2: Adres '/api/users/onboard' olmalı (Backend yapısına göre).
      await api.put('/api/users/onboard', {
        company_name: companyName,
        full_name: fullName
      }, {
        headers: { Authorization: `Bearer ${token}` }
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
      // Hata detayını konsolda görmek için:
      console.log(error.response?.data);
      alert('SETUP FAILED: ' + (error.response?.data?.error || 'Server Error'));
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
      <div className="w-full max-w-lg border-2 border-black p-12">
        
        <div className="mb-10">
          <h1 className="text-3xl font-bold uppercase tracking-tighter mb-2">Initial Setup</h1>
          <p className="text-sm font-mono text-gray-500">COMPLETE_REGISTRATION_PROTOCOL</p>
        </div>

        <form onSubmit={handleOnboard} className="space-y-8">
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border-b-2 border-gray px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-mono bg-transparent"
              placeholder="ENTER_BUSINESS_NAME"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b-2 border-gray px-2 py-3 focus:border-black outline-none transition-colors rounded-none text-xl font-mono bg-transparent"
              placeholder="ENTER_FULL_NAME"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="group w-full flex items-center justify-between bg-white border-2 border-black text-black px-6 py-4 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors rounded-none"
            >
              <span>Complete Setup</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}