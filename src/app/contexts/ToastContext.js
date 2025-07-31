"use client";

import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, duration) => addToast(message, 'success', duration);
  const error = (message, duration) => addToast(message, 'error', duration);
  const info = (message, duration) => addToast(message, 'info', duration);
  const warning = (message, duration) => addToast(message, 'warning', duration);

  return (
    <ToastContext.Provider value={{ 
      addToast, 
      removeToast, 
      success, 
      error, 
      info, 
      warning,
      toasts 
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const getToastStyles = (type) => {
    const baseStyles = "toast";
    switch (type) {
      case 'success':
        return `${baseStyles} toast-success`;
      case 'error':
        return `${baseStyles} toast-error`;
      case 'warning':
        return `${baseStyles} toast-warning`;
      default:
        return `${baseStyles} toast-info`;
    }
  };

  return (
    <div className={getToastStyles(toast.type)}>
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
        <button 
          className="toast-close"
          onClick={onRemove}
          aria-label="Close toast"
        >
          ×
        </button>
      </div>
    </div>
  );
};