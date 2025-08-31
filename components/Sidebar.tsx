import React from 'react';
import Button from './common/Button.tsx';

export type View = 'Dashboard' | 'Recetas' | 'Inventario' | 'Proveedores' | 'Costos' | 'Control de Desperdicios' | 'APPCC' | 'Menú' | 'Alérgenos' | 'Pedidos' | 'Menús Guardados';

interface SidebarProps {
  onGenerateRecipeClick: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onGenerateRecipeClick, currentView, onViewChange }) => {

  const navItems: { icon: string; name: View }[] = [
    { icon: 'fa-chart-pie', name: 'Dashboard' },
    { icon: 'fa-book-open', name: 'Recetas' },
    { icon: 'fa-cubes', name: 'Inventario' },
    { icon: 'fa-truck', name: 'Proveedores' },
    { icon: 'fa-file-invoice-dollar', name: 'Costos' },
    { icon: 'fa-recycle', name: 'Control de Desperdicios'},
    { icon: 'fa-calendar-alt', name: 'Menú' },
    { icon: 'fa-save', name: 'Menús Guardados' },
    { icon: 'fa-dolly', name: 'Pedidos' },
    { icon: 'fa-clipboard-check', name: 'APPCC' },
    { icon: 'fa-exclamation-triangle', name: 'Alérgenos' },
  ];

  return (
    <div className="w-64 bg-pf-brown text-pf-beige shadow-lg flex flex-col">
      <div className="p-6 h-32 flex justify-center items-center border-b border-pf-beige/20 select-none">
        <div className="text-center">
            <h1 className="text-4xl font-semibold text-pf-beige tracking-widest">
                PUNTA FARO
            </h1>
            <p className="text-xs text-pf-beige/70 tracking-wider mt-1">
                Desconéctate del mundo
            </p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onViewChange(item.name);
            }}
            className={`flex items-center px-4 py-3 text-lg rounded-lg transition-colors duration-200 ${
              currentView === item.name
                ? 'bg-pf-gold text-pf-brown shadow-md'
                : 'text-pf-beige hover:bg-pf-green hover:bg-opacity-20'
            }`}
          >
            <i className={`fas ${item.icon} w-6 text-center`}></i>
            <span className="ml-4 font-semibold">{item.name}</span>
          </a>
        ))}
      </nav>
      <div className="p-6 border-t border-pf-beige/20">
        <Button onClick={onGenerateRecipeClick} fullWidth>
          <i className="fas fa-magic mr-2"></i>
          Generar con IA
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;