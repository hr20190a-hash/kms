import React, { useState, useEffect, useMemo } from 'react';
import { Recipe, InventoryItem, SavedMenu, WeeklyPlan, BulkPurchaseSuggestion, Supplier } from '../types.ts';
import { getBulkPurchaseSuggestion } from '../services/geminiService.ts';
import { convertUnits } from '../utils/cost-utils.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';

interface BulkPurchaseSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  inventory: InventoryItem[];
  savedMenus: SavedMenu[];
  weeklyPlan: WeeklyPlan;
  suppliers: Supplier[];
}

const toISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const BulkPurchaseSuggestionModal: React.FC<BulkPurchaseSuggestionModalProps> = ({ isOpen, onClose, recipes, inventory, savedMenus, weeklyPlan, suppliers }) => {
  const [suggestions, setSuggestions] = useState<BulkPurchaseSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState('Iniciando análisis...');

  const recipeMap = useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes]);
  const savedMenuMap = useMemo(() => new Map(savedMenus.map(m => [m.id, m])), [savedMenus]);
  const inventoryMap = useMemo(() => new Map(inventory.map(i => [i.name.toLowerCase(), i])), [inventory]);
  const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  useEffect(() => {
    if (isOpen) {
      const analyze = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);

        try {
          // 1. Calculate usage from the last 4 weeks
          setAnalysisMessage('Analizando consumo de las últimas 4 semanas...');
          const today = new Date();
          const last28days = Array.from({ length: 28 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            return toISODateString(d);
          });

          const ingredientUsage = new Map<string, { totalQuantity: number, unit: string }>();

          last28days.forEach(dateString => {
            const dayPlan = weeklyPlan[dateString];
            if (!dayPlan) return;
            
            const menuIds = [dayPlan.lunch, dayPlan.dinner].filter(Boolean) as string[];
            menuIds.forEach(menuId => {
              const menu = savedMenuMap.get(menuId);
              menu?.recipeIds.forEach(recipeId => {
                const recipe = recipeMap.get(recipeId);
                recipe?.ingredients.forEach(ing => {
                  const key = ing.name.toLowerCase();
                  const existing = ingredientUsage.get(key) || { totalQuantity: 0, unit: ing.unit };
                  const convertedQuantity = convertUnits(ing.quantity, ing.unit, existing.unit);
                  existing.totalQuantity += convertedQuantity * (dayPlan.guests || 1) / recipe.servings;
                  ingredientUsage.set(key, existing);
                });
              });
            });
          });
          
          // 2. Identify top 5 most used ingredients that are in inventory
          setAnalysisMessage('Identificando ingredientes más frecuentes...');
          const topIngredients = Array.from(ingredientUsage.entries())
            .map(([name, usage]) => ({ name, ...usage, inventoryItem: inventoryMap.get(name) }))
            .filter(item => item.inventoryItem) // Only consider items we have in inventory
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 5);

          // 3. Filter out ingredients with sufficient stock
          const ingredientsToAnalyze = topIngredients.filter(ing => {
              if (!ing.inventoryItem) return false;
              // Don't suggest if we have more than a month's supply
              return ing.inventoryItem.quantity < ing.totalQuantity; 
          });

          if (ingredientsToAnalyze.length === 0) {
            setAnalysisMessage('No se encontraron oportunidades de compra. ¡Tu inventario está bien abastecido para los ingredientes de alta rotación!');
            setIsLoading(false);
            return;
          }

          // 4. Get AI suggestions for each
          setAnalysisMessage(`Consultando IA para ${ingredientsToAnalyze.length} ingrediente(s)...`);
          const suggestionPromises = ingredientsToAnalyze.map(async (ing) => {
            if (!ing.inventoryItem) return null;
            const supplier = ing.inventoryItem.supplierId ? supplierMap.get(ing.inventoryItem.supplierId) : undefined;
            const analysis = await getBulkPurchaseSuggestion(ing.inventoryItem, supplier, ing.totalQuantity);
            
            if (analysis.isRecommended && analysis.estimatedSavingsPerUnit > 0) {
              return {
                ingredientName: ing.inventoryItem.name,
                inventoryItem: ing.inventoryItem,
                fourWeekUsage: { quantity: ing.totalQuantity, unit: ing.inventoryItem.unit },
                analysis,
              };
            }
            return null;
          });

          const results = (await Promise.all(suggestionPromises)).filter(Boolean) as BulkPurchaseSuggestion[];
          setSuggestions(results);

        } catch (e) {
          console.error(e);
          setError('Ocurrió un error durante el análisis. Por favor, inténtalo de nuevo.');
        } finally {
          setIsLoading(false);
          setAnalysisMessage('');
        }
      };

      analyze();
    }
  }, [isOpen]);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Spinner />
          <p className="mt-4 text-pf-brown/80">{analysisMessage}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      );
    }
    if (suggestions.length > 0) {
      return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <p className="text-pf-brown/90 mb-4">Basado en tu consumo y precios actuales, aquí hay algunas oportunidades de ahorro:</p>
            {suggestions.map((s, index) => (
                <div key={index} className="bg-pf-beige/50 p-4 rounded-lg border-l-4 border-pf-green">
                    <h4 className="font-bold text-lg text-pf-brown">{s.ingredientName}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-3 text-center">
                        <div className="bg-white/70 p-2 rounded">
                            <p className="text-xs font-semibold text-pf-brown/70">Precio Actual</p>
                            <p className="font-bold text-pf-brown">{currencyFormatter.format(s.inventoryItem.costPerUnit)} / {s.inventoryItem.unit}</p>
                        </div>
                         <div className="bg-white/70 p-2 rounded">
                            <p className="text-xs font-semibold text-pf-brown/70">Precio Bulk (Est.)</p>
                            <p className="font-bold text-pf-green">{currencyFormatter.format(s.analysis.estimatedBulkPricePerUnit)} / {s.inventoryItem.unit}</p>
                        </div>
                         <div className="bg-green-100 p-2 rounded">
                            <p className="text-xs font-semibold text-green-800">Ahorro Estimado</p>
                            <p className="font-bold text-green-800">{currencyFormatter.format(s.analysis.estimatedSavingsPerUnit)} / {s.inventoryItem.unit}</p>
                        </div>
                         <div className="bg-blue-100 p-2 rounded">
                            <p className="text-xs font-semibold text-blue-800">Compra Sugerida</p>
                            <p className="font-bold text-blue-800">{s.analysis.suggestedBulkQuantity}</p>
                        </div>
                    </div>
                     <p className="text-sm text-pf-brown italic"><strong>Recomendación IA:</strong> "{s.analysis.justification}"</p>
                </div>
            ))}
        </div>
      );
    }

    return (
      <div className="text-center text-pf-brown/70 h-64 flex flex-col items-center justify-center">
        <i className="fas fa-check-circle fa-3x text-pf-green mb-4"></i>
        <p className="font-semibold">¡Todo en orden!</p>
        <p>{analysisMessage || "No se encontraron oportunidades de ahorro significativas en este momento."}</p>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sugerencias de Compra al por Mayor">
      <div className="p-6">
        {renderContent()}
      </div>
      <div className="bg-pf-beige/50 px-6 py-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};

export default BulkPurchaseSuggestionModal;