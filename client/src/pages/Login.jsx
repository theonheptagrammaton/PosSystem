import { useState } from 'react';
// import axios from 'axios';  <-- Bunu kaldırdık
import api from '../api';     // <-- Yeni oluşturduğumuz merkezi API dosyasını çağırdık
import { useNavigate } from 'react-router-dom';
import { Terminal, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // DÜZELTME: Artık 'http://localhost:5001' yok.
      // api.post otomatik olarak doğru sunucu adresini başına ekleyecek.
      const response = await api.post('/api/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.is_onboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Login failed', error);
      // Hata detayını görmek istersen konsola bunu da ekleyebilirsin:
      // console.log(error.response?.data);
      alert('LOGIN FAILED'); 
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center font-sans">
      <div className="w-full max-w-sm border-2 border-black p-8">
        
        <div className="mb-8 text-center border-b border-black pb-4">
          <Terminal className="w-8 h-8 mx-auto mb-2" />
          <h1 className="text-2xl font-bold tracking-widest">SYSTEM_ACCESS</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">User ID</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray px-4 py-3 focus:border-black outline-none transition-colors rounded-none placeholder-gray-400"
              placeholder="ENTER_USERNAME"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest block">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray px-4 py-3 focus:border-black outline-none transition-colors rounded-none placeholder-gray-400"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-colors rounded-none"
          >
            Initiate Session
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-mono text-gray-500">
          SECURE_GATEWAY_V1
        </div>
      </div>
    </div>
  );
}