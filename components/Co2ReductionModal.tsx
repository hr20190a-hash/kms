import React, { useState, useEffect } from 'react';
import { Recipe, Co2ReductionSuggestion } from '../types.ts';
import { getCo2ReductionSuggestions } from '../services/geminiService.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';

interface Co2ReductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
}

const Co2ReductionModal: React.FC<Co2ReductionModalProps> = ({ isOpen, onClose, recipe }) => {
  const [suggestions, setSuggestions] = useState<Co2ReductionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setSuggestions([]);
      getCo2ReductionSuggestions(recipe)
        .then(setSuggestions)
        .catch(() => setError('No se pudieron obtener las sugerencias. Por favor, inténtalo de nuevo más tarde.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, recipe]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Sugerencias para reducir CO2 en: ${recipe.name}`}>
      <div className="p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Spinner />
            <p className="mt-4 text-pf-brown/80">Generando recomendaciones con IA...</p>
          </div>
        )}
        {error && (
          <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && (
          suggestions.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-pf-brown/90 mb-4">Aquí hay algunas ideas prácticas para hacer tu receta más sostenible:</p>
              {suggestions.map((item, index) => (
                <div key={index} className="bg-pf-beige/50 p-4 rounded-lg border-l-4 border-pf-green">
                  <h4 className="font-bold text-lg text-pf-brown flex items-start">
                    <i className="fas fa-lightbulb text-yellow-500 mr-3 mt-1"></i>
                    {item.suggestion}
                  </h4>
                  <p className="text-sm text-pf-brown mt-1 pl-6">{item.explanation}</p>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-pf-brown/70 h-64 flex items-center justify-center">
                <p>No se encontraron sugerencias de mejora específicas.</p>
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

export default Co2ReductionModal;