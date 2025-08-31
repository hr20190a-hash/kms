import React, { useState } from 'react';
import { Recipe } from '../types.ts';
import { generateRecipe } from '../services/geminiService.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';
import Spinner from './common/Spinner.tsx';

interface AIGenerateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeGenerated: (recipe: Recipe) => void;
}

const AIGenerateRecipeModal: React.FC<AIGenerateRecipeModalProps> = ({ isOpen, onClose, onRecipeGenerated }) => {
  const [ingredients, setIngredients] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!ingredients.trim()) {
      setError('Por favor, introduce al menos un ingrediente.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const newRecipe = await generateRecipe(ingredients);
      onRecipeGenerated(newRecipe);
      setIngredients('');
    } catch (err) {
      setError('No se pudo generar la receta. Por favor, inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Receta con IA">
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Introduce los ingredientes principales que tienes disponibles, separados por comas. La IA creará una receta profesional para ti.
        </p>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Ej: pollo, pimientos rojos, cebolla, arroz, azafrán..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pf-green"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner /> : <><i className="fas fa-magic mr-2"></i>Generar</>}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AIGenerateRecipeModal;