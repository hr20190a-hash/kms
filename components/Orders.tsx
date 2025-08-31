import React, { useMemo } from 'react';
import { InventoryItem, Supplier, PurchaseOrder, PurchaseOrderItem } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';

declare const jspdf: any;

interface OrdersProps {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onCreateOrder: (order: PurchaseOrder) => void;
  onEditOrder: (order: PurchaseOrder) => void;
  onUpdateStatus: (orderId: string, status: 'Pendiente' | 'Realizado') => void;
  onDeleteOrder: (orderId: string) => void;
  onOpenManualOrderModal: () => void;
}

const Orders: React.FC<OrdersProps> = ({ inventory, suppliers, purchaseOrders, onCreateOrder, onEditOrder, onUpdateStatus, onDeleteOrder, onOpenManualOrderModal }) => {
    const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }), []);

    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const suggestionsBySupplier = useMemo(() => {
        const suggestions: { [key: string]: { item: InventoryItem; reason: string }[] } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);

        inventory.forEach(item => {
            let reason = '';
            const expiryDate = new Date(item.expiryDate);

            if (item.quantity <= 0) {
                reason = 'Sin Stock';
            } else if (item.quantity <= item.lowStockThreshold) {
                reason = 'Stock Bajo';
            } else if (expiryDate > today && expiryDate <= sevenDaysFromNow) {
                reason = 'Próximo a Expirar';
            }

            if (reason && item.supplierId) {
                if (!suggestions[item.supplierId]) {
                    suggestions[item.supplierId] = [];
                }
                if (!suggestions[item.supplierId].some(s => s.item.id === item.id)) {
                    suggestions[item.supplierId].push({ item, reason });
                }
            }
        });
        return suggestions;
    }, [inventory]);

    const handleCreateOrderForSupplier = (supplierId: string) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const suggestedItems = suggestionsBySupplier[supplierId];
        if (!suggestedItems || suggestedItems.length === 0) return;

        const orderItems: PurchaseOrderItem[] = suggestedItems.map(({ item }) => ({
            itemId: item.id,
            itemName: item.name,
            quantity: Math.max(item.lowStockThreshold * 2 - item.quantity, 10), // Simple logic to suggest a quantity
            unit: item.unit,
            costPerUnit: item.costPerUnit,
        }));

        const totalCost = orderItems.reduce((sum, item) => sum + item.quantity * item.costPerUnit, 0);

        const newOrder: PurchaseOrder = {
            id: `PO-${Date.now()}`,
            supplierId: supplier.id,
            supplierName: supplier.name,
            createdAt: new Date().toISOString(),
            status: 'Pendiente',
            items: orderItems,
            totalCost: totalCost,
        };

        onCreateOrder(newOrder);
    };

    const generateOrderPDF = (order: PurchaseOrder) => {
        const doc = new jspdf.jsPDF();
        
        doc.setFont('EB Garamond', 'bold');
        doc.setFontSize(22);
        doc.text("Orden de Compra", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text("Hotel Punta Faro", 105, 28, { align: 'center' });

        doc.setFont('EB Garamond', 'normal');
        doc.setFontSize(10);
        doc.text(`Pedido ID: ${order.id}`, 14, 40);
        doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 45);
        
        doc.text(`Proveedor: ${order.supplierName}`, 196, 40, { align: 'right' });
        doc.text(`Estado: ${order.status}`, 196, 45, { align: 'right' });
        
        const tableColumn = ["Artículo", "Cantidad", "Unidad", "Costo/Unidad", "Subtotal"];
        const tableRows: any[] = [];

        order.items.forEach(item => {
            const subtotal = item.quantity * item.costPerUnit;
            const itemData = [
                item.itemName,
                item.quantity.toLocaleString(),
                item.unit,
                currencyFormatter.format(item.costPerUnit),
                currencyFormatter.format(subtotal)
            ];
            tableRows.push(itemData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [93, 79, 63] },
            styles: { font: 'EB Garamond' }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(14);
        doc.setFont('EB Garamond', 'bold');
        doc.text(`Costo Total: ${currencyFormatter.format(order.totalCost)}`, 196, finalY + 15, { align: 'right' });

        doc.save(`Pedido-${order.id}.pdf`);
    };


  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestión de Pedidos"
        subtitle="Genera órdenes de compra basadas en el stock bajo y las fechas de vencimiento."
      />
      
      {/* Order Suggestions */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-pf-brown mb-4 pb-2 border-b-2 border-pf-gold">Sugerencias de Pedido</h3>
        {Object.keys(suggestionsBySupplier).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(suggestionsBySupplier).map(([supplierId, suggestions]) => (
                    <div key={supplierId} className="bg-white/80 rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                             <h4 className="text-lg font-bold text-pf-brown">{supplierMap.get(supplierId) || 'Proveedor Desconocido'}</h4>
                             <Button onClick={() => handleCreateOrderForSupplier(supplierId)} className="py-2 px-4">
                                <i className="fas fa-file-invoice mr-2"></i>Crear Pedido
                             </Button>
                        </div>
                       
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {suggestions.map(({item, reason}) => (
                                <li key={item.id} className="flex justify-between items-center p-2 bg-pf-beige/50 rounded-md">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-xs text-pf-brown/70">Stock actual: {item.quantity} {item.unit}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${reason === 'Stock Bajo' || reason === 'Sin Stock' ? 'bg-yellow-200 text-yellow-900' : 'bg-orange-200 text-orange-900'}`}>
                                        {reason}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-pf-brown/70 p-8 bg-white/50 rounded-xl">¡Buen trabajo! No hay sugerencias de pedido por el momento.</p>
        )}
      </div>

      {/* Purchase Order History */}
      <div>
        <div className="flex justify-between items-end mb-4 pb-2 border-b-2 border-pf-blue">
            <h3 className="text-2xl font-bold text-pf-brown">Historial de Pedidos</h3>
            <Button onClick={onOpenManualOrderModal}>
                <i className="fas fa-plus mr-2"></i>Crear Pedido Manual
            </Button>
        </div>
        <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-pf-brown uppercase bg-pf-beige/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">ID Pedido</th>
                            <th scope="col" className="px-6 py-3">Proveedor</th>
                            <th scope="col" className="px-6 py-3">Fecha</th>
                            <th scope="col" className="px-6 py-3">Costo Total</th>
                            <th scope="col" className="px-6 py-3">Estado</th>
                            <th scope="col" className="px-6 py-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchaseOrders.length > 0 ? purchaseOrders.map(order => (
                             <tr key={order.id} className="bg-white border-b border-pf-beige hover:bg-pf-beige/40">
                                <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                                <td className="px-6 py-4 font-medium text-pf-brown">{order.supplierName}</td>
                                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-semibold">{currencyFormatter.format(order.totalCost)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${order.status === 'Pendiente' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    {order.status === 'Pendiente' && (
                                        <button onClick={() => onUpdateStatus(order.id, 'Realizado')} className="text-green-600 hover:text-green-900" title="Marcar como Realizado">
                                            <i className="fas fa-check-circle"></i>
                                        </button>
                                    )}
                                    <button onClick={() => onEditOrder(order)} className="text-blue-600 hover:text-blue-900" title="Editar Pedido"><i className="fas fa-pencil-alt"></i></button>
                                    <button onClick={() => generateOrderPDF(order)} className="text-pf-brown hover:text-pf-brown/70" title="Descargar PDF"><i className="fas fa-file-pdf"></i></button>
                                    <button onClick={() => onDeleteOrder(order.id)} className="text-red-600 hover:text-red-900" title="Eliminar Pedido"><i className="fas fa-trash-alt"></i></button>
                                </td>
                             </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-pf-brown/70">No hay pedidos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;