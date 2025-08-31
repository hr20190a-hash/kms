import React from 'react';
import { ComplianceTask, EventLog } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';

interface ComplianceProps {
  tasks: ComplianceTask[];
  onMarkComplete: (taskId: string) => void;
  onEdit: (task: ComplianceTask) => void;
  onDelete: (taskId: string) => void;
  onManageDocuments: (task: ComplianceTask) => void;
  onNewTask: () => void;
  eventLogs: EventLog[];
  onNewEvent: () => void;
  onEditEvent: (event: EventLog) => void;
  onDeleteEvent: (eventId: string) => void;
}

const getStatusStyles = (status: ComplianceTask['status']) => {
  switch (status) {
    case 'Completado':
      return 'bg-green-100 text-green-800';
    case 'Atrasado':
      return 'bg-red-100 text-red-800';
    case 'Pendiente':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

const TaskCard: React.FC<{ 
  task: ComplianceTask; 
  onMarkComplete: (id: string) => void;
  onEdit: (task: ComplianceTask) => void;
  onDelete: (id: string) => void;
  onManageDocuments: (task: ComplianceTask) => void;
}> = ({ task, onMarkComplete, onEdit, onDelete, onManageDocuments }) => {
  const isCompleted = task.status === 'Completado';
  const dueDate = new Date(task.dueDate);
  const completedAt = task.completedAt ? new Date(task.completedAt) : null;
  const documentCount = task.documents?.length || 0;
  
  return (
    <div className="bg-white/80 rounded-xl shadow-md p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase text-pf-brown/60">{task.category}</span>
          <span className={`px-2 py-1 text-xs font-bold leading-none rounded-full ${getStatusStyles(task.status)}`}>
            {task.status}
          </span>
        </div>
        <h4 className="font-bold text-pf-brown mt-2">{task.name}</h4>
        <p className="text-sm text-pf-brown/70 mt-2">
          Vence: {dueDate.toLocaleDateString()}
        </p>
        {completedAt && (
           <p className="text-xs text-pf-brown/60 mt-1">
             Completado por {task.completedBy} el {completedAt.toLocaleString()}
           </p>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-pf-beige flex flex-col space-y-2">
        <Button 
          variant="secondary" 
          onClick={() => onMarkComplete(task.id)} 
          disabled={isCompleted}
          fullWidth
          className="py-2"
        >
          {isCompleted ? <><i className="fas fa-check-circle mr-2"></i>Completado</> : 'Marcar como Completado'}
        </Button>
        <div className="flex justify-between items-center text-pf-brown/70">
           <button onClick={() => onManageDocuments(task)} className="hover:text-pf-green p-2 text-sm flex items-center">
            <i className="fas fa-paperclip mr-1"></i> ({documentCount})
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={() => onEdit(task)} className="hover:text-pf-green p-2"><i className="fas fa-pencil-alt"></i></button>
            <button onClick={() => onDelete(task.id)} className="hover:text-red-600 p-2"><i className="fas fa-trash-alt"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Compliance: React.FC<ComplianceProps> = ({ 
  tasks, onMarkComplete, onEdit, onDelete, onManageDocuments, onNewTask,
  eventLogs, onNewEvent, onEditEvent, onDeleteEvent 
}) => {
  const dailyTasks = tasks.filter(t => t.frequency === 'Diaria');
  const weeklyTasks = tasks.filter(t => t.frequency === 'Semanal');
  const monthlyTasks = tasks.filter(t => t.frequency === 'Mensual');

  const renderTaskSection = (title: string, taskList: ComplianceTask[]) => (
    <div className="mb-6">
      <h4 className="text-xl font-semibold text-pf-brown mb-4">{title}</h4>
      {taskList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {taskList.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onMarkComplete={onMarkComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageDocuments={onManageDocuments}
            />
          ))}
        </div>
      ) : (
        <p className="text-pf-brown/70">No hay tareas para este período.</p>
      )}
    </div>
  );
  
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Cumplimiento Normativo (APPCC)"
          subtitle="Gestión y registro de todas las tareas y eventos críticos de seguridad alimentaria."
        />
        <Button onClick={onNewTask}>
          <i className="fas fa-plus mr-2"></i>Nueva Tarea
        </Button>
      </div>
      
      {/* Existing Tasks Section */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-pf-brown mb-4 pb-2 border-b-2 border-pf-gold">Tareas de Cumplimiento</h3>
        {renderTaskSection('Tareas Diarias', dailyTasks)}
        {renderTaskSection('Tareas Semanales', weeklyTasks)}
        {renderTaskSection('Tareas Mensuales', monthlyTasks)}
      </div>

      {/* New Event Log Section */}
      <div>
        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-pf-blue">
            <h3 className="text-2xl font-bold text-pf-brown">Registro de Eventos Críticos</h3>
            <Button onClick={onNewEvent}>
                <i className="fas fa-exclamation-triangle mr-2"></i>Registrar Evento
            </Button>
        </div>
        <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-pf-brown">
                    <thead className="text-xs uppercase bg-pf-beige/50">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Observación</th>
                            <th className="px-6 py-3">Acción Correctiva</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventLogs.map(event => (
                            <tr key={event.id} className="bg-white border-b border-pf-beige hover:bg-pf-beige/40">
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(event.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 max-w-sm whitespace-normal">{event.observation}</td>
                                <td className="px-6 py-4 max-w-sm whitespace-normal">{event.correctiveAction}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${event.isCorrected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {event.isCorrected ? 'Corregido' : 'Pendiente'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-4">
                                    <button onClick={() => onEditEvent(event)} className="font-medium text-pf-green hover:text-pf-brown">
                                        <i className="fas fa-pencil-alt"></i>
                                    </button>
                                    <button onClick={() => onDeleteEvent(event.id)} className="font-medium text-red-600 hover:text-red-900">
                                        <i className="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {eventLogs.length === 0 && <p className="text-center p-8 text-pf-brown/70">No hay eventos registrados.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;