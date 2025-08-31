import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderItem, InventoryItem, Supplier } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: PurchaseOrder) => void;
  inventory: InventoryItem[];
  suppliers: Supplier[];
}

const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ isOpen, onClose, onCreateOrder, inventory, suppliers }) => {
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);
  
  const inventoryMap = useMemo(() => new Map(inventory.map(item => [item.id, item])), [inventory]);
  
  const inventoryBySupplier = useMemo(() => {
    const grouped = new Map<string, { supplierName: string; items: InventoryItem[] }>();
    const unknownSupplierKey = 'unknown';
    
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    inventory.forEach(item => {
        const supplierId = item.supplierId || unknownSupplierKey;
        const supplierName = item.supplierId ? supplierMap.get(item.supplierId) ?? `ID Desconocido: ${item.supplierId}` : 'Proveedor no Asignado';
        
        if (!grouped.has(supplierId)) {
            grouped.set(supplierId, { supplierName, items: [] });
        }
        grouped.get(supplierId)!.items.push(item);
    });
    
    // Sort items within each group alphabetically
    for (const group of grouped.values()) {
        group.items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return new Map([...grouped.entries()].sort((a, b) => a[1].supplierName.localeCompare(b[1].supplierName)));
  }, [inventory, suppliers]);


  const filteredInventoryBySupplier = useMemo(() => {
    if (!searchTerm.trim()) {
      return inventoryBySupplier;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const filteredMap = new Map<string, { supplierName: string; items: InventoryItem[] }>();

    inventoryBySupplier.forEach((value, key) => {
      const filteredItems = value.items.filter(item => item.name.toLowerCase().includes(lowercasedTerm));
      if (filteredItems.length > 0) {
        filteredMap.set(key, { ...value, items: filteredItems });
      }
    });

    return filteredMap;
  }, [searchTerm, inventoryBySupplier]);
  
  const ordersBySupplier = useMemo(() => {
    const groupedOrders = new Map<string, { supplierName: string; items: PurchaseOrderItem[], totalCost: number }>();
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    orderItems.forEach(item => {
        const inventoryItem = inventoryMap.get(item.itemId);
        const supplierId = inventoryItem?.supplierId || 'unknown';
        const supplierName = supplierId === 'unknown' ? 'Proveedor no Asignado' : supplierMap.get(supplierId) || 'Proveedor Desconocido';

        if (!groupedOrders.has(supplierId)) {
            groupedOrders.set(supplierId, { supplierName, items: [], totalCost: 0 });
        }
        const group = groupedOrders.get(supplierId)!;
        group.items.push(item);
        group.totalCost += item.quantity * item.costPerUnit;
    });

    return new Map([...groupedOrders.entries()].sort((a, b) => a[1].supplierName.localeCompare(b[1].supplierName)));
  }, [orderItems, inventoryMap, suppliers]);


  useEffect(() => {
    if (!isOpen) {
      setOrderItems([]);
      setSearchTerm('');
      setExpandedSuppliers(new Set());
    }
  }, [isOpen]);

  const handleAddItem = (item: InventoryItem) => {
    if (orderItems.some(orderItem => orderItem.itemId === item.id)) return;

    const newItem: PurchaseOrderItem = {
      itemId: item.id,
      itemName: item.name,
      quantity: 1,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
    };
    setOrderItems(prev => [...prev, newItem]);
  };

  const handleItemChange = (itemId: string, field: 'quantity' | 'costPerUnit', value: number) => {
    setOrderItems(prev => prev.map(item => item.itemId === itemId ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.itemId !== itemId));
  };
  
  const handleToggleSupplier = (supplierId: string) => {
      setExpandedSuppliers(prev => {
          const newSet = new Set(prev);
          if (newSet.has(supplierId)) {
              newSet.delete(supplierId);
          } else {
              newSet.add(supplierId);
          }
          return newSet;
      });
  };

  const grandTotalCost = useMemo(() => {
    return Array.from(ordersBySupplier.values()).reduce((sum, group) => sum + group.totalCost, 0);
  }, [ordersBySupplier]);

  const handleSave = () => {
    if (orderItems.length === 0) {
      alert('El pedido está vacío.');
      return;
    }

    ordersBySupplier.forEach(({ items, supplierName }, supplierId) => {
        const totalCost = items.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0);
        const newOrder: PurchaseOrder = {
            id: `PO-${Date.now()}-${supplierId.substring(0, 4)}`,
            supplierId: supplierId,
            supplierName: supplierName,
            createdAt: new Date().toISOString(),
            status: 'Pendiente',
            items: items,
            totalCost: totalCost,
        };
        onCreateOrder(newOrder);
    });
    
    onClose();
  };
  
  const inputStyles = "w-full p-2 border rounded bg-white text-pf-brown focus:outline-none focus:ring-2 focus:ring-pf-green";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Pedido Manual" size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[80vh]">
            {/* Left Column: Inventory Catalog */}
            <div className="flex flex-col h-full bg-pf-beige/40 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-pf-brown mb-3">Catálogo de Inventario</h3>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar artículo por nombre..."
                    className={inputStyles}
                />
                <div className="flex-grow overflow-y-auto mt-3 pr-2 space-y-2">
                    {Array.from(filteredInventoryBySupplier.entries()).map(([supplierId, { supplierName, items }]) => (
                        <div key={supplierId} className="bg-white/50 rounded-md">
                            <button onClick={() => handleToggleSupplier(supplierId)} className="w-full text-left p-3 font-bold text-pf-brown flex justify-between items-center hover:bg-pf-beige/50">
                                <span>{supplierName} ({items.length})</span>
                                <i className={`fas fa-chevron-down transition-transform duration-200 ${expandedSuppliers.has(supplierId) ? 'rotate-180' : ''}`}></i>
                            </button>
                            {expandedSuppliers.has(supplierId) && (
                                <ul className="p-2 space-y-1">
                                    {items.map(item => (
                                        <li key={item.id} className="flex justify-between items-center p-2 rounded-md hover:bg-pf-beige/60">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-xs text-pf-brown/70">Stock: {item.quantity} {item.unit}</p>
                                            </div>
                                            <Button onClick={() => handleAddItem(item)} className="py-1 px-3 text-sm" disabled={orderItems.some(oi => oi.itemId === item.id)}>
                                                {orderItems.some(oi => oi.itemId === item.id) ? 'Añadido' : 'Añadir'}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Current Order */}
            <div className="flex flex-col h-full">
                <h3 className="text-lg font-bold text-pf-brown mb-3">Pedido Actual</h3>
                <div className="flex-grow overflow-y-auto bg-white/80 p-4 rounded-lg shadow-inner">
                    {orderItems.length > 0 ? (
                        <div className="space-y-4">
                        {Array.from(ordersBySupplier.entries()).map(([supplierId, { supplierName, items, totalCost }]) => (
                            <div key={supplierId}>
                                <h4 className="font-bold text-pf-brown pb-1 mb-2 border-b-2 border-pf-gold">{supplierName}</h4>
                                <table className="w-full text-sm">
                                    <tbody>
                                    {items.map(item => (
                                        <tr key={item.itemId}>
                                            <td className="py-1.5 pr-2 w-2/5 font-medium text-pf-brown">{item.itemName}</td>
                                            <td className="py-1.5 pr-2 w-1/4">
                                                <input type="number" value={item.quantity} onChange={e => handleItemChange(item.itemId, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputStyles} py-1 w-20`} min="0"/>
                                            </td>
                                            <td className="py-1.5 pr-2 w-1/4">
                                                <input type="number" step="0.01" value={item.costPerUnit} onChange={e => handleItemChange(item.itemId, 'costPerUnit', parseFloat(e.target.value) || 0)} className={`${inputStyles} py-1 w-24`} min="0"/>
                                            </td>
                                            <td className="py-1.5 text-right w-auto">
                                                <button onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700 px-2"><i className="fas fa-times-circle"></i></button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <p className="text-right font-semibold text-sm mt-2">Subtotal: {currencyFormatter.format(totalCost)}</p>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-center text-pf-brown/70">Añade artículos desde el catálogo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="bg-pf-beige/50 px-6 py-4 flex justify-between items-center">
            <div className="text-right">
                <span className="text-pf-brown/80 font-semibold">Costo Total del Pedido:</span>
                <p className="font-bold text-2xl text-pf-brown">{currencyFormatter.format(grandTotalCost)}</p>
            </div>
            <div className="flex space-x-3">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="button" onClick={handleSave} disabled={orderItems.length === 0}>Crear Pedido(s)</Button>
            </div>
        </div>
    </Modal>
  );
};

export default ManualOrderModal;
