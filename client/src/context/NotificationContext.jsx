import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, AlertCircle, Info, HelpCircle } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'confirm', 'error'
    onConfirm: null,
    onCancel: null
  });

  const resolveRef = useRef(null);

  const showNotification = useCallback(({ title, message, type = 'info', confirmText = 'Tamam', cancelText = 'İptal' }) => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        resolve
      });
    });
  }, []);

  const handleClose = (value) => {
    if (modal.resolve) modal.resolve(value);
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const getIcon = () => {
    switch (modal.type) {
      case 'error': return <AlertCircle className="text-red-600" size={32} />;
      case 'confirm': return <HelpCircle className="text-blue-600" size={32} />;
      default: return <Info className="text-black" size={32} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {modal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-black w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black p-4 bg-black text-white">
              <span className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                {modal.type === 'error' ? 'SİSTEM HATASI' : modal.type === 'confirm' ? 'ONAY GEREKLİ' : 'BİLDİRİM'}
              </span>
              <button onClick={() => handleClose(false)} className="hover:text-gray-300">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <h3 className="text-lg font-bold uppercase mb-2 leading-tight">{modal.title}</h3>
              <p className="text-sm text-gray-600 font-medium">{modal.message}</p>
            </div>

            {/* Footer */}
            <div className="flex border-t-2 border-black">
              {modal.type === 'confirm' && (
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 px-4 py-4 font-bold border-r-2 border-black hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs"
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className={`flex-1 px-4 py-4 font-bold text-white transition-colors uppercase tracking-widest text-xs ${modal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'}`}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
