import React, { useState, useEffect } from 'react';
import { Recipe, Ingredient, Step, InventoryItem } from '../types.ts';
import Modal from './common/Modal.tsx';
import Button from './common/Button.tsx';

interface RecipeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  recipe: Recipe | null;
  inventory: InventoryItem[];
}

const emptyRecipe: Omit<Recipe, 'id' | 'allergens'> = {
  name: '',
  description: '',
  imageUrl: '',
  servings: 4,
  prepTimeMinutes: 15,
  cookTimeMinutes: 30,
  ingredients: [{ name: '', quantity: 1, unit: '' }],
  steps: [{ description: '' }],
  tags: [],
};

const RecipeEditModal: React.FC<RecipeEditModalProps> = ({ isOpen, onClose, onSave, recipe, inventory }) => {
  const [formData, setFormData] = useState<Omit<Recipe, 'id' | 'allergens'> & Partial<Pick<Recipe, 'id' | 'allergens'>>>(recipe || emptyRecipe);
  const [suggestionBoxIndex, setSuggestionBoxIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);

  useEffect(() => {
    setFormData(recipe ? { ...recipe } : { ...emptyRecipe });
  }, [recipe, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                imageUrl: reader.result as string,
            }));
        };
        reader.readAsDataURL(file);
    }
  };

  // Ingredient Handlers
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...(formData.ingredients || [])];
    (newIngredients[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    
    if (field === 'name') {
        const searchTerm = String(value).toLowerCase();
        if (searchTerm) {
            const filteredSuggestions = inventory.filter(item => 
                item.name.toLowerCase().includes(searchTerm)
            );
            setSuggestions(filteredSuggestions);
            setSuggestionBoxIndex(index);
        } else {
            setSuggestions([]);
            setSuggestionBoxIndex(null);
        }
    }
  };

  const handleSuggestionClick = (ingredientIndex: number, suggestion: InventoryItem) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients[ingredientIndex].name = suggestion.name;
    newIngredients[ingredientIndex].unit = suggestion.unit;
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    setSuggestions([]);
    setSuggestionBoxIndex(null);
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), { name: '', quantity: 1, unit: '' }],
    }));
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients && formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    }
  };

  // Step Handlers
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...(formData.steps || [])];
    newSteps[index].description = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };

  const addStep = () => {
    setFormData(prev => ({ ...prev, steps: [...(prev.steps || []), { description: '' }] }));
  };

  const removeStep = (index: number) => {
    if (formData.steps && formData.steps.length > 1) {
      const newSteps = formData.steps.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, steps: newSteps }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsArray = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleSubmit = () => {
    onSave(formData as Recipe);
  };

  const inputClass = "w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-pf-green";
  const labelClass = "block text-sm font-medium text-pf-brown/80 mb-1";
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recipe ? 'Editar Receta' : 'Crear Nueva Receta'}>
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className={labelClass}>Nombre de la Receta</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="description" className={labelClass}>Descripción</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className={inputClass} rows={3}></textarea>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="servings" className={labelClass}>Porciones</label>
              <input type="number" id="servings" name="servings" value={formData.servings} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="prepTimeMinutes" className={labelClass}>Tiempo Prep. (min)</label>
              <input type="number" id="prepTimeMinutes" name="prepTimeMinutes" value={formData.prepTimeMinutes} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="cookTimeMinutes" className={labelClass}>Tiempo Cocción (min)</label>
              <input type="number" id="cookTimeMinutes" name="cookTimeMinutes" value={formData.cookTimeMinutes} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          
          {/* Ingredients */}
          <div className="pt-4 border-t border-pf-beige">
            <h3 className="font-semibold text-pf-brown mb-2">Ingredientes</h3>
            {formData.ingredients?.map((ing, index) => (
              <div key={index} className="flex items-start space-x-2 mb-2">
                <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)} className={`${inputClass} w-20`} placeholder="Cant."/>
                <input type="text" value={ing.unit} onChange={e => handleIngredientChange(index, 'unit', e.target.value)} className={`${inputClass} w-24`} placeholder="Unidad"/>
                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        value={ing.name} 
                        onChange={e => handleIngredientChange(index, 'name', e.target.value)}
                        onBlur={() => setTimeout(() => setSuggestionBoxIndex(null), 200)}
                        className={`${inputClass} w-full`}
                        placeholder="Nombre del Ingrediente"
                        autoComplete="off"
                    />
                    {suggestionBoxIndex === index && suggestions.length > 0 && (
                        <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {suggestions.map(suggestion => (
                                <li 
                                    key={suggestion.id} 
                                    className="p-2 hover:bg-pf-beige cursor-pointer"
                                    onMouseDown={() => handleSuggestionClick(index, suggestion)}
                                >
                                    {suggestion.name} <span className="text-xs text-gray-500">({suggestion.unit})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button type="button" onClick={() => removeIngredient(index)} className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50" disabled={!formData.ingredients || formData.ingredients.length <= 1}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addIngredient} className="py-1 px-3 text-sm mt-2">
                <i className="fas fa-plus mr-2"></i>Añadir Ingrediente
            </Button>
          </div>

          {/* Steps */}
          <div className="pt-4 border-t border-pf-beige">
            <h3 className="font-semibold text-pf-brown mb-2">Pasos de Preparación</h3>
            {formData.steps?.map((step, index) => (
              <div key={index} className="flex items-start space-x-2 mb-2">
                <span className="font-bold text-pf-brown/80 pt-2">{index + 1}.</span>
                <textarea value={step.description} onChange={e => handleStepChange(index, e.target.value)} className={inputClass} rows={2} placeholder="Descripción del paso..."/>
                <button type="button" onClick={() => removeStep(index)} className="text-red-500 hover:text-red-700 p-2 disabled:opacity-50" disabled={!formData.steps || formData.steps.length <= 1}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addStep} className="py-1 px-3 text-sm mt-2">
                <i className="fas fa-plus mr-2"></i>Añadir Paso
            </Button>
          </div>

          {/* Tags */}
          <div className="pt-4 border-t border-pf-beige">
            <label htmlFor="tags" className={labelClass}>Etiquetas</label>
            <input type="text" id="tags" name="tags" value={formData.tags?.join(', ')} onChange={handleTagsChange} className={inputClass} placeholder="Ej: Vegano, Plato Principal, Verano"/>
            <p className="text-xs text-pf-brown/70 mt-1">Separa las etiquetas con comas.</p>
          </div>

          {/* Image Upload */}
          <div className="pt-4 border-t border-pf-beige">
            <label className={labelClass}>Foto de la Receta</label>
            <div className="mt-2 flex items-center space-x-6">
                <img 
                    src={formData.imageUrl || 'https://via.placeholder.com/128x128.png?text=Sin+Imagen'} 
                    alt="Previsualización" 
                    className="w-32 h-32 object-cover rounded-lg bg-pf-beige shadow-sm"
                />
                <div className="flex-1">
                    <input 
                        type="file" 
                        id="imageUrl" 
                        name="imageUrl" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleImageChange}
                        className="block w-full text-sm text-pf-brown/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pf-gold/20 file:text-pf-brown hover:file:bg-pf-gold/40"
                    />
                    <p className="text-xs text-pf-brown/70 mt-2">Sube una imagen para la receta (PNG, JPG, WEBP).</p>
                </div>
            </div>
          </div>

        </div>
      </div>
      <div className="bg-pf-beige/50 px-6 py-4 flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit}>
          Guardar Receta
        </Button>
      </div>
    </Modal>
  );
};

export default RecipeEditModal;