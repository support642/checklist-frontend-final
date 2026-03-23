import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ 
  message, 
  isVisible, 
  onClose, 
  type = 'success', 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertCircle className="h-6 w-6 text-amber-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  const borderColors = {
    success: 'border-green-100',
    error: 'border-red-100',
    warning: 'border-amber-100',
    info: 'border-blue-100',
  };

  const bgColors = {
    success: 'bg-green-50/90',
    error: 'bg-red-50/90',
    warning: 'bg-amber-50/90',
    info: 'bg-blue-50/90',
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`
              pointer-events-auto
              max-w-md w-full md:w-auto
              ${bgColors[type]} 
              backdrop-blur-md
              border-2 ${borderColors[type]}
              shadow-[0_20px_50px_rgba(0,0,0,0.15)]
              rounded-2xl p-5 md:p-6
              flex items-center gap-4
            `}
          >
            <div className="flex-shrink-0 bg-white p-2 rounded-xl shadow-sm">
              {icons[type]}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm md:text-base font-semibold ${textColors[type]} leading-tight`}>
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
            
            {/* Progress bar for auto-dismissal */}
            <motion.div 
              className={`absolute bottom-0 left-0 h-1 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'} rounded-full`}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
