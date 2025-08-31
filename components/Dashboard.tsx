import React, { useMemo } from 'react';
import PageHeader from './common/PageHeader.tsx';
import { View } from './Sidebar.tsx';
import { WeeklyPlan, SavedMenu, Recipe, InventoryItem } from '../types.ts';

interface DashboardProps {
    weeklyPlan: WeeklyPlan;
    savedMenus: SavedMenu[];
    recipes: Recipe[];
    inventory: InventoryItem[];
    onViewChange: (view: View) => void;
}

const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const QuickAccessCard: React.FC<{ icon: string; title: string; color: string; onClick: () => void; }> = ({ icon, title, color, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white/80 p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
        <i className={`fas ${icon} text-3xl ${color} mb-2`}></i>
        <p className="font-semibold text-pf-brown">{title}</p>
    </div>
);

const MenuOfTheDayCard: React.FC<{ title: string, menu: SavedMenu | null, recipes: Recipe[], onPlanClick: () => void }> = ({ title, menu, recipes, onPlanClick }) => {
    const menuRecipes = useMemo(() => {
        if (!menu) return [];
        return menu.recipeIds.map(id => recipes.find(r => r.id === id)).filter(Boolean) as Recipe[];
    }, [menu, recipes]);

    return (
        <div className="bg-white/80 p-6 rounded-xl shadow-md flex flex-col">
            <h3 className="font-bold text-pf-brown text-xl mb-3 flex items-center">
                <i className={`fas ${title === 'Almuerzo' ? 'fa-sun' : 'fa-moon'} text-pf-gold mr-3`}></i>
                {title}
            </h3>
            {menu ? (
                <div className="space-y-2 flex-grow">
                    <p className="font-semibold text-pf-brown mb-2">{menu.name}</p>
                    <ul className="text-sm text-pf-brown/80 list-disc list-inside">
                        {menuRecipes.slice(0, 3).map(r => <li key={r.id} className="truncate">{r.name}</li>)}
                        {menuRecipes.length > 3 && <li className="text-xs">y {menuRecipes.length - 3} más...</li>}
                    </ul>
                </div>
            ) : (
                <div 
                    className="flex-grow flex flex-col items-center justify-center text-center text-pf-brown/70 bg-pf-beige/50 rounded-lg p-4 cursor-pointer hover:bg-pf-beige"
                    onClick={onPlanClick}
                >
                    <i className="fas fa-calendar-plus fa-2x mb-2"></i>
                    <p className="font-semibold text-sm">No hay menú planificado</p>
                    <p className="text-xs">Haz clic para planificar</p>
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ weeklyPlan, savedMenus, recipes, inventory, onViewChange }) => {
  const todayString = toISODateString(new Date());
  const todaysPlan = weeklyPlan[todayString];
  const guestsToday = todaysPlan?.guests || 0;

  const savedMenuMap = useMemo(() => new Map(savedMenus.map(m => [m.id, m])), [savedMenus]);
  const lunchMenu = todaysPlan?.lunch ? savedMenuMap.get(todaysPlan.lunch) : null;
  const dinnerMenu = todaysPlan?.dinner ? savedMenuMap.get(todaysPlan.dinner) : null;

  const expiringSoonItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return inventory
        .filter(item => {
            const expiryDate = new Date(item.expiryDate);
            return expiryDate >= today && expiryDate <= threeDaysFromNow && item.quantity > 0;
        })
        .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.quantity > 0 && item.quantity <= item.lowStockThreshold)
        .sort((a,b) => (a.quantity/a.lowStockThreshold) - (b.quantity/b.lowStockThreshold));
  }, [inventory]);

  return (
    <div className="animate-fade-in space-y-10">
        <PageHeader 
            title="Panel de Control Diario" 
            subtitle={`Resumen de la operación para hoy, ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`}
        />
        
        {/* Daily Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white/80 p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center border-t-4 border-pf-green">
                <i className="fas fa-users text-3xl text-pf-green mb-2"></i>
                <p className="text-pf-brown text-sm font-medium uppercase tracking-wider">Huéspedes de Hoy</p>
                <p className="text-6xl font-bold text-pf-brown mt-2">{guestsToday}</p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <MenuOfTheDayCard title="Almuerzo" menu={lunchMenu || null} recipes={recipes} onPlanClick={() => onViewChange('Menús Guardados')} />
              <MenuOfTheDayCard title="Cena" menu={dinnerMenu || null} recipes={recipes} onPlanClick={() => onViewChange('Menús Guardados')} />
            </div>
        </div>
        
        {/* Special Recommendations */}
        <div>
             <h3 className="text-2xl font-bold mb-4 text-pf-brown">Recomendaciones Especiales</h3>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 p-6 rounded-xl shadow-md">
                    <h4 className="font-bold text-lg text-pf-brown mb-3 flex items-center">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mr-3"></i>
                        Próximos a Vencer (3 días)
                    </h4>
                    <div className="max-h-52 overflow-y-auto pr-2 space-y-2">
                        {expiringSoonItems.length > 0 ? (
                            expiringSoonItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-pf-beige/50 rounded-md">
                                    <span className="font-semibold">{item.name}</span>
                                    <span className="text-pf-brown/80">{new Date(item.expiryDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit'})}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-pf-brown/70 py-4">No hay productos próximos a vencer.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white/80 p-6 rounded-xl shadow-md">
                     <h4 className="font-bold text-lg text-pf-brown mb-3 flex items-center">
                        <i className="fas fa-battery-quarter text-red-500 mr-3"></i>
                        Stock Bajo
                    </h4>
                    <div className="max-h-52 overflow-y-auto pr-2 space-y-2">
                        {lowStockItems.length > 0 ? (
                            lowStockItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-pf-beige/50 rounded-md">
                                    <span className="font-semibold">{item.name}</span>
                                    <span className="text-pf-brown/80">{item.quantity} / {item.lowStockThreshold} {item.unit}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-pf-brown/70 py-4">No hay productos con stock bajo.</div>
                        )}
                    </div>
                </div>
             </div>
        </div>

        {/* Quick Access */}
        <div>
             <h3 className="text-2xl font-bold mb-4 text-pf-brown">Accesos Rápidos</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickAccessCard icon="fa-calendar-alt" title="Planificar Menús" color="text-pf-green" onClick={() => onViewChange('Menús Guardados')} />
                <QuickAccessCard icon="fa-dolly" title="Gestionar Pedidos" color="text-pf-blue" onClick={() => onViewChange('Pedidos')} />
                <QuickAccessCard icon="fa-cubes" title="Ver Inventario" color="text-pf-gold" onClick={() => onViewChange('Inventario')} />
                <QuickAccessCard icon="fa-clipboard-check" title="Tareas APPCC" color="text-pf-brown" onClick={() => onViewChange('APPCC')} />
             </div>
        </div>
    </div>
  );
};

export default Dashboard;