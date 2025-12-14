import { useState } from 'react';
import QRCode from 'react-qr-code';
import Modal from '../components/Modal';

export default function Tables() {
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Dummy Tables Data (1-12)
  const tables = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    status: Math.random() > 0.7 ? 'DOLU' : 'BOŞ' 
  }));

  const user = JSON.parse(localStorage.getItem('user'));
  const tenantId = user?.tenant_id || 1;
  const branchId = 1; // Default branch for now

  const getQrUrl = (tableId) => {
    return `${window.location.origin}/menu/${tenantId}/${branchId}/${tableId}`;
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Masa-${selectedTable.id}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const downloadSvg = () => {
    const svg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Masa-${selectedTable?.id}-QR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 h-full">
      <h1 className="text-2xl font-bold uppercase mb-6 tracking-widest border-b border-black pb-2 inline-block">
        Masa Yönetimi
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map(table => (
          <div key={table.id} className="border border-black p-6 flex flex-col items-center justify-between h-48 hover:bg-gray-50 transition-colors">
            <div className="text-4xl font-bold font-mono">#{table.id}</div>
            
            <div className={`text-xs font-bold px-2 py-1 uppercase tracking-widest ${
              table.status === 'DOLU' ? 'bg-black text-white' : 'text-gray-400 border border-gray-200'
            }`}>
              {table.status}
            </div>

            <button 
              onClick={() => setSelectedTable(table)}
              className="w-full mt-4 bg-black text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition-colors"
            >
              QR KOD GÖSTER
            </button>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      <Modal 
        isOpen={!!selectedTable} 
        onClose={() => setSelectedTable(null)} 
        title={`MASA ${selectedTable?.id} QR KODU`}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="bg-white p-4 border border-black">
            {selectedTable && (
              <QRCode 
                id="qr-code-svg"
                value={getQrUrl(selectedTable.id)} 
                size={200}
                level="H" 
              />
            )}
          </div>
          
          <div className="text-center w-full">
            <p className="text-xs font-mono mb-2 truncate">{getQrUrl(selectedTable?.id)}</p>
            <button 
              onClick={downloadSvg}
              className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest hover:opacity-80 w-full"
            >
              SVG İNDİR
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
