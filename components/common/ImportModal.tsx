


import React from 'react';
import Modal from './Modal.tsx';
import Button from './Button.tsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Inventario desde CSV">
      <div className="p-6 text-pf-brown">
        <p className="mb-4">
          Para importar artículos a tu inventario, por favor, sube un archivo CSV con el formato correcto. Asegúrate de que el archivo
          esté codificado en <strong>UTF-8</strong>.
        </p>
        
        <h3 className="font-bold text-lg mb-2">Formato Requerido</h3>
        <p className="mb-2">
          La primera fila de tu archivo CSV debe contener exactamente las siguientes cabeceras, en este orden. El campo <strong>supplierId</strong> es opcional.
        </p>
        <pre className="bg-pf-beige/60 p-3 rounded-lg text-sm mb-4">
          <code>name,category,quantity,unit,lowStockThreshold,costPerUnit,purchaseDate,expiryDate,supplierId</code>
        </pre>

        <p className="mb-2">Las fechas deben estar en formato <strong>AAAA-MM-DD</strong>.</p>
        <h3 className="font-bold text-lg mb-2">Ejemplo de Fila</h3>
        <p className="mb-2">
          Cada fila subsiguiente debe corresponder a un artículo del inventario.
        </p>
        <pre className="bg-pf-beige/60 p-3 rounded-lg text-sm mb-4">
          <code>Tomates maduros,Vegetales,25000,g,5000,0.002,2024-07-20,2024-08-01,sup-1</code>
        </pre>
        
        <p className="text-xs text-pf-brown/70 mb-4">
          Nota: El campo 'id' se generará automáticamente por el sistema. No es necesario incluirlo en el CSV. Los valores numéricos no deben incluir comas o símbolos de moneda.
        </p>

        <div className="mt-6 p-4 border-t border-gray-200">
            <label className="block text-sm font-medium mb-2" htmlFor="file-upload">
                Seleccionar archivo CSV
            </label>
            <div className="flex items-center space-x-3">
                <input id="file-upload" name="file-upload" type="file" accept=".csv" className="block w-full text-sm text-pf-brown/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pf-gold/20 file:text-pf-brown hover:file:bg-pf-gold/40"/>
                {/* La lógica de subida no está implementada en esta demo. */}
            </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;
