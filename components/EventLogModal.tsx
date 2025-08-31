import React, { useState, useEffect } from 'react';
import { EventLog } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface EventLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventLog) => void;
  eventLog: EventLog | null;
}

const initialFormState: Omit<EventLog, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  observation: '',
  correctiveAction: '',
  isCorrected: false,
};

const EventLogModal: React.FC<EventLogModalProps> = ({ isOpen, onClose, onSave, eventLog }) => {
  const [formData, setFormData] = useState<Omit<EventLog, 'id'> & { id?: string }>(initialFormState);

  useEffect(() => {
    if (eventLog) {
      setFormData({ ...eventLog, date: new Date(eventLog.date).toISOString().split('T')[0] });
    } else {
      setFormData(initialFormState);
    }
  }, [eventLog, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.observation || !formData.correctiveAction) {
      alert("Por favor, complete los campos de observación y acción correctiva.");
      return;
    }
    onSave({
      ...formData,
      date: new Date(formData.date).toISOString(),
    } as EventLog);
  };

  const labelClass = "block text-sm font-medium text-pf-brown/80 mb-1";
  const inputClass = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";
  const textareaClass = `${inputClass} min-h-[100px]`;
  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-pf-green focus:ring-pf-green";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventLog ? 'Editar Evento Crítico' : 'Registrar Nuevo Evento Crítico'}>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className={labelClass}>Fecha del Evento</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="observation" className={labelClass}>Observación (Incidencia)</label>
            <textarea id="observation" name="observation" value={formData.observation} onChange={handleChange} className={textareaClass} required placeholder="Describa el problema o la desviación detectada." />
          </div>
          <div>
            <label htmlFor="correctiveAction" className={labelClass}>Acción Correctiva Aplicada</label>
            <textarea id="correctiveAction" name="correctiveAction" value={formData.correctiveAction} onChange={handleChange} className={textareaClass} required placeholder="Describa las medidas tomadas para corregir el problema." />
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <input type="checkbox" id="isCorrected" name="isCorrected" checked={formData.isCorrected} onChange={handleChange} className={checkboxClass} />
            <label htmlFor="isCorrected" className="font-medium text-pf-brown">Marcar como Corregido</label>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-pf-beige">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Evento</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EventLogModal;
