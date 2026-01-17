import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import api from '../api'; 
import Modal from '../components/Modal';

export default function Tables() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [busyTables, setBusyTables] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
        generateTables(selectedBranch.table_count || 10);
        fetchBranchStatus(selectedBranch.tenant_id, selectedBranch.id);
    } else {
        setTables([]);
        setBusyTables([]);
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
        const res = await api.get('/api/branches');
        setBranches(res.data);
        if (res.data.length > 0) {
            setSelectedBranch(res.data[0]);
        }
    } catch (err) {
        console.error('Şubeler alınamadı', err);
    } finally {
        setLoading(false);
    }
  };

  const fetchBranchStatus = async (tenantId, branchId) => {
      if (!tenantId || !branchId) return;
      try {
          const res = await api.get(`/api/orders/status/${tenantId}/${branchId}`);
          const busyIds = res.data.map(str => parseInt(str.replace('MASA-', '')));
          setBusyTables(busyIds);
      } catch (err) {
          console.error('Status fetch error', err);
      }
  };

  const generateTables = (count) => {
    const newTables = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
    }));
    setTables(newTables);
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const tenantId = user?.tenant_id;

  const getQrUrl = (tableId) => {
    return `${window.location.origin}/menu/${tenantId}/${selectedBranch?.id}/${tableId}`;
  };

  const downloadSvg = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedBranch?.name}-Masa-${selectedTable?.id}-QR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
      return (
          <div className="h-full flex items-center justify-center">
              <div className="spinner"></div>
          </div>
      );
  }

  return (
    <div className="p-8 h-full flex flex-col font-sans text-black">
      <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
         <h1 className="text-2xl font-black uppercase tracking-widest">
            MASA & QR YÖNETİMİ
         </h1>
         
         <div className="flex gap-2">
            {branches.map(branch => (
                <button
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        selectedBranch?.id === branch.id 
                        ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                        : 'bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50'
                    }`}
                >
                    {branch.name}
                </button>
            ))}
         </div>
      </div>
      
      {!selectedBranch && branches.length === 0 && (
         <div className="text-gray-400 font-bold uppercase tracking-widest text-center mt-20">LÜTFEN ÖNCE ŞUBE EKLEYİNİZ.</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 overflow-y-auto pb-10">
        {tables.map(table => {
           const isBusy = busyTables.includes(table.id);
           return (
          <div key={table.id} className="border-2 border-black p-4 flex flex-col items-center justify-between h-40 hover:bg-gray-50 transition-colors bg-white shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1">
            <div className="text-4xl font-black font-mono">#{table.id}</div>
            
            <div className={`text-[9px] font-black px-3 py-1 uppercase tracking-widest border-2 ${
              isBusy ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'
            }`}>
              {isBusy ? 'DOLU' : 'BOŞ'}
            </div>

            <button 
              onClick={() => setSelectedTable(table)}
              className="w-full mt-2 bg-black text-white py-2 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black border-2 border-black transition-colors"
            >
              QR GÖSTER
            </button>
          </div>
        )})}
      </div>

      {/* QR Code Modal */}
      <Modal 
        isOpen={!!selectedTable} 
        onClose={() => setSelectedTable(null)} 
        title={`${selectedBranch?.name} // MASA ${selectedTable?.id}`}
      >
        <div className="flex flex-col items-center gap-8">
          <div className="bg-white p-6 border-2 border-black shadow-2xl">
            {selectedTable && selectedBranch && (
              <QRCode 
                id="qr-code-svg"
                value={getQrUrl(selectedTable.id)} 
                size={220}
                level="H" 
                className="mix-blend-multiply"
              />
            )}
          </div>
          
          <div className="text-center w-full">
            <p className="text-[10px] font-mono mb-4 text-gray-400 uppercase tracking-widest break-all border border-gray-100 p-2 bg-gray-50">
                {getQrUrl(selectedTable?.id)}
            </p>
            <button 
              onClick={downloadSvg}
              className="bg-black text-white px-8 py-4 font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black border-2 border-black transition-all w-full text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              SVG İNDİR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
