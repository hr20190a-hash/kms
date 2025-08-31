import React, { useState } from 'react';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface SaveMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, date: string) => void;
}

const SaveMenuModal: React.FC<SaveMenuModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, new Date(date).toISOString());
      setName('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  };
  
  const inputClass = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guardar Menú">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="menu-name" className="block text-sm font-medium text-pf-brown/80 mb-1">
            Nombre del Menú
          </label>
          <input
            type="text"
            id="menu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Ej: Menú de Fin de Semana, Especial de Verano"
            required
          />
        </div>
        <div>
          <label htmlFor="menu-date" className="block text-sm font-medium text-pf-brown/80 mb-1">
            Fecha del Menú
          </label>
          <input
            type="date"
            id="menu-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>
      <div className="bg-pf-beige/50 px-6 py-4 flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={!name.trim()}>
          Guardar
        </Button>
      </div>
    </Modal>
  );
};

export default SaveMenuModal;