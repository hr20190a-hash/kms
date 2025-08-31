import React, { useState, useEffect } from 'react';
import { WasteLogEntry, Recipe, InventoryItem, WasteReason } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface WasteLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: WasteLogEntry) => void;
  entry: WasteLogEntry | null;
  recipes: Recipe[];
  inventory: InventoryItem[];
}

const initialFormState: Omit<WasteLogEntry, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  dish: '',
  ingredient: '',
  quantity: 0,
  unit: '',
  reason: 'Expirado',
  observations: '',
};

const wasteReasons: WasteReason[] = ['Expirado', 'Error de preparación', 'Deterioro', 'Sobreproducción', 'Dañado en entrega'];

const WasteLogModal: React.FC<WasteLogModalProps> = ({ isOpen, onClose, onSave, entry, recipes, inventory }) => {
  const [formData, setFormData] = useState<Omit<WasteLogEntry, 'id'> & { id?: string }>(initialFormState);

  useEffect(() => {
    if (entry) {
      setFormData({ ...entry, date: new Date(entry.date).toISOString().split('T')[0] });
    } else {
      setFormData(initialFormState);
    }
  }, [entry, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredient || formData.quantity <= 0) {
      alert("Por favor, complete al menos el ingrediente y la cantidad.");
      return;
    }
    onSave({
      ...formData,
      date: new Date(formData.date).toISOString(),
    } as WasteLogEntry);
  };

  const inputClass = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";
  const labelClass = "block text-sm font-medium text-pf-brown/80 mb-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={entry ? 'Editar Registro de Desperdicio' : 'Añadir Registro de Desperdicio'}>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="date" className={labelClass}>Fecha</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="dish" className={labelClass}>Plato Asociado (Opcional)</label>
            <input list="recipe-suggestions" type="text" id="dish" name="dish" value={formData.dish} onChange={handleChange} className={inputClass} placeholder="Ej: Paella Valenciana" />
            <datalist id="recipe-suggestions">
                {recipes.map(r => <option key={r.id} value={r.name} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="ingredient" className={labelClass}>Ingrediente</label>
            <input list="inventory-suggestions" type="text" id="ingredient" name="ingredient" value={formData.ingredient} onChange={handleChange} className={inputClass} required placeholder="Ej: Tomates maduros" />
             <datalist id="inventory-suggestions">
                {inventory.map(i => <option key={i.id} value={i.name} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className={labelClass}>Cantidad</label>
              <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} className={inputClass} required min="0" step="any" />
            </div>
            <div>
              <label htmlFor="unit" className={labelClass}>Unidad</label>
              <input type="text" id="unit" name="unit" value={formData.unit} onChange={handleChange} className={inputClass} required placeholder="Ej: kg, g, unidad" />
            </div>
          </div>
           <div>
            <label htmlFor="reason" className={labelClass}>Razón del Desperdicio</label>
            <select id="reason" name="reason" value={formData.reason} onChange={handleChange} className={inputClass}>
              {wasteReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="observations" className={labelClass}>Observaciones</label>
            <textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} className={inputClass} rows={3}></textarea>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-pf-beige">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Guardar Registro
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WasteLogModal;
