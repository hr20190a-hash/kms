import React, { useMemo } from 'react';
import { Recipe } from '../types.ts';
import RecipeCard from './RecipeCard.tsx';
import Button from './common/Button.tsx';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  searchTerm: string;
  onNewRecipe: () => void;
  onDeleteRecipe: (recipeId: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, searchTerm, onNewRecipe, onDeleteRecipe }) => {
  const filteredRecipes = useMemo(() => {
    if (!searchTerm.trim()) {
      return recipes;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return recipes.filter(recipe => {
      const nameMatch = recipe.name.toLowerCase().includes(lowercasedTerm);
      const tagMatch = recipe.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm));
      const ingredientMatch = recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowercasedTerm));
      return nameMatch || tagMatch || ingredientMatch;
    });
  }, [recipes, searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Base de Datos de Recetas</h2>
        <Button onClick={onNewRecipe}>
          <i className="fas fa-plus mr-2"></i>
          Nueva Receta
        </Button>
      </div>
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredRecipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onSelectRecipe={onSelectRecipe} 
              onDeleteRecipe={onDeleteRecipe} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/50 rounded-lg">
          <i className="fas fa-search fa-3x text-pf-brown/30 mb-4"></i>
          <p className="text-pf-brown text-xl">No se encontraron recetas que coincidan con "<span className="font-semibold">{searchTerm}</span>".</p>
          <p className="text-pf-brown/80 mt-2">Intenta con otro término de búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default RecipeList;