import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WasteLogEntry, InventoryItem } from '../types.ts';
import { convertUnits } from '../utils/cost-utils.ts';
import Button from './common/Button.tsx';

declare const Chart: any;
declare const jspdf: any;

interface WasteCostReportProps {
  wasteLogs: WasteLogEntry[];
  inventory: InventoryItem[];
}

type ReportType = 'daily' | 'weekly' | 'monthly';

const toISODateString = (date: Date): string => date.toISOString().split('T')[0];

interface ProcessedWasteLogEntry extends WasteLogEntry {
  cost: number;
}

const WasteCostReport: React.FC<WasteCostReportProps> = ({ wasteLogs, inventory }) => {
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const reasonChartRef = useRef<HTMLCanvasElement>(null);
  const ingredientChartRef = useRef<HTMLCanvasElement>(null);
  const reasonChartInstance = useRef<any>(null);
  const ingredientChartInstance = useRef<any>(null);
  
  const inventoryMap = useMemo(() => new Map(inventory.map(item => [item.name.toLowerCase(), item])), [inventory]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }), []);

  const reportData = useMemo(() => {
    const startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date(currentDate);
    endDate.setHours(23, 59, 59, 999);

    if (reportType === 'weekly') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === 'monthly') {
      startDate.setDate(1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const filteredLogs = wasteLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });

    const processedLogs: ProcessedWasteLogEntry[] = filteredLogs.map(log => {
      const inventoryItem = inventoryMap.get(log.ingredient.toLowerCase());
      let cost = 0;
      if (inventoryItem) {
        try {
          const quantityInInventoryUnit = convertUnits(log.quantity, log.unit, inventoryItem.unit);
          const realCostPerUnit = inventoryItem.costPerUnit * (inventoryItem.correctionFactor || 1);
          cost = quantityInInventoryUnit * realCostPerUnit;
        } catch (e) {
          console.warn(`Could not convert units for waste log: ${log.ingredient}`);
        }
      }
      return { ...log, cost };
    });

    const totalWasteCost = processedLogs.reduce((sum, log) => sum + log.cost, 0);

    const costByReason = processedLogs.reduce((acc, log) => {
      acc[log.reason] = (acc[log.reason] || 0) + log.cost;
      return acc;
    }, {} as { [key: string]: number });

    const costByIngredient = processedLogs.reduce((acc, log) => {
      acc[log.ingredient] = (acc[log.ingredient] || 0) + log.cost;
      return acc;
    }, {} as { [key: string]: number });

    const sortedCostByReason = Object.entries(costByReason).sort(([, a], [, b]) => b - a);
    const sortedCostByIngredient = Object.entries(costByIngredient).sort(([, a], [, b]) => b - a).slice(0, 10);

    return {
      processedLogs,
      totalWasteCost,
      costByReason: sortedCostByReason,
      costByIngredient: sortedCostByIngredient,
    };
  }, [reportType, currentDate, wasteLogs, inventoryMap]);

  useEffect(() => {
    if (reasonChartRef.current && reportData.costByReason.length > 0) {
      if (reasonChartInstance.current) reasonChartInstance.current.destroy();
      const ctx = reasonChartRef.current.getContext('2d');
      if (ctx) {
        reasonChartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: reportData.costByReason.map(([reason]) => reason),
            datasets: [{
              data: reportData.costByReason.map(([, cost]) => cost),
              backgroundColor: ['#E8C37F', '#9FACB4', '#5D4F3F', '#b5bca8', '#f0d6a5'],
              borderColor: '#f7f5f2',
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { font: { family: "'EB Garamond', sans-serif" }}},
              tooltip: { callbacks: { label: (c: any) => `${c.label}: ${currencyFormatter.format(c.raw)}` }}
            }
          }
        });
      }
    }
    return () => { if (reasonChartInstance.current) reasonChartInstance.current.destroy() };
  }, [reportData.costByReason, currencyFormatter]);
  
  useEffect(() => {
    if (ingredientChartRef.current && reportData.costByIngredient.length > 0) {
      if (ingredientChartInstance.current) ingredientChartInstance.current.destroy();
      const ctx = ingredientChartRef.current.getContext('2d');
      if (ctx) {
        ingredientChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: reportData.costByIngredient.map(([name]) => name),
            datasets: [{
              label: 'Costo por Desperdicio',
              data: reportData.costByIngredient.map(([, cost]) => cost),
              backgroundColor: '#8C947D',
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }},
            scales: { x: { ticks: { callback: (v: number) => currencyFormatter.format(v) }}}
          }
        });
      }
    }
    return () => { if (ingredientChartInstance.current) ingredientChartInstance.current.destroy() };
  }, [reportData.costByIngredient, currencyFormatter]);
  
  const handleExportPDF = () => {
    const doc = new jspdf.jsPDF();
    const reasonChartImg = reasonChartRef.current?.toDataURL('image/png', 1.0);
    const ingredientChartImg = ingredientChartRef.current?.toDataURL('image/png', 1.0);
    
    doc.setFont('EB Garamond', 'bold');
    doc.setFontSize(22);
    doc.text(`Reporte de Costos de Desperdicios`, 105, 20, { align: 'center' });
    
    doc.setFont('EB Garamond', 'normal');
    doc.setFontSize(12);
    doc.text(`Período: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - ${currentDate.toLocaleDateString()}`, 14, 35);
    doc.setFontSize(14);
    doc.setFont('EB Garamond', 'bold');
    doc.text(`Costo Total de Desperdicio: ${currencyFormatter.format(reportData.totalWasteCost)}`, 196, 45, { align: 'right' });

    doc.setFontSize(16);
    doc.text('Desglose por Razón', 14, 60);
    if (reasonChartImg) doc.addImage(reasonChartImg, 'PNG', 14, 65, 90, 90);
    
    doc.text('Top Ingredientes Desperdiciados', 105, 60);
    if (ingredientChartImg) doc.addImage(ingredientChartImg, 'PNG', 105, 65, 90, 90);

    (doc as any).autoTable({
      head: [['Fecha', 'Ingrediente', 'Cantidad', 'Razón', 'Costo']],
      body: reportData.processedLogs.map(log => [
          new Date(log.date).toLocaleDateString(),
          log.ingredient,
          `${log.quantity} ${log.unit}`,
          log.reason,
          currencyFormatter.format(log.cost)
      ]),
      startY: 165,
      theme: 'grid',
      headStyles: { fillColor: [93, 79, 63] },
      styles: { font: 'EB Garamond' },
    });

    doc.save(`Reporte_Desperdicios_${reportType}_${toISODateString(currentDate)}.pdf`);
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
        <Button onClick={handleExportPDF}><i className="fas fa-file-pdf mr-2"></i>Exportar a PDF</Button>
      </div>
      
      <div className="bg-white/80 p-6 rounded-xl shadow-md text-center">
        <h4 className="text-sm font-semibold text-pf-brown/80">COSTO TOTAL DE DESPERDICIO PARA EL PERÍODO</h4>
        <p className="text-4xl font-extrabold text-red-600 mt-2">{currencyFormatter.format(reportData.totalWasteCost)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-pf-brown mb-4">Costos por Razón</h3>
          <div className="relative h-80 w-full">
            <canvas ref={reasonChartRef}></canvas>
          </div>
        </div>
        <div className="bg-white/80 p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-pf-brown mb-4">Top Ingredientes Desperdiciados (por costo)</h3>
           <div className="relative h-80 w-full">
            <canvas ref={ingredientChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteCostReport;
