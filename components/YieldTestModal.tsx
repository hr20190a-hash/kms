import React, { useState, useEffect, useMemo } from 'react';
import { YieldTest, InventoryItem, Supplier } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import { normalizeUnit } from '../utils/cost-utils.ts';

interface YieldTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (test: YieldTest) => void;
  test: YieldTest | null;
  inventory: InventoryItem[];
  suppliers: Supplier[];
}

const initialFormState: Omit<YieldTest, 'id' | 'wasteWeightKg' | 'yieldPercentage' | 'correctionFactor' | 'realCostPerKgNet'> = {
  date: new Date().toISOString().split('T')[0],
  ingredientName: '',
  supplierName: '',
  purchaseSpecification: '',
  grossWeightKg: 0,
  netWeightKg: 0,
  costPerKgGross: 0,
  performedBy: '',
  observations: '',
};

const YieldTestModal: React.FC<YieldTestModalProps> = ({ isOpen, onClose, onSave, test, inventory, suppliers }) => {
  const [formData, setFormData] = useState<Omit<YieldTest, 'id' | 'wasteWeightKg' | 'yieldPercentage' | 'correctionFactor' | 'realCostPerKgNet'> & { id?: string }>(initialFormState);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  useEffect(() => {
    if (test) {
      setFormData({ ...test, date: new Date(test.date).toISOString().split('T')[0] });
    } else {
      setFormData(initialFormState);
    }
  }, [test, isOpen]);

  const calculations = useMemo(() => {
    const { grossWeightKg, netWeightKg, costPerKgGross } = formData;
    const wasteWeightKg = grossWeightKg > 0 && netWeightKg > 0 ? grossWeightKg - netWeightKg : 0;
    const yieldPercentage = grossWeightKg > 0 && netWeightKg > 0 ? (netWeightKg / grossWeightKg) * 100 : 0;
    const correctionFactor = grossWeightKg > 0 && netWeightKg > 0 ? grossWeightKg / netWeightKg : 0;
    // The user's example implies using a rounded factor for the final calculation
    const correctionFactorRounded = parseFloat(correctionFactor.toFixed(2));
    const realCostPerKgNet = costPerKgGross > 0 && correctionFactorRounded > 0 ? costPerKgGross * correctionFactorRounded : 0;

    return { wasteWeightKg, yieldPercentage, correctionFactor, realCostPerKgNet };
  }, [formData.grossWeightKg, formData.netWeightKg, formData.costPerKgGross]);

  // Autofill cost when ingredient changes
  useEffect(() => {
    if (formData.ingredientName) {
      const selectedItem = inventory.find(item => item.name.toLowerCase() === formData.ingredientName.toLowerCase());
      if (selectedItem) {
        let costPerKg = 0;
        const normalizedUnit = normalizeUnit(selectedItem.unit);
        
        if (normalizedUnit === 'g') {
          costPerKg = selectedItem.costPerUnit * 1000;
        } else if (normalizedUnit === 'kg') {
          costPerKg = selectedItem.costPerUnit;
        } else {
          // If unit is not 'g' or 'kg', we cannot reliably convert to kg.
          // Clear the cost field to prevent stale data and force user input.
          setFormData(prev => ({
            ...prev,
            costPerKgGross: 0,
          }));
          return; // Exit early
        }

        setFormData(prev => ({
          ...prev,
          costPerKgGross: costPerKg,
        }));
      }
    }
  }, [formData.ingredientName, inventory]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ingredientName || formData.grossWeightKg <= 0 || formData.netWeightKg <= 0) {
      alert("Por favor, complete al menos el ingrediente y los pesos.");
      return;
    }
    const finalTest: YieldTest = {
      ...formData,
      ...calculations,
      id: formData.id || '',
      date: new Date(formData.date).toISOString(),
    };
    onSave(finalTest);
  };
  
  const labelClass = "block text-sm font-medium text-pf-brown/80 mb-1";
  const inputClass = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";
  const resultBoxClass = "bg-pf-beige/60 p-3 rounded-lg";
  const resultLabelClass = "text-sm font-semibold text-pf-brown/80";
  const resultValueClass = "text-2xl font-bold text-pf-brown";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={test ? 'Editar Ficha de Rendimiento' : 'Nueva Ficha de Rendimiento'} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {/* Left Column: Test Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pf-brown border-b border-pf-gold pb-1">Datos de la Prueba</h3>
            <div>
              <label htmlFor="date" className={labelClass}>Fecha</label>
              <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label htmlFor="ingredientName" className={labelClass}>Ingrediente</label>
              <input list="inventory-suggestions" type="text" id="ingredientName" name="ingredientName" value={formData.ingredientName} onChange={handleChange} className={inputClass} required />
              <datalist id="inventory-suggestions">{inventory.map(i => <option key={i.id} value={i.name} />)}</datalist>
            </div>
            <div>
              <label htmlFor="supplierName" className={labelClass}>Proveedor</label>
              <input list="supplier-suggestions" type="text" id="supplierName" name="supplierName" value={formData.supplierName} onChange={handleChange} className={inputClass} />
              <datalist id="supplier-suggestions">{suppliers.map(s => <option key={s.id} value={s.name} />)}</datalist>
            </div>
            <div>
              <label htmlFor="purchaseSpecification" className={labelClass}>Especificación de Compra</label>
              <textarea id="purchaseSpecification" name="purchaseSpecification" value={formData.purchaseSpecification} onChange={handleChange} className={inputClass} rows={2}></textarea>
            </div>
             <div>
              <label htmlFor="performedBy" className={labelClass}>Realizado por</label>
              <input type="text" id="performedBy" name="performedBy" value={formData.performedBy} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="observations" className={labelClass}>Observaciones</label>
              <textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} className={inputClass} rows={3}></textarea>
            </div>
          </div>
          {/* Right Column: Calculations */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pf-brown border-b border-pf-gold pb-1">Cálculos de Rendimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="grossWeightKg" className={labelClass}>Peso Bruto (kg)</label>
                    <input type="number" step="any" id="grossWeightKg" name="grossWeightKg" value={formData.grossWeightKg} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="netWeightKg" className={labelClass}>Peso Neto (kg)</label>
                    <input type="number" step="any" id="netWeightKg" name="netWeightKg" value={formData.netWeightKg} onChange={handleChange} className={inputClass} required />
                </div>
            </div>
            <div>
                <label htmlFor="costPerKgGross" className={labelClass}>Costo Bruto por kg (COP)</label>
                <input type="number" step="any" id="costPerKgGross" name="costPerKgGross" value={formData.costPerKgGross} onChange={handleChange} className={inputClass} required />
            </div>
            <div className="space-y-3 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div className={resultBoxClass}>
                    <p className={resultLabelClass}>Peso Merma (kg)</p>
                    <p className={resultValueClass}>{calculations.wasteWeightKg.toFixed(3)}</p>
                 </div>
                  <div className={resultBoxClass}>
                    <p className={resultLabelClass}>% Rendimiento</p>
                    <p className={resultValueClass}>{calculations.yieldPercentage.toFixed(2)}%</p>
                  </div>
                   <div className={resultBoxClass}>
                    <p className={resultLabelClass}>Factor Corrección</p>
                    <p className={resultValueClass}>{calculations.correctionFactor.toFixed(3)}</p>
                  </div>
              </div>
               <div className="bg-pf-green/20 p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-pf-green">COSTO REAL / KG (EPC)</p>
                    <p className="text-3xl font-extrabold text-pf-green">{currencyFormatter.format(calculations.realCostPerKgNet)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-pf-beige/50 px-6 py-4 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Ficha</Button>
        </div>
      </form>
    </Modal>
  );
};

export default YieldTestModal;
