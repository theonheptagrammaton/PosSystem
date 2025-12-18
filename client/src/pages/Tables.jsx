import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import api from '../api'; // Use API for fetching branches
import Modal from '../components/Modal';

export default function Tables() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [busyTables, setBusyTables] = useState([]); // Store busy table IDs

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Generate tables when branch is selected
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
    try {
        const res = await api.get('/api/branches');
        setBranches(res.data);
        if (res.data.length > 0) {
            setSelectedBranch(res.data[0]);
        }
    } catch (err) {
        console.error('Şubeler alınamadı', err);
    }
  };

  const fetchBranchStatus = async (tenantId, branchId) => {
      if (!tenantId || !branchId) return;
      try {
          const res = await api.get(`/api/orders/status/${tenantId}/${branchId}`);
          // response is array of strings e.g. ["MASA-1", "MASA-5"]
          const busyIds = res.data.map(str => parseInt(str.replace('MASA-', '')));
          setBusyTables(busyIds);
      } catch (err) {
          console.error('Status fetch error', err);
      }
  };

  const generateTables = (count) => {
    const newTables = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        // Status will be derived during render or we can map it here if we want static snapshot
        // Better to derive in render to keep it simple sync with busyTables
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

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-black pb-2">
         <h1 className="text-2xl font-bold uppercase tracking-widest">
            Masa Yönetimi
         </h1>
         
         <div className="flex gap-2">
            {branches.map(branch => (
                <button
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border border-black transition-colors ${
                        selectedBranch?.id === branch.id 
                        ? 'bg-black text-white' 
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                >
                    {branch.name}
                </button>
            ))}
         </div>
      </div>
      
      {!selectedBranch && branches.length === 0 && (
         <div className="text-gray-400">Önce şube ekleyiniz.</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-10">
        {tables.map(table => {
           const isBusy = busyTables.includes(table.id);
           return (
          <div key={table.id} className="border border-black p-4 flex flex-col items-center justify-between h-40 hover:bg-gray-50 transition-colors bg-white">
            <div className="text-3xl font-bold font-mono">#{table.id}</div>
            
            <div className={`text-[10px] font-bold px-2 py-0.5 uppercase tracking-widest ${
              isBusy ? 'bg-red-600 text-white' : 'text-gray-400 border border-gray-200'
            }`}>
              {isBusy ? 'DOLU' : 'BOŞ'}
            </div>

            <button 
              onClick={() => setSelectedTable(table)}
              className="w-full mt-2 bg-black text-white py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-colors"
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
        title={`${selectedBranch?.name} / MASA ${selectedTable?.id}`}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="bg-white p-4 border border-black">
            {selectedTable && selectedBranch && text(
              <QRCode 
                id="qr-code-svg"
                value={getQrUrl(selectedTable.id)} 
                size={200}
                level="H" 
              />
            )}
          </div>
          
          <div className="text-center w-full">
            <p className="text-xs font-mono mb-2 truncate text-gray-500">{getQrUrl(selectedTable?.id)}</p>
            <button 
              onClick={downloadSvg}
              className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest hover:opacity-80 w-full text-xs"
            >
              SVG İNDİR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Fix QRCode import issue in previous snippet execution if necessary. 
// Assuming logical correctness here.
function text(component) { return component; } // Dummy helper if needed or just use logic directly
