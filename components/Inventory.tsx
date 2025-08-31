import React, { useState, useMemo } from 'react';
import { InventoryItem, Supplier, PriceCheckResult, Recipe, SavedMenu, WeeklyPlan, PurchaseOrder } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';
import ImportModal from './common/ImportModal.tsx';
import { checkItemPrice, getCorrectionFactorSuggestion } from '../services/geminiService.ts';
import PriceAlertModal from './PriceAlertModal.tsx';
import InventoryReportModal from './InventoryReportModal.tsx';

interface InventoryProps {
  items: InventoryItem[];
  suppliers: Supplier[];
  categories: string[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  recipes: Recipe[];
  savedMenus: SavedMenu[];
  weeklyPlan: WeeklyPlan;
  purchaseOrders: PurchaseOrder[];
}

const getStatus = (item: InventoryItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(item.expiryDate);
    
    if (expiryDate < today) {
        return { text: 'Expirado', color: 'bg-red-200 text-red-900' };
    }
    if (item.quantity <= 0) {
        return { text: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    }
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    if (expiryDate <= sevenDaysFromNow) {
        return { text: 'Próximo a Expirar', color: 'bg-yellow-200 text-yellow-900' };
    }
    if (item.quantity <= item.lowStockThreshold) {
        return { text: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'En Stock', color: 'bg-green-100 text-green-800' };
};

const EditableRow: React.FC<{ item: InventoryItem; suppliers: Supplier[]; categories: string[]; onSave: (item: InventoryItem) => void; onCancel: () => void; currencyFormatter: Intl.NumberFormat; }> = ({ item, suppliers, categories, onSave, onCancel, currencyFormatter }) => {
    const [editedItem, setEditedItem] = useState(item);
    const inputStyles = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'date') {
            setEditedItem(prev => ({ ...prev, [name]: new Date(value).toISOString() }));
        } else {
            const isNumeric = ['quantity', 'costPerUnit', 'lowStockThreshold', 'correctionFactor'].includes(name);
            setEditedItem(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
        }
    }
    
    const realCost = useMemo(() => {
        return (editedItem.costPerUnit || 0) * (editedItem.correctionFactor || 1);
    }, [editedItem.costPerUnit, editedItem.correctionFactor]);

    return (
        <tr className="bg-pf-gold/20">
            <td className="px-4 py-3"><input name="name" value={editedItem.name} onChange={handleChange} className={inputStyles} placeholder="Nombre del item" /></td>
            <td className="px-4 py-3">
                <select name="category" value={editedItem.category} onChange={handleChange} className={inputStyles}>
                    <option value="">Seleccionar categoría</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </td>
            <td className="px-4 py-3">
                <select name="supplierId" value={editedItem.supplierId || ''} onChange={handleChange} className={inputStyles}>
                    <option value="">Sin proveedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </td>
            <td className="px-4 py-3"><input name="purchaseDate" type="date" value={editedItem.purchaseDate.split('T')[0]} onChange={handleChange} className={inputStyles}/></td>
            <td className="px-4 py-3"><input name="expiryDate" type="date" value={editedItem.expiryDate.split('T')[0]} onChange={handleChange} className={inputStyles}/></td>
            <td className="px-4 py-3 flex items-center">
                <input name="quantity" type="number" value={editedItem.quantity} onChange={handleChange} className={`${inputStyles} w-20 mr-2`}/>
                <input name="unit" value={editedItem.unit} onChange={handleChange} className={`${inputStyles} w-20`} placeholder="unidad"/>
            </td>
            <td className="px-4 py-3"><input name="costPerUnit" type="number" step="0.01" value={editedItem.costPerUnit} onChange={handleChange} className={`${inputStyles} w-24`}/></td>
            <td className="px-4 py-3"><input name="correctionFactor" type="number" step="0.01" value={editedItem.correctionFactor || ''} onChange={handleChange} className={`${inputStyles} w-20`} placeholder="1.00" title="Factor de Corrección"/></td>
            <td className="px-4 py-3 font-semibold">{currencyFormatter.format(realCost)}</td>
            <td className="px-4 py-3"></td>{/* Status column placeholder */}
            <td className="px-4 py-3 flex space-x-2">
                <button onClick={() => onSave(editedItem)} className="text-green-600 hover:text-green-900 w-8 h-8 flex items-center justify-center">
                    <i className="fas fa-check fa-lg"></i>
                </button>
                <button onClick={onCancel} className="text-red-600 hover:text-red-900"><i className="fas fa-times fa-lg"></i></button>
            </td>
        </tr>
    );
};

const Inventory: React.FC<InventoryProps> = ({ items, suppliers, categories, onAddItem, onUpdateItem, onDeleteItem, recipes, savedMenus, weeklyPlan, purchaseOrders }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGettingFactorForItem, setIsGettingFactorForItem] = useState<string | null>(null);

  // AI Price Check State
  const [isCheckingPriceForItem, setIsCheckingPriceForItem] = useState<string | null>(null);
  const [itemForPriceCheck, setItemForPriceCheck] = useState<InventoryItem | null>(null);
  const [priceCheckResult, setPriceCheckResult] = useState<PriceCheckResult | null>(null);
  
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);

