import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastSuccess({ message, onClose, duration = 2000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-4 right-4 z-[9999] bg-white shadow-lg rounded-lg border border-green-200 p-4 flex items-center gap-3 max-w-md"
    >
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <Check className="w-6 h-6 text-green-600" />
      </div>
      <p className="text-sm font-medium text-slate-900 flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Hook para usar o toast
export function useToastSuccess() {
  const [toasts, setToasts] = React.useState([]);

  const showToast = (message, duration = 2000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <AnimatePresence>
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ top: `${16 + index * 80}px` }} className="fixed right-4 z-[9999]">
          <ToastSuccess
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </AnimatePresence>
  );

  return { showToast, ToastContainer };
}