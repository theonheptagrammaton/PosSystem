import axios from 'axios';

// API adresini ortam değişkeninden al.
// Coolify'da VITE_API_URL tanımladığımız için oradaki adresi alacak.
const baseURL = import.meta.env.VITE_API_URL || ''; // Relative path for production

const api = axios.create({
  baseURL: baseURL,
});

// (Opsiyonel) Her istekte Token'ı otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Token'ı nereye kaydettiysen oradan al
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;