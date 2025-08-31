import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WeeklyPlan, SavedMenu, Recipe, InventoryItem } from '../types.ts';
import { calculateMenuCostPerGuest } from '../utils/cost-utils.ts';
import Button from './common/Button.tsx';

declare const Chart: any;
declare const jspdf: any;

interface BudgetReportsProps {
  weeklyPlan: WeeklyPlan;
  savedMenus: SavedMenu[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  budgets: { daily: number; weekly: number; monthly: number };
  onBudgetChange: (newBudgets: { daily: number; weekly: number; monthly: number }) => void;
}

type ReportType = 'daily' | 'weekly' | 'monthly';

const toISODateString = (date: Date): string => date.toISOString().split('T')[0];

const BudgetReports: React.FC<BudgetReportsProps> = ({ weeklyPlan, savedMenus, recipes, inventory, budgets, onBudgetChange }) => {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const savedMenuMap = useMemo(() => new Map(savedMenus.map(m => [m.id, m])), [savedMenus]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }), []);

  const calculateCostForDate = (dateString: string): number => {
    const plan = weeklyPlan[dateString];
    if (!plan) return 0;
    const guests = plan.guests || 0;
    let dailyCost = 0;
    if (plan.lunch) {
      const menu = savedMenuMap.get(plan.lunch);
      if (menu) dailyCost += calculateMenuCostPerGuest(menu, recipes, inventory) * guests;
    }
    if (plan.dinner) {
      const menu = savedMenuMap.get(plan.dinner);
      if (menu) dailyCost += calculateMenuCostPerGuest(menu, recipes, inventory) * guests;
    }
    return dailyCost;
  };

  const reportData = useMemo(() => {
    let labels: string[] = [];
    let data: number[] = [];
    let totalActualCost = 0;
    let budgetForPeriod = 0;

    if (reportType === 'daily') {
      const dateString = toISODateString(currentDate);
      const cost = calculateCostForDate(dateString);
      labels = [currentDate.toLocaleDateString('es-ES', { weekday: 'long' })];
      data = [cost];
      totalActualCost = cost;
      budgetForPeriod = budgets.daily;
    } else if (reportType === 'weekly') {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      for (let i = 0; i < 7; i++) {
        const weekDay = new Date(startOfWeek);
        weekDay.setDate(startOfWeek.getDate() + i);
        const cost = calculateCostForDate(toISODateString(weekDay));
        labels.push(weekDay.toLocaleDateString('es-ES', { weekday: 'short' }));
        data.push(cost);
        totalActualCost += cost;
      }
      budgetForPeriod = budgets.weekly;
    } else if (reportType === 'monthly') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeklyCosts: { [week: number]: number } = {};
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const cost = calculateCostForDate(toISODateString(date));
            const weekNumber = Math.ceil((date.getDate() + new Date(year, month, 1).getDay()) / 7);
            weeklyCosts[weekNumber] = (weeklyCosts[weekNumber] || 0) + cost;
        }

        labels = Object.keys(weeklyCosts).map(w => `Semana ${w}`);
        data = Object.values(weeklyCosts);
        totalActualCost = data.reduce((a, b) => a + b, 0);
        budgetForPeriod = budgets.monthly;
    }

    const variance = budgetForPeriod - totalActualCost;
    return { labels, data, totalActualCost, budgetForPeriod, variance };
  }, [reportType, currentDate, weeklyPlan, budgets, savedMenuMap, recipes, inventory]);

  useEffect(() => {
    if (chartRef.current && reportData) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: reportData.labels,
            datasets: [{
              label: 'Costo Real',
              data: reportData.data,
              backgroundColor: '#8C947D',
              borderColor: '#5D4F3F',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { callback: (value: number) => currencyFormatter.format(value) }
              }
            }
          }
        });
      }
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy() };
  }, [reportData, currencyFormatter]);

  const handleBudgetChange = (type: ReportType, value: number) => {
    onBudgetChange({ ...budgets, [type]: value });
  };
  
  const handleExportPDF = () => {
    const doc = new jspdf.jsPDF();
    const chartImage = chartRef.current?.toDataURL('image/png', 1.0);

    doc.setFont('EB Garamond', 'bold');
    doc.setFontSize(22);
    doc.text(`Reporte de Presupuesto ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 105, 20, { align: 'center' });
    
    doc.setFont('EB Garamond', 'normal');
    doc.setFontSize(12);
    doc.text(`Fecha: ${currentDate.toLocaleDateString('es-ES')}`, 14, 35);
    doc.text(`Presupuesto: ${currencyFormatter.format(reportData.budgetForPeriod)}`, 14, 42);
    doc.text(`Costo Real: ${currencyFormatter.format(reportData.totalActualCost)}`, 14, 49);
    doc.text(`Varianza: ${currencyFormatter.format(reportData.variance)}`, 14, 56);

    if (chartImage) {
        doc.addImage(chartImage, 'PNG', 14, 70, 180, 80);
    }
    
    (doc as any).autoTable({
        head: [['Período', 'Costo']],
        body: reportData.labels.map((label, index) => [label, currencyFormatter.format(reportData.data[index])]),
        startY: 155,
        theme: 'grid',
        headStyles: { fillColor: [93, 79, 63] },
        styles: { font: 'EB Garamond' }
    });

    doc.save(`Reporte_Presupuesto_${reportType}_${toISODateString(currentDate)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {(['daily', 'weekly', 'monthly'] as ReportType[]).map(type => (
            <button key={type} onClick={() => setReportType(type)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${reportType === type ? 'bg-pf-green text-white shadow-md' : 'bg-pf-beige text-pf-brown hover:bg-opacity-80'}`}>
              {type === 'daily' ? 'Diario' : type === 'weekly' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
          <input type="date" value={toISODateString(currentDate)} onChange={e => setCurrentDate(new Date(e.target.value))} className="p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green font-semibold"/>
        </div>
        <div className="flex items-center space-x-2">
          <label className="font-semibold">Presupuesto {reportType}:</label>
          <input type="number" value={budgets[reportType]} onChange={e => handleBudgetChange(reportType, parseInt(e.target.value) || 0)} className="w-40 p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green"/>
        </div>
        <Button onClick={handleExportPDF}><i className="fas fa-file-pdf mr-2"></i>Exportar a PDF</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 p-6 rounded-xl shadow-md text-center">
            <h4 className="text-sm font-semibold text-pf-brown/80">PRESUPUESTO</h4>
            <p className="text-3xl font-bold text-pf-blue">{currencyFormatter.format(reportData.budgetForPeriod)}</p>
        </div>
        <div className="bg-white/80 p-6 rounded-xl shadow-md text-center">
            <h4 className="text-sm font-semibold text-pf-brown/80">COSTO REAL</h4>
            <p className="text-3xl font-bold text-pf-brown">{currencyFormatter.format(reportData.totalActualCost)}</p>
        </div>
        <div className="bg-white/80 p-6 rounded-xl shadow-md text-center">
            <h4 className="text-sm font-semibold text-pf-brown/80">VARIANZA</h4>
            <p className={`text-3xl font-bold ${reportData.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencyFormatter.format(reportData.variance)}
            </p>
        </div>
      </div>
      
      <div className="bg-white/80 p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-pf-brown mb-4">Análisis Gráfico</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96">
                <canvas ref={chartRef}></canvas>
            </div>
            <div className="lg:col-span-1 max-h-96 overflow-y-auto">
                 <table className="w-full text-sm text-left text-pf-brown">
                    <thead className="text-xs uppercase bg-pf-beige/50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Período</th>
                            <th className="px-4 py-2 text-right">Costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.labels.map((label, index) => (
                            <tr key={label} className="border-b border-pf-beige last:border-b-0">
                                <td className="px-4 py-3 font-medium">{label}</td>
                                <td className="px-4 py-3 text-right font-semibold">{currencyFormatter.format(reportData.data[index])}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetReports;
