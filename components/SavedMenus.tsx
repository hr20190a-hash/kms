import React, { useState } from 'react';
import { SavedMenu, Recipe, WeeklyPlan, DayPlan } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';

// Date Helpers
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

interface SavedMenusProps {
  savedMenus: SavedMenu[];
  recipes: Recipe[];
  weeklyPlan: WeeklyPlan;
  onLoadMenu: (menu: SavedMenu) => void;
  onDeleteMenu: (menuId: string) => void;
  onUpdateWeeklyPlan: (date: string, updates: Partial<DayPlan>) => void;
}

const DraggableMenuCard: React.FC<{ menu: SavedMenu }> = ({ menu }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('menuId', menu.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing border-l-4 border-pf-gold"
    >
      <h4 className="font-bold text-pf-brown">{menu.name}</h4>
      <p className="text-xs text-pf-brown/70">{new Date(menu.date).toLocaleDateString()}</p>
    </div>
  );
};

const MealSlot: React.FC<{
  dateString: string;
  meal: 'lunch' | 'dinner';
  menu: SavedMenu | undefined;
  onDrop: (date: string, meal: 'lunch' | 'dinner', menuId: string) => void;
  onRemove: (date: string, meal: 'lunch' | 'dinner') => void;
}> = ({ dateString, meal, menu, onDrop, onRemove }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const menuId = e.dataTransfer.getData('menuId');
    if (menuId) {
      onDrop(dateString, meal, menuId);
    }
    setIsOver(false);
  };
  
  const mealName = meal === 'lunch' ? 'Almuerzo' : 'Cena';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-28 p-2 rounded-lg flex flex-col justify-between transition-colors ${
        isOver ? 'bg-pf-green/30' : 'bg-pf-beige/50'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-semibold text-xs text-pf-brown/80">{mealName}</span>
        {menu && (
            <button 
                onClick={() => onRemove(dateString, meal)} 
                className="text-pf-brown/50 hover:text-red-600 text-xs"
                title="Quitar menú"
            >
                <i className="fas fa-times"></i>
            </button>
        )}
      </div>
      {menu ? (
        <div className="bg-white p-1.5 rounded-md shadow-sm">
          <p className="font-bold text-pf-brown text-xs truncate">{menu.name}</p>
          <p className="text-[10px] text-pf-brown/70">{new Date(menu.date).toLocaleDateString()}</p>
        </div>
      ) : (
        <div className="text-center text-[10px] text-pf-brown/60 flex items-center justify-center h-full">
          <p>Arrastra un menú aquí</p>
        </div>
      )}
    </div>
  );
};


const SavedMenus: React.FC<SavedMenusProps> = ({ savedMenus, recipes, weeklyPlan, onLoadMenu, onDeleteMenu, onUpdateWeeklyPlan }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const savedMenuMap = new Map(savedMenus.map(m => [m.id, m]));

  const startOfWeek = getStartOfWeek(currentDate);

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
  });

  const handleDrop = (date: string, meal: 'lunch' | 'dinner', menuId: string) => {
    onUpdateWeeklyPlan(date, { [meal]: menuId });
  };

  const handleRemove = (date: string, meal: 'lunch' | 'dinner') => {
    onUpdateWeeklyPlan(date, { [meal]: undefined });
  };
  
  const handleGuestsChange = (date: string, guests: number) => {
    onUpdateWeeklyPlan(date, { guests: Math.max(0, guests) });
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Handles timezone offset issues from input[type=date]
      const [year, month, day] = e.target.value.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day));
  };

  const handleSetWeek = (offset: number) => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(prev.getDate() + offset);
          return newDate;
      });
  };

  // FIX: Added missing return statement with component JSX.
  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <PageHeader
              title="Programador Semanal"
              subtitle="Arrastra y suelta tus menús guardados para planificar la semana."
            />
             <div className="mb-6 bg-white/80 p-2 rounded-xl shadow-md flex items-center justify-center space-x-2 self-start sm:self-center">
                <button onClick={() => handleSetWeek(-7)} className="p-2 text-pf-brown hover:text-pf-green"><i className="fas fa-chevron-left"></i></button>
                <input
                    type="date"
                    value={toISODateString(currentDate)}
                    onChange={handleDateChange}
                    className="p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green text-center font-semibold"
                />
                <button onClick={() => handleSetWeek(7)} className="p-2 text-pf-brown hover:text-pf-green"><i className="fas fa-chevron-right"></i></button>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map(date => {
              const dateString = toISODateString(date);
              const dayPlan = weeklyPlan[dateString] || { guests: 20, lunch: undefined, dinner: undefined };
              const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
            
              return (
                <div key={dateString} className="bg-white/80 p-2 rounded-xl shadow-md space-y-2 flex flex-col">
                  <div className="text-center">
                    <h3 className="font-bold text-pf-brown uppercase text-sm tracking-wider">{dayName}</h3>
                    <p className="text-xs text-pf-brown/60">{date.toLocaleDateString('es-ES',{day: '2-digit', month: '2-digit'})}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-pf-beige/50 p-1.5 rounded-lg">
                    <label htmlFor={`guests-${dateString}`} className="text-xs font-semibold text-pf-brown/80 whitespace-nowrap"><i className="fas fa-users"></i></label>
                    <input 
                        type="number"
                        id={`guests-${dateString}`}
                        value={dayPlan.guests}
                        onChange={(e) => handleGuestsChange(dateString, parseInt(e.target.value, 10) || 0)}
                        className="w-full p-1 border rounded bg-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-pf-green"
                    />
                  </div>
                  <MealSlot 
                    dateString={dateString}
                    meal="lunch" 
                    menu={savedMenuMap.get(dayPlan.lunch || '')}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                  />
                  <MealSlot 
                    dateString={dateString}
                    meal="dinner" 
                    menu={savedMenuMap.get(dayPlan.dinner || '')}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                  />
                </div>
              );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-pf-brown mb-4 pb-2 border-b-2 border-pf-blue">Mis Menús Guardados</h2>
        {savedMenus.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {savedMenus.map(menu => (
              <div key={menu.id} className="bg-white/80 p-4 rounded-xl shadow-md flex flex-col">
                  <DraggableMenuCard menu={menu} />
                  <div className="mt-3 pt-3 border-t border-pf-beige flex justify-end space-x-2">
                    <Button variant="secondary" onClick={() => onDeleteMenu(menu.id)} className="py-2 px-3 text-xs">
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                    <Button onClick={() => onLoadMenu(menu)} className="py-2 px-3 text-xs">
                      <i className="fas fa-upload mr-2"></i>Cargar
                    </Button>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/50 rounded-lg">
            <i className="fas fa-save fa-3x text-pf-brown/30 mb-4"></i>
            <p className="text-pf-brown text-xl">No tienes menús guardados.</p>
            <p className="text-pf-brown/80 mt-2">Ve al planificador para crear y guardar tu primer menú.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedMenus;