import React, { useEffect, useRef, useMemo } from 'react';
import { Recipe, InventoryItem } from '../types.ts';
import { calculateIngredientCosts } from '../utils/cost-utils.ts';

// Chart.js is loaded from a CDN in index.html, so we can expect it to be in the global scope.
declare const Chart: any;

interface RecipeCostAnalysisProps {
  recipe: Recipe;
  inventory: InventoryItem[];
}

const RecipeCostAnalysis: React.FC<RecipeCostAnalysisProps> = ({ recipe, inventory }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null); // Using 'any' for Chart instance to avoid type conflicts with global Chart object

  const { ingredientCosts, totalCost } = useMemo(() => calculateIngredientCosts(recipe, inventory), [recipe, inventory]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  useEffect(() => {
    if (chartRef.current && ingredientCosts.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const topIngredients = ingredientCosts.slice(0, 7);
      const otherCost = ingredientCosts.slice(7).reduce((sum, item) => sum + item.cost, 0);
      const chartData = [...topIngredients];
      if (otherCost > 0) {
        chartData.push({ name: 'Otros', cost: otherCost, percentage: (otherCost / totalCost) * 100, realCostPerUnit: 0, unit: '' });
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: chartData.map(item => item.name),
            datasets: [{
              label: 'Costo por Ingrediente',
              data: chartData.map(item => item.cost),
              backgroundColor: [
                '#8C947D', // pf-green
                '#E8C37F', // pf-gold
                '#9FACB4', // pf-blue
                '#5D4F3F', // pf-brown
                '#b5bca8',
                '#f0d6a5',
                '#c5ccd3',
              ],
              borderColor: '#f7f5f2', // A slightly off-white from bg-white/80
              borderWidth: 3,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 20,
                  padding: 15,
                  font: {
                    family: "'EB Garamond', sans-serif",
                    size: 14,
                  }
                }
              },
              tooltip: {
                bodyFont: {
                    family: "'EB Garamond', sans-serif",
                },
                titleFont: {
                    family: "'EB Garamond', sans-serif",
                },
                callbacks: {
                  label: function(context: any) {
                    let label = context.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed !== null) {
                      label += currencyFormatter.format(context.parsed);
                    }
                    const percentage = (context.parsed / totalCost * 100).toFixed(2);
                    return `${label} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [ingredientCosts, totalCost, currencyFormatter]);

  if (totalCost === 0) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-r-lg" role="alert">
        <p className="font-bold">Información de Costos Incompleta</p>
        <p>No se pudo calcular el costo. Asegúrate de que los ingredientes de esta receta estén en el inventario y tengan un costo por unidad asignado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center">
      <div className="lg:w-1/2">
        <h3 className="text-xl font-bold mb-4 text-pf-brown">Desglose de Ingredientes</h3>
        <div className="max-h-96 overflow-y-auto pr-2 bg-white/50 rounded-lg shadow-inner">
          <table className="w-full text-sm text-left text-pf-brown">
            <thead className="text-xs uppercase bg-pf-beige/50 sticky top-0">
              <tr>
                <th className="px-4 py-2">Ingrediente</th>
                <th className="px-4 py-2 text-right">Costo Real/Unidad</th>
                <th className="px-4 py-2 text-right">Costo Total Receta</th>
                <th className="px-4 py-2 text-right">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {ingredientCosts.map((item, index) => (
                <tr key={index} className="border-b border-pf-beige last:border-b-0">
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-right">
                    {item.realCostPerUnit > 0 ? `${currencyFormatter.format(item.realCostPerUnit)} / ${item.unit}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-right">{currencyFormatter.format(item.cost)}</td>
                  <td className="px-4 py-2 text-right">{item.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lg:w-1/2">
        <h3 className="text-xl font-bold mb-4 text-pf-brown">Distribución de Costos</h3>
        <div className="relative h-80 lg:h-96 w-full">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default RecipeCostAnalysis;