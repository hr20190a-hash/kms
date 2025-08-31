import React, { useState } from 'react';
import { WasteLogEntry, Recipe, InventoryItem } from '../types.ts';
import PageHeader from './common/PageHeader.tsx';
import Button from './common/Button.tsx';
import WasteLogModal from './WasteLogModal.tsx';

interface WasteLogProps {
  wasteLogs: WasteLogEntry[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  onSave: (entry: WasteLogEntry) => void;
  onDelete: (entryId: string) => void;
}

const WasteLog: React.FC<WasteLogProps> = ({ wasteLogs, recipes, inventory, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WasteLogEntry | null>(null);

  const handleOpenModal = (entry: WasteLogEntry | null = null) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEntry(null);
    setIsModalOpen(false);
  };

  const handleSave = (entry: WasteLogEntry) => {
    onSave(entry);
    handleCloseModal();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Control de Desperdicios"
          subtitle="Registro diario de desperdicios para análisis y reducción de costos."
        />
        <Button onClick={() => handleOpenModal()}>
          <i className="fas fa-plus mr-2"></i>Añadir Registro
        </Button>
      </div>

      <div className="bg-white/80 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-pf-brown">
            <thead className="text-xs uppercase bg-pf-beige/50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Plato Asociado</th>
                <th className="px-6 py-3">Ingrediente</th>
                <th className="px-6 py-3">Cantidad</th>
                <th className="px-6 py-3">Razón</th>
                <th className="px-6 py-3">Observaciones</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {wasteLogs.map(entry => (
                <tr key={entry.id} className="bg-white border-b border-pf-beige hover:bg-pf-beige/40">
                  <td className="px-6 py-4 font-medium">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{entry.dish}</td>
                  <td className="px-6 py-4 font-semibold">{entry.ingredient}</td>
                  <td className="px-6 py-4">{entry.quantity} {entry.unit}</td>
                  <td className="px-6 py-4">
                     <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-200 text-yellow-900">{entry.reason}</span>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={entry.observations}>{entry.observations || 'N/A'}</td>
                  <td className="px-6 py-4 flex items-center space-x-4">
                    <button onClick={() => handleOpenModal(entry)} className="font-medium text-pf-green hover:text-pf-brown">
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button onClick={() => onDelete(entry.id)} className="font-medium text-red-600 hover:text-red-900">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <WasteLogModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          entry={editingEntry}
          recipes={recipes}
          inventory={inventory}
        />
      )}
    </div>
  );
};

export default WasteLog;
