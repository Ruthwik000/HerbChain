import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          className: 'bg-green-50 border-green-200 text-green-800',
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          icon: XCircle,
          className: 'bg-red-50 border-red-200 text-red-800',
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconColor: 'text-yellow-500'
        };
      default:
        return {
          icon: AlertCircle,
          className: 'bg-blue-50 border-blue-200 text-blue-800',
          iconColor: 'text-blue-500'
        };
    }
  };

  const config = getToastConfig(type);
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg
        ${config.className}
      `}
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 mt-0.5 mr-3 ${config.iconColor}`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// Toast container component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </AnimatePresence>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Toast;