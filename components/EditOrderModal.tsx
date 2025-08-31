import React, { useState, useEffect, useMemo } from 'react';
import { PurchaseOrder, Supplier } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: PurchaseOrder) => void;
  order: PurchaseOrder;
  suppliers: Supplier[];
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ isOpen, onClose, onSave, order, suppliers }) => {
  const [editedOrder, setEditedOrder] = useState<PurchaseOrder | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  useEffect(() => {
    if (order) {
      // Deep copy to avoid mutating the original state object
      setEditedOrder(JSON.parse(JSON.stringify(order)));
    }
  }, [order, isOpen]);

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier && editedOrder) {
      setEditedOrder({
        ...editedOrder,
        supplierId: supplier.id,
        supplierName: supplier.name,
      });
    }
  };

  const handleItemChange = (itemId: string, field: 'quantity' | 'costPerUnit', value: string) => {
    if (!editedOrder) return;
    const newValue = parseFloat(value) || 0;
    const updatedItems = editedOrder.items.map(item =>
      item.itemId === itemId ? { ...item, [field]: newValue } : item
    );
    setEditedOrder({ ...editedOrder, items: updatedItems });
  };

  const totalCost = useMemo(() => {
    if (!editedOrder) return 0;
    return editedOrder.items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  }, [editedOrder]);

  const handleSaveChanges = () => {
    if (editedOrder) {
      onSave({ ...editedOrder, totalCost });
    }
  };

  if (!isOpen || !editedOrder) {
    return null;
  }
  
  const inputStyles = "w-full p-2 border rounded bg-white text-pf-brown focus:outline-none focus:ring-2 focus:ring-pf-green";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Pedido: ${order.id}`}>
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-pf-brown/80 mb-1">Proveedor</label>
          <select
            id="supplier"
            value={editedOrder.supplierId}
            onChange={handleSupplierChange}
            className={inputStyles}
          >
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        
        <h3 className="font-semibold text-pf-brown pt-2">Artículos del Pedido</h3>
        <div className="max-h-64 overflow-y-auto pr-2 -mr-2">
            <table className="w-full text-sm">
                <thead className="text-left text-xs text-pf-brown uppercase">
                    <tr>
                        <th className="pb-2 font-semibold">Artículo</th>
                        <th className="pb-2 font-semibold">Cantidad</th>
                        <th className="pb-2 font-semibold">Costo/Unidad</th>
                        <th className="pb-2 font-semibold text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {editedOrder.items.map(item => (
                        <tr key={item.itemId} className="border-t border-pf-beige">
                            <td className="py-2 pr-2 text-pf-brown">{item.itemName}</td>
                            <td className="py-2 pr-2">
                                <input 
                                    type="number" 
                                    value={item.quantity} 
                                    onChange={(e) => handleItemChange(item.itemId, 'quantity', e.target.value)}
                                    className={`${inputStyles} w-24`}
                                />
                            </td>
                            <td className="py-2 pr-2">
                                <input 
                                    type="number"
                                    step="0.01"
                                    value={item.costPerUnit}
                                    onChange={(e) => handleItemChange(item.itemId, 'costPerUnit', e.target.value)}
                                    className={`${inputStyles} w-28`}
                                />
                            </td>
                            <td className="py-2 text-right font-medium text-pf-brown">
                                {currencyFormatter.format(item.quantity * item.costPerUnit)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="pt-4 border-t border-pf-beige flex justify-end">
            <div className="text-right">
                <span className="text-pf-brown/80">Costo Total:</span>
                <p className="font-bold text-xl text-pf-brown">{currencyFormatter.format(totalCost)}</p>
            </div>
        </div>

      </div>
      <div className="bg-pf-beige/50 px-6 py-4 flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveChanges}>
            Guardar Cambios
          </Button>
        </div>
    </Modal>
  );
};

export default EditOrderModal;