  const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lowercasedFilter = searchTerm.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(lowercasedFilter) ||
      item.category.toLowerCase().includes(lowercasedFilter)
    );
  }, [items, searchTerm]);

  const handleGetCorrectionFactor = async (itemToUpdate: InventoryItem) => {
    setIsGettingFactorForItem(itemToUpdate.id);
    try {
        const factor = await getCorrectionFactorSuggestion(itemToUpdate.name);
        onUpdateItem({ ...itemToUpdate, correctionFactor: factor });
    } catch (error) {
        console.error(error);
        alert(`No se pudo obtener la sugerencia para "${itemToUpdate.name}". Por favor, inténtalo de nuevo.`);
    } finally {
        setIsGettingFactorForItem(null);
    }
  };

  const handleSave = (item: InventoryItem) => {
      if (item.id.startsWith('new-') && !item.name) {
          onDeleteItem(item.id);
          setEditingId(null);
          return;
      }
      onUpdateItem(item);
      setEditingId(null);
  };
  
  const handleCheckPrice = async (item: InventoryItem) => {
    if (!item.costPerUnit || item.costPerUnit <= 0) {
      setItemForPriceCheck(item);
      setPriceCheckResult({
        isReasonable: false,
        estimatedPrice: "N/A",
        justification: "El artículo no tiene un costo asignado para poder verificar."
      });
      return;
    }
    
    setIsCheckingPriceForItem(item.id);
    try {
      const result = await checkItemPrice(item.name, item.costPerUnit, item.unit);
      setItemForPriceCheck(item);
      setPriceCheckResult(result);
    } catch (error) {
      console.error("Price check failed", error);
      setItemForPriceCheck(item);
      setPriceCheckResult({
        isReasonable: false,
        estimatedPrice: "Error",
        justification: "No se pudo verificar el precio debido a un error del servicio de IA."
      });
    } finally {
        setIsCheckingPriceForItem(null);
    }
  };

  const handleClosePriceModal = () => {
    setItemForPriceCheck(null);
    setPriceCheckResult(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este artículo?')) {
        onDeleteItem(id);
    }
  }

  const handleCancel = (item: InventoryItem) => {
      if (item.id.startsWith('new-')) {
          onDeleteItem(item.id);
      }
      setEditingId(null);
  }

  const handleAddNewItem = () => {
    const newItemId = `new-${Date.now()}`;
    const today = new Date().toISOString();
    const newItem: InventoryItem = { 
        id: newItemId, 
        name: '', 
        category: '', 
        quantity: 0, 
        unit: '', 
        lowStockThreshold: 10, 
        costPerUnit: 0,
        purchaseDate: today,
        expiryDate: today,
        correctionFactor: 1.0,
    };
    onAddItem(newItem);
    setEditingId(newItemId);
  };

  const handleExport = () => {
    const headers = "id,name,category,quantity,unit,lowStockThreshold,costPerUnit,supplierId,purchaseDate,expiryDate,correctionFactor";
    const csvContent = [
        headers,
        ...filteredItems.map(item => 
            [
                item.id,
                `"${item.name.replace(/"/g, '""')}"`,
                `"${item.category.replace(/"/g, '""')}"`,
                item.quantity,
                item.unit,
                item.lowStockThreshold,
                item.costPerUnit,
                item.supplierId || '',
                item.purchaseDate.split('T')[0],
                item.expiryDate.split('T')[0],
                item.correctionFactor || ''
            ].join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "inventario.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gestión de Inventario"
        subtitle="Control en tiempo real de los niveles de stock, costos y fechas de caducidad."
      />
      <div className="flex justify-between items-center mb-6">
        <input 
          type="text" 
          placeholder="Buscar por nombre o categoría..." 
          className="w-full max-w-sm pl-4 pr-4 py-2 bg-white border border-pf-brown/20 rounded-lg text-pf-brown placeholder-pf-brown/60 focus:outline-none focus:ring-2 focus:ring-pf-green"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}><i className="fas fa-chart-pie mr-2"></i>Generar Reporte</Button>
            <Button variant="secondary" onClick={handleExport}><i className="fas fa-file-export mr-2"></i>Exportar</Button>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}><i className="fas fa-file-import mr-2"></i>Importar</Button>
            <Button onClick={handleAddNewItem} disabled={editingId !== null}>
                <i className="fas fa-plus mr-2"></i>Añadir Item
            </Button>
        </div>
      </div>
      <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-pf-brown uppercase bg-pf-beige/50">
              <tr>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Categoría</th>
                <th scope="col" className="px-4 py-3">Proveedor</th>
                <th scope="col" className="px-4 py-3">F. Compra</th>
                <th scope="col" className="px-4 py-3">F. Caducidad</th>
                <th scope="col" className="px-4 py-3">Cantidad</th>
                <th scope="col" className="px-4 py-3">Costo/Unidad</th>
                <th scope="col" className="px-4 py-3" title="Factor de Corrección (Merma)">F. Corrección</th>
                <th scope="col" className="px-4 py-3">Costo Real/Unidad</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                editingId === item.id 
                ? <EditableRow key={item.id} item={item} suppliers={suppliers} categories={categories} onSave={handleSave} onCancel={() => handleCancel(item)} currencyFormatter={currencyFormatter} />
                : (
                  <tr key={item.id} className="bg-white border-b border-pf-beige hover:bg-pf-beige/40">
                    <td className="px-4 py-3 font-medium text-pf-brown whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">{item.supplierId ? supplierMap.get(item.supplierId) || 'Desconocido' : 'N/A'}</td>
                    <td className="px-4 py-3">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="px-4 py-3">{currencyFormatter.format(item.costPerUnit)}</td>
                    <td className="px-4 py-3">{item.correctionFactor ? item.correctionFactor.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold">{currencyFormatter.format(item.costPerUnit * (item.correctionFactor || 1))}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getStatus(item).color}`}>
                        {getStatus(item).text}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center space-x-3">
                        <button onClick={() => handleGetCorrectionFactor(item)} className="font-medium text-blue-600 hover:text-blue-900" title="Sugerir F. Corrección con IA" disabled={editingId !== null || isGettingFactorForItem === item.id || isCheckingPriceForItem === item.id}>
                            {isGettingFactorForItem === item.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                        </button>
                        <button onClick={() => handleCheckPrice(item)} className="font-medium text-yellow-600 hover:text-yellow-900" title="Verificar precio con IA" disabled={editingId !== null || isCheckingPriceForItem === item.id || isGettingFactorForItem === item.id}>
                            {isCheckingPriceForItem === item.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search-dollar"></i>}
                        </button>
                        <button onClick={() => setEditingId(item.id)} className="font-medium text-pf-green hover:text-pf-brown" disabled={editingId !== null || isGettingFactorForItem === item.id || isCheckingPriceForItem === item.id}><i className="fas fa-pencil-alt"></i></button>
                        <button onClick={() => handleDelete(item.id)} className="font-medium text-red-600 hover:text-red-900" disabled={editingId !== null || isGettingFactorForItem === item.id || isCheckingPriceForItem === item.id}><i className="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <PriceAlertModal
        isOpen={!!priceCheckResult}
        onClose={handleClosePriceModal}
        item={itemForPriceCheck}
        aiCheckResult={priceCheckResult}
      />
       <InventoryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        items={items}
        recipes={recipes}
        savedMenus={savedMenus}
        weeklyPlan={weeklyPlan}
        purchaseOrders={purchaseOrders}
      />
    </div>
  );
};

export default Inventory;