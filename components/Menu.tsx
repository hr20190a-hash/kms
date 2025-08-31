import React, { useState, useMemo } from 'react';
import { Recipe, InventoryItem } from '../types.ts';
import { calculateRecipeCost } from '../utils/cost-utils.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';
import WasteRecipeSuggestionModal from './WasteRecipeSuggestionModal.tsx';

interface MenuProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  menuItems: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
  onRemoveRecipe: (recipeId: string) => void;
  onClearMenu: () => void;
  onSaveMenu: () => void;
}

const Menu: React.FC<MenuProps> = ({ recipes, inventory, menuItems, onAddRecipe, onRemoveRecipe, onClearMenu, onSaveMenu }) => {
  const [guests, setGuests] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  const menuCosts = useMemo(() => {
    if (menuItems.length === 0) {
      return { costPerGuest: 0, totalCost: 0 };
    }

    const costPerGuest = menuItems.reduce((total, recipe) => {
      const { costPerServing } = calculateRecipeCost(recipe, inventory);
      return total + costPerServing;
    }, 0);

    const totalCost = costPerGuest * guests;

    return { costPerGuest, totalCost };
  }, [menuItems, guests, inventory]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Planificador de Menús"
        subtitle="Crea menús y calcula sus costos en base al número de huéspedes."
      />
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Recipe List */}
        <div className="lg:w-1/2 bg-white/80 p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-pf-brown mb-4">Recetas Disponibles</h3>
          <input
            type="text"
            placeholder="Buscar receta por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 mb-4 bg-white border border-pf-brown/20 rounded-lg text-pf-brown placeholder-pf-brown/60 focus:outline-none focus:ring-2 focus:ring-pf-green"
          />
          <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
            {filteredRecipes.map(recipe => (
              <div key={recipe.id} className="flex items-center justify-between p-3 bg-pf-beige/50 rounded-lg">
                <div className="flex items-center">
                  <img src={recipe.imageUrl} alt={recipe.name} className="w-12 h-12 object-cover rounded-md mr-4" />
                  <span className="font-semibold">{recipe.name}</span>
                </div>
                <button
                  onClick={() => onAddRecipe(recipe)}
                  disabled={!!menuItems.find(r => r.id === recipe.id)}
                  className="text-pf-green hover:text-pf-brown disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  title="Añadir al menú"
                >
                  <i className="fas fa-plus-circle fa-lg"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Menu Builder & Costs */}
        <div className="lg:w-1/2">
            <div className="bg-white/80 p-6 rounded-xl shadow-md sticky top-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-pf-brown">Menú Actual</h3>
                    <div className="flex items-center space-x-2">
                        <Button onClick={onSaveMenu} disabled={menuItems.length === 0} className="py-2 px-4">
                            <i className="fas fa-save mr-2"></i>Guardar Menú
                        </Button>
                        <Button variant="secondary" onClick={onClearMenu} disabled={menuItems.length === 0} className="py-2 px-4">
                            Limpiar
                        </Button>
                    </div>
                </div>
                <div className="mb-4">
                    <label htmlFor="guests" className="block text-sm font-medium text-pf-brown/80 mb-1">Número de Huéspedes</label>
                    <input
                        type="number"
                        id="guests"
                        value={guests}
                        onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green"
                    />
                </div>
                 <div className="mb-4">
                    <Button 
                        variant="secondary" 
                        onClick={() => setIsWasteModalOpen(true)} 
                        disabled={menuItems.length === 0}
                        fullWidth
                    >
                        <i className="fas fa-recycle mr-2"></i>Sugerir Recetas con Residuos
                    </Button>
                </div>
                <div className="min-h-48 max-h-64 overflow-y-auto pr-2 space-y-3 border-t border-b border-pf-beige py-4">
                    {menuItems.length > 0 ? (
                        menuItems.map(recipe => (
                        <div key={recipe.id} className="flex items-center justify-between p-2 bg-pf-beige/50 rounded-lg animate-fade-in">
                            <span className="font-semibold text-pf-brown">{recipe.name}</span>
                            <button onClick={() => onRemoveRecipe(recipe.id)} className="text-red-500 hover:text-red-700" title="Quitar del menú">
                            <i className="fas fa-times-circle"></i>
                            </button>
                        </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 flex items-center justify-center h-full">
                        <p>Añade recetas desde la lista de la izquierda.</p>
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4">
                    <h4 className="text-lg font-bold text-pf-brown mb-3">Análisis de Costos</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-pf-beige p-3 rounded-lg">
                            <span className="font-semibold">Costo por Huésped</span>
                            <span className="font-bold text-lg">{currencyFormatter.format(menuCosts.costPerGuest)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-pf-green/20 p-4 rounded-lg">
                            <span className="font-semibold text-xl">Costo Total del Menú</span>
                            <span className="font-extrabold text-2xl text-pf-green">{currencyFormatter.format(menuCosts.totalCost)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
       <WasteRecipeSuggestionModal
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        menuItems={menuItems}
      />
    </div>
  );
};

export default Menu;