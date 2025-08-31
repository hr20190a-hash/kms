import React, { useState, useEffect } from 'react';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategories: string[];
  onSave: (categories: string[]) => void;
}

const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({ isOpen, onClose, currentCategories, onSave }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategories([...currentCategories].sort((a, b) => a.localeCompare(b)));
    }
  }, [isOpen, currentCategories]);

  const handleUpdateCategory = (index: number, value: string) => {
    const updated = [...categories];
    updated[index] = value;
    setCategories(updated);
  };

  const handleDeleteCategory = (index: number) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${categories[index]}"?`)) {
      const updated = categories.filter((_, i) => i !== index);
      setCategories(updated);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.find(c => c.toLowerCase() === newCategory.trim().toLowerCase())) {
      setCategories([...categories, newCategory.trim()].sort((a, b) => a.localeCompare(b)));
      setNewCategory('');
    }
  };

  const handleSave = () => {
    // Filter out empty categories that might have been created by mistake
    const finalCategories = categories.map(c => c.trim()).filter(Boolean);
    onSave(finalCategories);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías de Inventario">
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Añade, edita o elimina las categorías utilizadas para clasificar tu inventario.
        </p>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={category}
                onChange={(e) => handleUpdateCategory(index, e.target.value)}
                className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green"
              />
              <button onClick={() => handleDeleteCategory(index)} className="text-red-500 hover:text-red-700 p-2">
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-pf-beige">
          <h3 className="font-semibold mb-2">Añadir Nueva Categoría</h3>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }}}
              placeholder="Nombre de la nueva categoría"
              className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green"
            />
            <Button onClick={handleAddCategory} className="py-2 px-4">
              <i className="fas fa-plus"></i>
            </Button>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ManageCategoriesModal;
