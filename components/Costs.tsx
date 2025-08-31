import React, { useMemo, useState } from 'react';
import { Recipe, InventoryItem, SavedMenu, WeeklyPlan, Supplier, WasteLogEntry, YieldTest } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import { calculateRecipeCost, calculateMenuCostPerGuest } from '../utils/cost-utils.ts';
import RecipeCostAnalysis from './RecipeCostAnalysis.tsx';
import Button from './common/Button.tsx';
import BulkPurchaseSuggestionModal from './BulkPurchaseSuggestionModal.tsx';
import BudgetReports from './BudgetReports.tsx';
import WasteCostReport from './WasteCostReport.tsx';

type CostView = 'recipes' | 'planner' | 'reports' | 'waste' | 'yield';

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

interface CostsProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  savedMenus: SavedMenu[];
  weeklyPlan: WeeklyPlan;
  suppliers: Supplier[];
  wasteLogEntries: WasteLogEntry[];
  yieldTests: YieldTest[];
  onOpenNewYieldTest: () => void;
  onOpenEditYieldTest: (test: YieldTest) => void;
  onDeleteYieldTest: (testId: string) => void;
}

const Costs: React.FC<CostsProps> = ({ recipes, inventory, savedMenus, weeklyPlan, suppliers, wasteLogEntries, yieldTests, onOpenNewYieldTest, onOpenEditYieldTest, onDeleteYieldTest }) => {
  const [activeTab, setActiveTab] = useState<CostView>('recipes');
  const [isBulkSuggestModalOpen, setIsBulkSuggestModalOpen] = useState(false);
  const [budgets, setBudgets] = useState({
    daily: 500000,
    weekly: 3500000,
    monthly: 15000000,
  });
  
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  // --- Recipe Costs View ---
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const todayString = toISODateString(new Date());
  const guestsToday = weeklyPlan[todayString]?.guests || 0;

  const recipeCosts = useMemo(() =>
    recipes.map(recipe => ({
      ...recipe,
      ...calculateRecipeCost(recipe, inventory)
    })).sort((a,b) => b.totalCost - a.totalCost),
    [recipes, inventory]
  );
  const handleToggleExpand = (recipeId: string) => {
    setExpandedRecipeId(prevId => (prevId === recipeId ? null : recipeId));
  };
  
  // --- Planner Costs View ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const savedMenuMap = useMemo(() => new Map(savedMenus.map(m => [m.id, m])), [savedMenus]);

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
  });

  const weeklyCosts = useMemo(() => {
    let totalWeeklyCost = 0;

    const dailyBreakdown = weekDates.map(date => {
        const dateString = toISODateString(date);
        const plan = weeklyPlan[dateString];
        const guests = plan?.guests || 0;

        let dailyCostForGuests = 0;
        
        if (plan?.lunch) {
            const menu = savedMenuMap.get(plan.lunch);
            if (menu) {
                const costPerGuest = calculateMenuCostPerGuest(menu, recipes, inventory);
                dailyCostForGuests += costPerGuest * guests;
            }
        }
        
        if (plan?.dinner) {
            const menu = savedMenuMap.get(plan.dinner);
            if (menu) {
                const costPerGuest = calculateMenuCostPerGuest(menu, recipes, inventory);
                dailyCostForGuests += costPerGuest * guests;
            }
        }
        
        totalWeeklyCost += dailyCostForGuests;
        return { date, dateString, total: dailyCostForGuests };
    });

    return { dailyBreakdown, totalWeeklyCost };
  }, [weekDates, weeklyPlan, savedMenuMap, recipes, inventory]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentDate(new Date(e.target.value));
  };
  const handleSetWeek = (offset: number) => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(prev.getDate() + offset);
          return newDate;
      });
  };

  const renderRecipeCosts = () => (
    <div>
        <div className="mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-r-lg" role="alert">
            <p className="font-bold">Costo Total Proyectado para Hoy</p>
            <p>Los costos totales se calculan en base a los <strong className="font-extrabold">{guestsToday}</strong> huéspedes planificados para el día de hoy en el Programador Semanal.</p>
        </div>
        <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-pf-brown">
            <thead className="text-xs text-pf-brown uppercase bg-pf-beige/50">
                <tr>
                    <th scope="col" className="px-6 py-3">Nombre de la Receta</th>
                    <th scope="col" className="px-6 py-3">Porciones Base</th>
                    <th scope="col" className="px-6 py-3">Costo / Porción</th>
                    <th scope="col" className="px-6 py-3">Costo Receta Base</th>
                    <th scope="col" className="px-6 py-3 text-pf-green font-extrabold">Costo Total ({guestsToday} Huéspedes)</th>
                </tr>
            </thead>
            <tbody>
                {recipeCosts.map(recipe => (
                <React.Fragment key={recipe.id}>
                    <tr className="bg-white border-b border-pf-beige hover:bg-pf-beige/40 cursor-pointer" onClick={() => handleToggleExpand(recipe.id)}>
                    <td className="px-6 py-4 font-medium text-pf-brown whitespace-nowrap">
                        {recipe.name}
                        <i className={`fas fa-chevron-down ml-2 transition-transform duration-200 ${expandedRecipeId === recipe.id ? 'rotate-180' : ''}`}></i>
                    </td>
                    <td className="px-6 py-4">{recipe.servings}</td>
                    <td className="px-6 py-4 font-bold text-pf-brown">{currencyFormatter.format(recipe.costPerServing)}</td>
                    <td className="px-6 py-4">{currencyFormatter.format(recipe.totalCost)}</td>
                    <td className="px-6 py-4 font-bold text-lg text-pf-green">{currencyFormatter.format(recipe.costPerServing * guestsToday)}</td>
                    </tr>
                    {expandedRecipeId === recipe.id && (
                    <tr className="bg-pf-beige/30">
                        <td colSpan={5} className="p-0"><div className="p-6 transition-all duration-500 ease-in-out"><RecipeCostAnalysis recipe={recipe} inventory={inventory} /></div></td>
                    </tr>
                    )}
                </React.Fragment>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    </div>
  );

  const renderPlannerCosts = () => (
    <div>
        <div className="mb-6 bg-white/80 p-4 rounded-xl shadow-md flex items-center justify-center space-x-4">
            <button onClick={() => handleSetWeek(-7)} className="p-2 text-pf-brown hover:text-pf-green"><i className="fas fa-chevron-left"></i></button>
            <input
                type="date"
                value={toISODateString(currentDate)}
                onChange={handleDateChange}
                className="p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green text-center font-semibold"
            />
            <button onClick={() => handleSetWeek(7)} className="p-2 text-pf-brown hover:text-pf-green"><i className="fas fa-chevron-right"></i></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {weeklyCosts.dailyBreakdown.map(({ date, dateString, total }) => {
                const dayPlan = weeklyPlan[dateString];
                const lunchMenu = dayPlan?.lunch ? savedMenuMap.get(dayPlan.lunch) : null;
                const dinnerMenu = dayPlan?.dinner ? savedMenuMap.get(dayPlan.dinner) : null;
                const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });

                return (
                    <div key={dateString} className="bg-white/80 rounded-xl shadow-md overflow-hidden flex flex-col">
                        <div className="bg-pf-brown text-pf-beige p-3 text-center">
                            <h4 className="font-bold text-lg uppercase tracking-wider">{dayName}</h4>
                            <p className="text-xs opacity-80">{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                        </div>
                        <div className="p-4 space-y-3 flex-grow">
                             <div>
                                <h5 className="font-semibold text-pf-brown/80 text-sm">Almuerzo</h5>
                                <p className="font-medium text-pf-brown truncate">{lunchMenu?.name || 'No planificado'}</p>
                            </div>
                             <div>
                                <h5 className="font-semibold text-pf-brown/80 text-sm">Cena</h5>
                                <p className="font-medium text-pf-brown truncate">{dinnerMenu?.name || 'No planificado'}</p>
                            </div>
                        </div>
                        <div className="bg-pf-beige/50 p-3 mt-auto text-right">
                             <p className="text-xs font-semibold text-pf-brown/80">({dayPlan?.guests || 0} Huéspedes)</p>
                            <span className="font-bold text-lg text-pf-brown">{currencyFormatter.format(total)}</span>
                        </div>
                    </div>
                );
            })}
             <div className="bg-pf-green text-white rounded-xl shadow-lg p-6 flex flex-col justify-center items-center lg:col-span-2 xl:col-span-1">
                <h4 className="font-bold text-xl uppercase tracking-wider">Total Semanal</h4>
                <p className="font-extrabold text-4xl mt-2">{currencyFormatter.format(weeklyCosts.totalWeeklyCost)}</p>
            </div>
        </div>
    </div>
  );
  
  const renderYieldTests = () => (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={onOpenNewYieldTest}>
          <i className="fas fa-plus mr-2"></i>Nueva Ficha de Rendimiento
        </Button>
      </div>
      <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-pf-brown">
            <thead className="text-xs text-pf-brown uppercase bg-pf-beige/50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Ingrediente</th>
                <th className="px-6 py-3">Rendimiento</th>
                <th className="px-6 py-3">Costo Bruto/kg</th>
                <th className="px-6 py-3">Costo Real/kg</th>
                <th className="px-6 py-3">Realizado por</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {yieldTests.map(test => (
                <tr key={test.id} className="bg-white border-b border-pf-beige hover:bg-pf-beige/40">
                  <td className="px-6 py-4">{new Date(test.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium">{test.ingredientName}</td>
                  <td className="px-6 py-4 font-semibold text-pf-blue">{test.yieldPercentage.toFixed(2)}%</td>
                  <td className="px-6 py-4">{currencyFormatter.format(test.costPerKgGross)}</td>
                  <td className="px-6 py-4 font-bold text-pf-green">{currencyFormatter.format(test.realCostPerKgNet)}</td>
                  <td className="px-6 py-4">{test.performedBy}</td>
                  <td className="px-6 py-4 flex items-center space-x-4">
                    <button onClick={() => onOpenEditYieldTest(test)} className="font-medium text-pf-green hover:text-pf-brown">
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button onClick={() => onDeleteYieldTest(test.id)} className="font-medium text-red-600 hover:text-red-900">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'recipes':
        return renderRecipeCosts();
      case 'planner':
        return renderPlannerCosts();
      case 'reports':
        return <BudgetReports 
                  weeklyPlan={weeklyPlan} 
                  savedMenus={savedMenus}
                  recipes={recipes}
                  inventory={inventory}
                  budgets={budgets}
                  onBudgetChange={setBudgets}
                />;
      case 'waste':
        return <WasteCostReport
                  wasteLogs={wasteLogEntries}
                  inventory={inventory}
                />;
      case 'yield':
        return renderYieldTests();
      default:
        return null;
    }
  }

  return (
    <div className="animate-fade-in">
       <div className="flex justify-between items-start">
        <PageHeader
            title="Análisis de Costos"
            subtitle="Analiza costos por receta, planificación, presupuestos y desperdicios."
        />
        <Button onClick={() => setIsBulkSuggestModalOpen(true)}>
            <i className="fas fa-shopping-basket mr-2"></i>
            Sugerir Compras
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-pf-brown/20 flex space-x-4">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${activeTab === 'recipes' ? 'border-b-2 border-pf-green text-pf-brown' : 'text-pf-brown/60 hover:text-pf-brown'}`}
          >
            Costos por Receta
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${activeTab === 'planner' ? 'border-b-2 border-pf-green text-pf-brown' : 'text-pf-brown/60 hover:text-pf-brown'}`}
          >
            Costos del Programador
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${activeTab === 'reports' ? 'border-b-2 border-pf-green text-pf-brown' : 'text-pf-brown/60 hover:text-pf-brown'}`}
          >
            Reportes de Presupuesto
          </button>
          <button
            onClick={() => setActiveTab('waste')}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${activeTab === 'waste' ? 'border-b-2 border-pf-green text-pf-brown' : 'text-pf-brown/60 hover:text-pf-brown'}`}
          >
            Reporte de Desperdicios
          </button>
          <button
            onClick={() => setActiveTab('yield')}
            className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${activeTab === 'yield' ? 'border-b-2 border-pf-green text-pf-brown' : 'text-pf-brown/60 hover:text-pf-brown'}`}
          >
            Ficha de Rendimiento
          </button>
        </div>
      </div>
      
      {renderContent()}

      <BulkPurchaseSuggestionModal
        isOpen={isBulkSuggestModalOpen}
        onClose={() => setIsBulkSuggestModalOpen(false)}
        recipes={recipes}
        inventory={inventory}
        savedMenus={savedMenus}
        weeklyPlan={weeklyPlan}
        suppliers={suppliers}
      />
    </div>
  );
};

export default Costs;