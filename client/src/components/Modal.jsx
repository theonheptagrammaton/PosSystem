import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white border-2 border-black w-full max-w-md relative p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black p-4 bg-black text-white">
          <h2 className="font-bold uppercase tracking-widest text-sm">{title}</h2>
          <button 
            onClick={onClose}
            className="hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
