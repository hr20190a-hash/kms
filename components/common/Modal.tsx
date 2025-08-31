
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} transform transition-all`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-pf-beige">
          <h2 className="text-2xl font-bold text-pf-brown">{title}</h2>
          <button onClick={onClose} className="text-pf-brown/50 hover:text-pf-brown">
            <i className="fas fa-times fa-lg"></i>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;