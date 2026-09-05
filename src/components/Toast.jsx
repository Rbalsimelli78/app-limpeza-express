import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast = () => {
  const { toasts } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let icon = <CheckCircle size={18} color="#10b981" />;
        let borderColor = 'rgba(16, 185, 129, 0.4)';
        
        if (toast.type === 'danger') {
          icon = <AlertCircle size={18} color="#f43f5e" />;
          borderColor = 'rgba(244, 63, 94, 0.4)';
        } else if (toast.type === 'info') {
          icon = <Info size={18} color="#06b6d4" />;
          borderColor = 'rgba(6, 182, 212, 0.4)';
        }

        return (
          <div key={toast.id} className="toast" style={{ borderColor }}>
            {icon}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
