import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InventoryItem, Recipe, SavedMenu, WeeklyPlan, PurchaseOrder } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import { convertUnits } from '../utils/cost-utils.ts';

declare const Chart: any;
declare const jspdf: any;

type ReportView = 'value' | 'rotation' | 'cost';

// --- Helper Components & Functions ---

const toISODateString = (date: Date): string => date.toISOString().split('T')[0];

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
});

const TabButton: React.FC<{ name: string; view: ReportView; activeTab: ReportView; setActiveTab: (view: ReportView) => void }> = ({ name, view, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(view)}
        className={`py-2 px-4 text-lg font-semibold transition-colors duration-200 ${activeTab === view ? 'border-b-2 border-pf-green text-pf-brown' : 'text-pf-brown/60 hover:text-pf-brown'}`}
    >
        {name}
    </button>
);

// --- Stock Value Report Component ---

interface CategoryReport {
  name: string;
  itemCount: number;
  totalValue: number;
}

const StockValueReport: React.FC<{ items: InventoryItem[] }> = ({ items }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const reportData = useMemo(() => {
    const dataByCategory: { [key: string]: { items: InventoryItem[], totalValue: number } } = {};
    
    items.forEach(item => {
      if (!dataByCategory[item.category]) {
        dataByCategory[item.category] = { items: [], totalValue: 0 };
      }
      const itemValue = (item.quantity * item.costPerUnit) * (item.correctionFactor || 1);
      dataByCategory[item.category].items.push(item);
      dataByCategory[item.category].totalValue += itemValue;
    });

    const categoryReports: CategoryReport[] = Object.entries(dataByCategory)
      .map(([name, data]) => ({ name, itemCount: data.items.length, totalValue: data.totalValue }))
      .sort((a, b) => b.totalValue - a.totalValue);

    const grandTotalValue = categoryReports.reduce((sum, cat) => sum + cat.totalValue, 0);
    return { categoryReports, grandTotalValue };
  }, [items]);

  useEffect(() => {
    if (chartRef.current && reportData.categoryReports.length > 0) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: reportData.categoryReports.map(c => c.name),
            datasets: [{
              data: reportData.categoryReports.map(c => c.totalValue),
              backgroundColor: ['#8C947D', '#E8C37F', '#9FACB4', '#5D4F3F', '#b5bca8', '#f0d6a5', '#c5ccd3'],
              borderColor: '#f7f5f2',
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { font: { family: "'EB Garamond', sans-serif" }}},
              tooltip: {
                callbacks: {
                  label: (c: any) => {
                    const value = c.parsed ?? 0;
                    const percentage = reportData.grandTotalValue > 0 ? ((value / reportData.grandTotalValue) * 100).toFixed(2) : 0;
                    return `${c.label}: ${currencyFormatter.format(value)} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }
    return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
  }, [reportData]);
  
  const handleExportPDF = () => {
    // PDF Export logic...
  };

  return (
    <div className="animate-fade-in">
        <div className="flex justify-end mb-4">
            <Button onClick={handleExportPDF}><i className="fas fa-file-pdf mr-2"></i>Exportar a PDF</Button>
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-pf-brown mb-4">Resumen por Categoría</h3>
            <div className="max-h-96 overflow-y-auto pr-2 bg-white/50 rounded-lg shadow-inner">
              <table className="w-full text-sm text-left text-pf-brown">
                <thead className="text-xs uppercase bg-pf-beige/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Categoría</th>
                    <th className="px-4 py-2 text-center">Items</th>
                    <th className="px-4 py-2 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.categoryReports.map(cat => (
                    <tr key={cat.name} className="border-b border-pf-beige last:border-b-0">
                      <td className="px-4 py-3 font-medium">{cat.name}</td>
                      <td className="px-4 py-3 text-center">{cat.itemCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">{currencyFormatter.format(cat.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-sm font-bold bg-pf-beige/80 sticky bottom-0">
                    <tr>
                        <td className="px-4 py-3">Total General</td>
                        <td className="px-4 py-3 text-center">{reportData.categoryReports.reduce((sum, cat) => sum + cat.itemCount, 0)}</td>
                        <td className="px-4 py-3 text-right">{currencyFormatter.format(reportData.grandTotalValue)}</td>
                    </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="lg:col-span-1">
             <h3 className="text-xl font-bold text-pf-brown mb-4">Distribución de Valor</h3>
             <div className="relative h-96 w-full">
                <canvas ref={chartRef}></canvas>
             </div>
          </div>
        </div>
    </div>
  );
};

// --- Product Rotation Report Component ---

type RotationClass = 'Alta' | 'Media' | 'Baja' | 'Sin Movimiento';
interface RotationData {
  item: InventoryItem;
  consumption: number;
  daysOfStock: number;
  rotation: RotationClass;
}

const ProductRotationReport: React.FC<{ items: InventoryItem[], recipes: Recipe[], savedMenus: SavedMenu[], weeklyPlan: WeeklyPlan }> = ({ items, recipes, savedMenus, weeklyPlan }) => {
    const rotationData = useMemo((): RotationData[] => {
        const recipeMap = new Map(recipes.map(r => [r.id, r]));
        const savedMenuMap = new Map(savedMenus.map(m => [m.id, m]));
        const consumptionMap = new Map<string, number>();

        const today = new Date();
        for (let i = 0; i < 28; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = toISODateString(date);
            const dayPlan = weeklyPlan[dateString];
            if (!dayPlan) continue;
            
            const menuIds = [dayPlan.lunch, dayPlan.dinner].filter(Boolean) as string[];
            menuIds.forEach(menuId => {
                const menu = savedMenuMap.get(menuId);
                menu?.recipeIds.forEach(recipeId => {
                    const recipe = recipeMap.get(recipeId);
                    recipe?.ingredients.forEach(ing => {
                        const existingConsumption = consumptionMap.get(ing.name.toLowerCase()) || 0;
                        const quantityPerGuest = ing.quantity / recipe.servings;
                        consumptionMap.set(ing.name.toLowerCase(), existingConsumption + (quantityPerGuest * dayPlan.guests));
                    });
                });
            });
        }
        
        return items.map(item => {
            const consumption = consumptionMap.get(item.name.toLowerCase()) || 0;
            const avgDailyConsumption = consumption / 28;
            const daysOfStock = avgDailyConsumption > 0 ? item.quantity / avgDailyConsumption : Infinity;
            
            let rotation: RotationClass = 'Sin Movimiento';
            if (daysOfStock === Infinity && item.quantity > 0) rotation = 'Baja';
            else if (daysOfStock < 7) rotation = 'Alta';
            else if (daysOfStock < 30) rotation = 'Media';
            else if (daysOfStock < Infinity) rotation = 'Baja';

            return { item, consumption, daysOfStock, rotation };
        }).sort((a,b) => b.consumption - a.consumption);
    }, [items, recipes, savedMenus, weeklyPlan]);

    return (
        <div className="animate-fade-in max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm text-left text-pf-brown">
                <thead className="text-xs uppercase bg-pf-beige/50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2">Producto</th>
                        <th className="px-4 py-2">Consumo (28 días)</th>
                        <th className="px-4 py-2">Stock Actual</th>
                        <th className="px-4 py-2">Días de Stock (Est.)</th>
                        <th className="px-4 py-2">Rotación</th>
                    </tr>
                </thead>
                <tbody>
                    {rotationData.map(data => (
                        <tr key={data.item.id} className="border-b border-pf-beige last:border-b-0">
                            <td className="px-4 py-3 font-medium">{data.item.name}</td>
                            <td className="px-4 py-3">{data.consumption.toFixed(2)} {data.item.unit}</td>
                            <td className="px-4 py-3">{data.item.quantity.toFixed(2)} {data.item.unit}</td>
                            <td className="px-4 py-3 font-semibold">{isFinite(data.daysOfStock) ? Math.round(data.daysOfStock) : '∞'}</td>
                            <td className="px-4 py-3">{data.rotation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- Cost Analysis Report Component ---

interface PriceHistoryPoint {
    date: string;
    cost: number;
    supplier: string;
}

const CostAnalysisReport: React.FC<{ items: InventoryItem[], purchaseOrders: PurchaseOrder[] }> = ({ items, purchaseOrders }) => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    const priceHistory = useMemo((): PriceHistoryPoint[] => {
        if (!selectedItemId) return [];
        
        const selectedItem = items.find(i => i.id === selectedItemId);
        if (!selectedItem) return [];

        const history: PriceHistoryPoint[] = [];
        purchaseOrders
            .filter(po => po.status === 'Realizado')
            .forEach(po => {
                const itemInOrder = po.items.find(i => i.itemId === selectedItemId);
                if (itemInOrder) {
                    history.push({
                        date: po.createdAt,
                        cost: itemInOrder.costPerUnit,
                        supplier: po.supplierName
                    });
                }
            });
        
        // Add current inventory price point
        history.push({
            date: selectedItem.purchaseDate,
            cost: selectedItem.costPerUnit,
            supplier: 'Stock Actual'
        });

        return history.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [selectedItemId, purchaseOrders, items]);

    useEffect(() => {
        if (chartRef.current && priceHistory.length > 0) {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: priceHistory.map(p => new Date(p.date).toLocaleDateString()),
                        datasets: [{
                            label: 'Costo por Unidad',
                            data: priceHistory.map(p => p.cost),
                            borderColor: '#8C947D',
                            backgroundColor: '#8C947D',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }},
                        scales: { y: { ticks: { callback: (v: number) => currencyFormatter.format(v) }}}
                    }
                });
            }
        }
        return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
    }, [priceHistory]);


    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <label htmlFor="item-select" className="block text-sm font-medium text-pf-brown/80 mb-1">Selecciona un producto para analizar:</label>
                <select id="item-select" value={selectedItemId || ''} onChange={e => setSelectedItemId(e.target.value)} className="w-full max-w-md p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green">
                    <option value="" disabled>-- Elige un producto --</option>
                    {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </div>

            {selectedItemId && priceHistory.length > 1 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                    <div className="h-96">
                        <canvas ref={chartRef}></canvas>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left text-pf-brown">
                            <thead className="text-xs uppercase bg-pf-beige/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Fecha</th>
                                    <th className="px-4 py-2">Costo/Unidad</th>
                                    <th className="px-4 py-2">Proveedor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceHistory.map((p, i) => (
                                    <tr key={i} className="border-b border-pf-beige last:border-b-0">
                                        <td className="px-4 py-3">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-semibold">{currencyFormatter.format(p.cost)}</td>
                                        <td className="px-4 py-3">{p.supplier}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : selectedItemId ? (
                 <div className="text-center py-16 text-pf-brown/70">
                    <p>No hay suficiente historial de compras para este producto.</p>
                </div>
            ) : (
                <div className="text-center py-16 text-pf-brown/70">
                    <p>Selecciona un producto para ver su historial de costos.</p>
                </div>
            )}
        </div>
    );
};


// --- Main Modal Component ---

interface InventoryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  recipes: Recipe[];
  savedMenus: SavedMenu[];
  weeklyPlan: WeeklyPlan;
  purchaseOrders: PurchaseOrder[];
}

const InventoryReportModal: React.FC<InventoryReportModalProps> = ({ isOpen, onClose, items, ...props }) => {
  const [activeTab, setActiveTab] = useState<ReportView>('value');

  useEffect(() => {
    if (isOpen) {
        setActiveTab('value');
    }
  }, [isOpen]);

  const renderContent = () => {
    switch(activeTab) {
      case 'value':
        return <StockValueReport items={items} />;
      case 'rotation':
        return <ProductRotationReport items={items} recipes={props.recipes} savedMenus={props.savedMenus} weeklyPlan={props.weeklyPlan} />;
      case 'cost':
        return <CostAnalysisReport items={items} purchaseOrders={props.purchaseOrders} />;
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Centro de Análisis de Inventario" size="xl">
        <div className="px-6 pt-6">
            <div className="border-b border-pf-brown/20 flex space-x-2 mb-6">
                <TabButton name="Valor de Stock" view="value" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Rotación de Productos" view="rotation" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Análisis de Costos" view="cost" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            {isOpen && renderContent()}
        </div>
        <div className="bg-pf-beige/50 px-6 py-4 flex justify-end mt-6">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
    </Modal>
  );
};

export default InventoryReportModal;
