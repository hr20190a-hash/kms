import React from 'react';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';

const Reports: React.FC = () => {
  const reportTypes = [
      { name: 'Rendimiento del Menú', icon: 'fa-utensils', description: 'Analiza ventas, popularidad y rentabilidad de cada plato.' },
      { name: 'Desperdicio de Alimentos', icon: 'fa-trash-alt', description: 'Seguimiento de mermas para identificar áreas de mejora.' },
      { name: 'Costos de Inventario', icon: 'fa-dollar-sign', description: 'Informe detallado del valor y movimiento del stock.' },
      { name: 'Cumplimiento Normativo (APPCC)', icon: 'fa-clipboard-check', description: 'Genera documentación para auditorías de seguridad alimentaria.' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Centro de Reportes"
        subtitle="Genera informes detallados para una toma de decisiones informada."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reportTypes.map(report => (
              <div key={report.name} className="bg-white/80 rounded-xl shadow-md p-6 flex flex-col">
                  <div className="flex items-start">
                      <i className={`fas ${report.icon} text-3xl text-pf-green mr-4 mt-1`}></i>
                      <div>
                          <h3 className="text-xl font-bold text-pf-brown">{report.name}</h3>
                          <p className="text-gray-600 mt-1 flex-grow">{report.description}</p>
                      </div>
                  </div>
                  <div className="mt-auto pt-4 text-right">
                     <Button variant="secondary">
                        <i className="fas fa-download mr-2"></i>
                        Generar Informe
                     </Button>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default Reports;
