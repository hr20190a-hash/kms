import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, IngredientSubstitution } from '../types.ts';
import { getIngredientSubstitutions } from '../services/geminiService.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (originalIngredientName: string, newIngredient: Ingredient) => void;
  recipe: Recipe;
  ingredient: Ingredient;
}

const SubstitutionModal: React.FC<SubstitutionModalProps> = ({ isOpen, onClose, onSave, recipe, ingredient }) => {
  const [suggestions, setSuggestions] = useState<IngredientSubstitution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setSuggestions([]);
      getIngredientSubstitutions(ingredient, recipe.name, recipe.ingredients)
        .then(setSuggestions)
        .catch(() => setError('No se pudieron obtener las sugerencias. Por favor, inténtalo de nuevo más tarde.'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, ingredient, recipe]);

  const handleSelect = (sub: IngredientSubstitution) => {
    onSave(ingredient.name, {
        name: sub.name,
        quantity: sub.quantity,
        unit: sub.unit
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Sustitutos para: ${ingredient.name}`}>
      <div className="p-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner />
            <p className="mt-4 text-pf-brown/80">Buscando sustitutos con IA...</p>
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
              {suggestions.map((sub, index) => (
                <div key={index} className="bg-pf-beige/50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-pf-brown">{sub.name}</h4>
                    <p className="font-semibold text-pf-green">{sub.quantity} {sub.unit}</p>
                    <p className="text-sm text-pf-brown/80 mt-1 italic">"{sub.notes}"</p>
                  </div>
                  <Button onClick={() => handleSelect(sub)} className="py-2 px-4">
                    Usar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-pf-brown/70 h-48 flex items-center justify-center">
                <p>No se encontraron sustitutos adecuados.</p>
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

export default SubstitutionModal;