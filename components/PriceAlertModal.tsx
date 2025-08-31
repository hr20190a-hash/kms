import React from 'react';
import { InventoryItem, PriceCheckResult } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  aiCheckResult: PriceCheckResult | null;
}

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ isOpen, onClose, item, aiCheckResult }) => {
  if (!isOpen || !item || !aiCheckResult) return null;

  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const { isReasonable, estimatedPrice, justification } = aiCheckResult;

  const renderHeader = () => {
    if (isReasonable) {
      return (
        <>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <i className="fas fa-check-circle text-4xl text-green-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-pf-brown mt-4">Precio Razonable</h3>
          <p className="text-pf-brown/80 mt-2">
            El precio para <strong>{item.name}</strong> parece estar dentro del valor de mercado esperado.
          </p>
        </>
      );
    } else {
      return (
        <>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
            <i className="fas fa-exclamation-triangle text-4xl text-yellow-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-pf-brown mt-4">Alerta de Precio</h3>
          <p className="text-pf-brown/80 mt-2">
            El precio para <strong>{item.name}</strong> parece estar por encima del valor de mercado.
          </p>
        </>
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verificación de Precio con IA">
      <div className="p-6 text-center">
        {renderHeader()}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-left">
          <div className="bg-pf-beige/60 p-4 rounded-lg">
            <p className="text-sm font-semibold text-pf-brown/80">Tu Precio</p>
            <p className={`text-2xl font-bold ${isReasonable ? 'text-pf-green' : 'text-red-600'}`}>
              {item.costPerUnit > 0 ? currencyFormatter.format(item.costPerUnit) : 'N/A'} / {item.unit}
            </p>
          </div>
          <div className="bg-pf-beige/60 p-4 rounded-lg">
            <p className="text-sm font-semibold text-pf-brown/80">Precio Estimado (IA)</p>
            <p className="text-2xl font-bold text-pf-green">{estimatedPrice}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-inner">
          <p className="text-sm font-semibold text-pf-brown text-left mb-1">Justificación de la IA:</p>
          <p className="text-sm text-pf-brown/90 text-left italic">"{justification}"</p>
        </div>

      </div>
      <div className="bg-pf-beige/50 px-6 py-4 flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};

export default PriceAlertModal;