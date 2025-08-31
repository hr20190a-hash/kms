import React, { useState, useEffect } from 'react';
import { ComplianceTask } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface ComplianceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ComplianceTask) => void;
  task: ComplianceTask | null;
}

const ComplianceTaskModal: React.FC<ComplianceTaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
  const [formData, setFormData] = useState<Partial<ComplianceTask>>({
    name: '',
    category: '',
    frequency: 'Diaria',
    dueDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        dueDate: new Date(task.dueDate).toISOString().split('T')[0] // Format for input[type=date]
      });
    } else {
      setFormData({
        name: '',
        category: '',
        frequency: 'Diaria',
        dueDate: new Date().toISOString().split('T')[0],
        documents: [],
        status: 'Pendiente',
      });
    }
  }, [task, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      alert("Por favor, complete todos los campos.");
      return;
    }
    const taskToSave: ComplianceTask = {
      id: task?.id || '',
      name: formData.name,
      category: formData.category,
      frequency: formData.frequency || 'Diaria',
      dueDate: new Date(formData.dueDate || '').toISOString(),
      status: task?.status || 'Pendiente',
      documents: task?.documents || [],
      completedAt: task?.completedAt,
      completedBy: task?.completedBy,
    };
    onSave(taskToSave);
  };

  const inputClass = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar Tarea de Cumplimiento' : 'Nueva Tarea de Cumplimiento'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-pf-brown/80 mb-1">Nombre de la Tarea</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-pf-brown/80 mb-1">Categoría</label>
          <input type="text" id="category" name="category" value={formData.category} onChange={handleChange} className={inputClass} placeholder="Ej: Control de Temperaturas" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-pf-brown/80 mb-1">Frecuencia</label>
            <select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange} className={inputClass}>
              <option value="Diaria">Diaria</option>
              <option value="Semanal">Semanal</option>
              <option value="Mensual">Mensual</option>
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-pf-brown/80 mb-1">Fecha de Vencimiento</label>
            <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} className={inputClass} required />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-pf-beige">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Guardar Tarea
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ComplianceTaskModal;