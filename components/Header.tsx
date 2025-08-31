import React from 'react';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, onToggleSidebar }) => {
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onToggleSidebar} 
          className="text-pf-brown/70 hover:text-pf-green"
          title="Ocultar/Mostrar menú"
        >
          <i className="fas fa-bars fa-lg"></i>
        </button>
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Buscar recetas, ingredientes, etiquetas..."
            className="w-full pl-10 pr-4 py-2 bg-pf-beige/40 border border-pf-brown/20 rounded-full text-pf-brown placeholder-pf-brown/60 focus:outline-none focus:ring-2 focus:ring-pf-green focus:border-pf-green"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-pf-brown/60"></i>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button className="text-pf-brown/70 hover:text-pf-green relative">
          <i className="fas fa-bell fa-lg"></i>
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
        </button>
        <div className="flex items-center space-x-3">
          <img
            src="https://picsum.photos/seed/user/40/40"
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-sm">Chef Ejecutivo</p>
            <p className="text-xs text-pf-brown/70">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;