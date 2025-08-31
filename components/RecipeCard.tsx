import React from 'react';
import { Recipe } from '../types.ts';

interface RecipeCardProps {
  recipe: Recipe;
  onSelectRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelectRecipe, onDeleteRecipe }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se active el onClick de la tarjeta principal
    onDeleteRecipe(recipe.id);
  };
  
  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer flex flex-col relative"
      onClick={() => onSelectRecipe(recipe)}
    >
      <button 
        onClick={handleDelete}
        className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full h-8 w-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
        title="Eliminar receta"
        aria-label="Eliminar receta"
      >
        <i className="fas fa-trash-alt fa-sm"></i>
      </button>

      <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 truncate">{recipe.name}</h3>
        <p className="text-pf-brown/80 text-sm mb-4 h-10 overflow-hidden text-ellipsis">{recipe.description}</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-pf-blue/30 text-pf-brown text-xs font-medium px-2 py-1 rounded-full">{tag}</span>
          ))}
        </div>
        <div className="flex justify-between items-center text-xs text-pf-brown/60 mt-auto">
          <span className="flex items-center">
            <i className="far fa-clock mr-1"></i>
            {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min
          </span>
          <span className="flex items-center">
            <i className="fas fa-utensils mr-1"></i>
            {recipe.servings} porciones
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;