import { useState, useEffect } from 'react';
import api from '../api';
import { User, ExternalLink } from 'lucide-react';

export default function Pos() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/api/branches');
      setBranches(res.data);
    } catch (err) {
      console.error('Şubeler alınamadı', err);
    }
  };

  const openTerminal = (branchId) => {
    window.open(`/pos-terminal/${branchId}`, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="p-8 h-full">
      <h1 className="text-2xl font-bold uppercase mb-8 tracking-widest border-b border-black pb-2 inline-block">POS SİSTEMİ - ŞUBE SEÇİMİ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
        {branches.map(branch => (
          <button 
            key={branch.id}
            onClick={() => openTerminal(branch.id)}
            className="border-2 border-black p-8 hover:bg-black hover:text-white transition-all flex flex-col items-center gap-4 group hover:scale-[1.02] duration-300 bg-white"
          >
              <div className="relative">
                 <User size={32} strokeWidth={1.5} />
                 <ExternalLink size={14} className="absolute -top-1 -right-4 text-gray-400 group-hover:text-white" />
              </div>
              <span className="font-bold text-xl uppercase tracking-widest">{branch.name}</span>
              <div className="text-xs font-mono text-gray-500 group-hover:text-gray-300 flex flex-col items-center">
                 <span>{branch.address}</span>
                 {branch.phone && <span>{branch.phone}</span>}
              </div>
          </button>
        ))}
      </div>
      
      {branches.length === 0 && (
          <div className="text-gray-400 font-mono mt-10 p-10 border border-dashed border-gray-300 text-center">
             HENÜZ ŞUBE EKLENMEMİŞ. "ŞUBELER" MENÜSÜNDEN EKLEME YAPINIZ.
          </div>
      )}
    </div>
  );
}
