import React, { useState, useEffect } from 'react';
import { Recipe, WasteUtilizationIdea } from '../types.ts';
import { suggestRecipesFromWaste } from '../services/geminiService.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';

interface WasteRecipeSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: Recipe[];
}

const WasteRecipeSuggestionModal: React.FC<WasteRecipeSuggestionModalProps> = ({ isOpen, onClose, menuItems }) => {
  const [suggestions, setSuggestions] = useState<WasteUtilizationIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && menuItems.length > 0) {
      setIsLoading(true);
      setError(null);
      setSuggestions([]);
      suggestRecipesFromWaste(menuItems)
        .then(setSuggestions)
        .catch(() => setError('No se pudieron obtener las sugerencias. Por favor, inténtalo de nuevo más tarde.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, menuItems]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sugerencias para Reducir Residuos">
      <div className="p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Spinner />
            <p className="mt-4 text-pf-brown/80">Analizando el menú actual con IA para encontrar oportunidades...</p>
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && (
          suggestions.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <p className="text-pf-brown/90 mb-4">Basado en tu menú actual, aquí hay algunas ideas para aprovechar al máximo tus ingredientes:</p>
              {suggestions.map((idea, index) => (
                <div key={index} className="bg-pf-beige/50 p-4 rounded-lg border-l-4 border-pf-green">
                  <h4 className="font-bold text-lg text-pf-brown">{idea.ideaName}</h4>
                  <div className="mt-2 mb-3">
                    <p className="text-sm font-semibold text-pf-brown/80">Aprovechando:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                       {idea.wasteUsed.map(item => (
                         <span key={item} className="bg-pf-blue/30 text-pf-brown text-xs font-medium px-2 py-1 rounded-full">{item}</span>
                       ))}
                    </div>
                  </div>
                  <p className="text-sm text-pf-brown">{idea.preparation}</p>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-pf-brown/70 h-64 flex items-center justify-center">
                <p>No se encontraron sugerencias específicas para los ingredientes de este menú.</p>
             </div>
          )
        )}
      </div>
      <div className="bg-pf-beige/50 px-6 py-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};

export default WasteRecipeSuggestionModal;