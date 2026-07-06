import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  // Expose globally so the service worker message handler can use it
  React.useEffect(() => {
    window.__safeher_toast = addToast;
    return () => { delete window.__safeher_toast; };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}
