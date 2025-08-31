import React, { useState, useMemo } from 'react';
import { Recipe, InventoryItem, Ingredient, Co2Impact } from '../types.ts';
import Button from './common/Button.tsx';
import { analyzeAllergens, convertToVegetarian, suggestHealthierAlternative, calculateCo2Impact } from '../services/geminiService.ts';
import Spinner from './common/Spinner.tsx';
import RecipeCostAnalysis from './RecipeCostAnalysis.tsx';
import { calculateRecipeCost, normalizeUnit } from '../utils/cost-utils.ts';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onRecipeUpdate: (updatedRecipe: Recipe) => void;
  inventory: InventoryItem[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onFindSubstitutions: (recipe: Recipe, ingredient: Ingredient) => void;
  onRecipeConverted: (convertedRecipe: Recipe) => void;
  onHealthierAlternative: (healthierRecipe: Recipe) => void;
  onOpenCo2Suggestions: (recipe: Recipe) => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack, onRecipeUpdate, inventory, onEdit, onDelete, onFindSubstitutions, onRecipeConverted, onHealthierAlternative, onOpenCo2Suggestions }) => {
  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const [isLoadingAllergens, setIsLoadingAllergens] = useState(false);
  const [allergenError, setAllergenError] = useState<string | null>(null);
  const [scaledServings, setScaledServings] = useState(recipe.servings);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isMakingHealthier, setIsMakingHealthier] = useState(false);
  const [healthierError, setHealthierError] = useState<string | null>(null);
  const [isCalculatingCo2, setIsCalculatingCo2] = useState(false);
  const [co2Error, setCo2Error] = useState<string | null>(null);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), []);
  
  const { scaledIngredients, scaledTotalCost, scalingFactor, totalWeightGrams, weightPerServingGrams } = useMemo(() => {
    if (recipe.servings <= 0) {
        return { scaledIngredients: recipe.ingredients, scaledTotalCost: 0, scalingFactor: 1, totalWeightGrams: 0, weightPerServingGrams: 0 };
    }
    const factor = scaledServings / recipe.servings;
    const currentScaledIngredients = recipe.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity * factor,
    }));
    
    const tempRecipe = { ...recipe, ingredients: currentScaledIngredients };
    const { totalCost } = calculateRecipeCost(tempRecipe, inventory);

    const totalWeightGrams = currentScaledIngredients.reduce((total, ing) => {
        const u = normalizeUnit(ing.unit);
        let grams = 0;
        if (u === 'g' || u === 'ml') { // Assuming 1ml = 1g
            grams = ing.quantity;
        } else if (u === 'kg' || u === 'L') { // Assuming 1L = 1kg
            grams = ing.quantity * 1000;
        }
        return total + grams;
    }, 0);

    const weightPerServingGrams = scaledServings > 0 ? totalWeightGrams / scaledServings : 0;


    return { scaledIngredients: currentScaledIngredients, scaledTotalCost: totalCost, scalingFactor: factor, totalWeightGrams, weightPerServingGrams };
  }, [scaledServings, recipe, inventory]);
  
  const formatQuantity = (quantity: number) => {
    if (quantity % 1 === 0) return quantity;
    if (quantity < 0.1 && quantity > 0) return quantity.toFixed(3);
    return quantity.toFixed(2);
  };

  const isVegetarian = useMemo(() => {
    const lowerTags = recipe.tags.map(t => t.toLowerCase());
    return lowerTags.includes('vegetariano') || lowerTags.includes('vegano');
  }, [recipe.tags]);

  const handleConvertToVegetarian = async () => {
    setIsConverting(true);
    setConversionError(null);
    try {
        const convertedRecipe = await convertToVegetarian(recipe);
        onRecipeConverted(convertedRecipe);
    } catch (error) {
        setConversionError('No se pudo convertir la receta. Por favor, inténtalo de nuevo.');
        console.error(error);
    } finally {
        setIsConverting(false);
    }
  };
  
  const handleSuggestHealthier = async () => {
    setIsMakingHealthier(true);
    setHealthierError(null);
    try {
        const healthierRecipe = await suggestHealthierAlternative(recipe);
        onHealthierAlternative(healthierRecipe);
    } catch (error) {
        setHealthierError('No se pudo generar la alternativa saludable. Por favor, inténtalo de nuevo.');
        console.error(error);
    } finally {
        setIsMakingHealthier(false);
    }
  };

  const handleAnalyzeAllergens = async () => {
      setIsLoadingAllergens(true);
      setAllergenError(null);
      try {
          const result = await analyzeAllergens(recipe.ingredients);
          onRecipeUpdate({ ...recipe, allergens: result });
      } catch (error) {
          setAllergenError('No se pudo analizar los alérgenos. Inténtalo de nuevo.');
          console.error(error);
      } finally {
          setIsLoadingAllergens(false);
      }
  };

  const handleCalculateCo2 = async () => {
    setIsCalculatingCo2(true);
    setCo2Error(null);
    try {
        const result = await calculateCo2Impact(recipe);
        onRecipeUpdate({ ...recipe, co2Impact: result });
    } catch (error) {
        setCo2Error('No se pudo calcular el impacto de CO2. Inténtalo de nuevo.');
        console.error(error);
    } finally {
        setIsCalculatingCo2(false);
    }
  };

  const getCo2ImpactStyles = (rating?: Co2Impact['rating']) => {
    switch (rating) {
        case 'Bajo':
            return {
                badge: 'bg-green-100 text-green-800',
                text: 'text-green-700',
                icon: 'fa-leaf',
                borderColor: 'border-green-500'
            };
        case 'Medio':
            return {
                badge: 'bg-yellow-100 text-yellow-800',
                text: 'text-yellow-700',
                icon: 'fa-smog',
                borderColor: 'border-yellow-500'
            };
        case 'Alto':
            return {
                badge: 'bg-red-100 text-red-800',
                text: 'text-red-700',
                icon: 'fa-industry',
                borderColor: 'border-red-500'
            };
        default:
            return {
                badge: 'bg-gray-100 text-gray-800',
                text: 'text-gray-700',
                icon: 'fa-question-circle',
                borderColor: 'border-gray-500'
            };
    }
  };


  return (
    <div className="bg-white/80 p-8 rounded-2xl shadow-xl max-w-5xl mx-auto animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={onBack} className="flex items-center text-pf-green hover:text-pf-brown font-semibold mb-4">
            <i className="fas fa-arrow-left mr-2"></i>
            Volver a la lista
          </button>
          <h1 className="text-4xl font-extrabold text-pf-brown">{recipe.name}</h1>
          <p className="text-lg text-gray-600 mt-2">{recipe.description}</p>
        </div>
        <div className="flex space-x-2">
            <Button onClick={handleSuggestHealthier} disabled={isMakingHealthier} variant="secondary">
                {isMakingHealthier ? <Spinner /> : <><i className="fas fa-heartbeat mr-2"></i>Saludable</>}
            </Button>
            {!isVegetarian && (
                <Button onClick={handleConvertToVegetarian} disabled={isConverting} variant="secondary">
                    {isConverting ? <Spinner /> : <><i className="fas fa-leaf mr-2"></i>Vegetariana</>}
                </Button>
            )}
            <Button onClick={() => onEdit(recipe)}><i className="fas fa-edit mr-2"></i>Editar</Button>
            <Button variant="destructive" onClick={() => onDelete(recipe.id)}>
                <i className="fas fa-trash-alt mr-2"></i>Eliminar
            </Button>
        </div>
      </div>
      
      {conversionError && <p className="text-red-500 mt-2 bg-red-100 p-3 rounded-lg text-center mb-4">{conversionError}</p>}
      {healthierError && <p className="text-red-500 mt-2 bg-red-100 p-3 rounded-lg text-center mb-4">{healthierError}</p>}


      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-auto object-cover rounded-lg shadow-md" />
          <div className="mt-6 grid grid-cols-2 gap-4 text-center">
            <div className="bg-pf-beige p-4 rounded-lg">
              <p className="text-sm text-pf-brown font-bold">Tiempo Prep.</p>
              <p className="text-xl font-semibold">{recipe.prepTimeMinutes} min</p>
            </div>
            <div className="bg-pf-beige p-4 rounded-lg">
              <p className="text-sm text-pf-brown font-bold">Tiempo Cocción</p>
              <p className="text-xl font-semibold">{recipe.cookTimeMinutes} min</p>
            </div>
             <div className="bg-pf-green/20 p-4 rounded-lg">
              <p className="text-sm text-pf-brown font-bold">Tiempo Total</p>
              <p className="text-xl font-semibold">{totalTime} min</p>
            </div>
             <div className="bg-pf-green/20 p-4 rounded-lg">
              <p className="text-sm text-pf-brown font-bold">Porciones</p>
              <p className="text-xl font-semibold">{recipe.servings}</p>
            </div>
          </div>
           <div className="mt-6">
            <h3 className="text-xl font-bold mb-3 text-pf-brown">Etiquetas</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map(tag => (
                <span key={tag} className="bg-pf-blue/30 text-pf-brown text-sm font-medium px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:w-2/3 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold mb-4 text-pf-brown border-b-2 border-pf-gold pb-2">Ingredientes</h2>
            
            <div className="bg-pf-beige/60 p-4 rounded-lg mb-4">
                <h3 className="font-bold text-pf-brown mb-2">Escalar Receta</h3>
                <div className="grid grid-cols-3 gap-4 items-end">
                    <div className="col-span-1">
                        <label htmlFor="servings-scaler" className="block text-sm font-medium text-pf-brown/80 mb-1">
                            Nº de Comensales
                        </label>
                        <input
                            type="number"
                            id="servings-scaler"
                            value={scaledServings}
                            onChange={(e) => setScaledServings(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            min="1"
                            className="w-full p-2 border rounded bg-white text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pf-green"
                        />
                    </div>
                    <div className="col-span-1 text-center">
                        <p className="block text-sm font-medium text-pf-brown/80 mb-1">Factor de Escalado</p>
                        <p className="font-extrabold text-2xl text-pf-brown">x{scalingFactor.toFixed(2)}</p>
                    </div>
                    <div className="col-span-1 text-right">
                        <p className="block text-sm font-medium text-pf-brown/80 mb-1">Costo Total Estimado</p>
                        <p className="font-extrabold text-2xl text-pf-green">{currencyFormatter.format(scaledTotalCost)}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-pf-brown/20 grid grid-cols-2 gap-4">
                    <div className="text-left">
                        <p className="block text-sm font-medium text-pf-brown/80 mb-1">Peso Total Estimado</p>
                        <p className="font-extrabold text-2xl text-pf-brown">{totalWeightGrams > 999 ? `${(totalWeightGrams / 1000).toFixed(2)} kg` : `${Math.round(totalWeightGrams)} g`}</p>
                    </div>
                    <div className="text-right">
                        <p className="block text-sm font-medium text-pf-brown/80 mb-1">Peso por Porción</p>
                        <p className="font-extrabold text-2xl text-pf-brown">{weightPerServingGrams > 999 ? `${(weightPerServingGrams / 1000).toFixed(2)} kg` : `${Math.round(weightPerServingGrams)} g`}</p>
                    </div>
                </div>
            </div>

            <ul className="space-y-3 text-gray-700">
              {scaledIngredients.map((ing, index) => (
                <li key={`${ing.name}-${index}`} className="flex items-center justify-between group">
                  <div className="flex items-center">
                    <i className="fas fa-check-circle text-pf-gold mr-3"></i>
                    <span><strong>{formatQuantity(ing.quantity)} {ing.unit}</strong> de {ing.name}</span>
                  </div>
                   <button 
                      onClick={() => onFindSubstitutions(recipe, recipe.ingredients[index])}
                      className="opacity-0 group-hover:opacity-100 text-pf-blue hover:text-pf-green transition-opacity ml-4 p-1"
                      title={`Buscar sustituto para ${ing.name}`}
                    >
                      <i className="fas fa-exchange-alt"></i>
                    </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold mb-4 text-pf-brown border-b-2 border-pf-green pb-2">Pasos de Preparación</h2>
            <ol className="space-y-4 text-gray-700">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex">
                  <span className="bg-pf-green text-white rounded-full h-8 w-8 text-center leading-8 font-bold mr-4 flex-shrink-0">{index + 1}</span>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-pf-beige">
        <h2 className="text-2xl font-bold mb-4 text-pf-brown border-b-2 border-pf-gold pb-2">Desglose de Costos</h2>
        <RecipeCostAnalysis recipe={{...recipe, servings: scaledServings, ingredients: scaledIngredients}} inventory={inventory} />
      </div>

      <div className="mt-8 pt-8 border-t border-pf-beige">
        <h2 className="text-2xl font-bold mb-4 text-pf-brown border-b-2 border-pf-blue pb-2">Análisis de Alérgenos</h2>
        {!recipe.allergens ? (
            <div>
                <p className="text-gray-600 mb-4">Analiza los ingredientes de esta receta con IA para identificar alérgenos comunes. Si cambias un ingrediente, necesitarás volver a analizar.</p>
                <Button onClick={handleAnalyzeAllergens} disabled={isLoadingAllergens}>
                    {isLoadingAllergens ? <Spinner /> : <><i className="fas fa-flask mr-2"></i>Analizar Alérgenos con IA</>}
                </Button>
                {allergenError && <p className="text-red-500 mt-2">{allergenError}</p>}
            </div>
        ) : (
            recipe.allergens.allergens.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recipe.allergens.allergens.map(allergen => (
                        <div key={allergen.name} className="bg-pf-beige/60 p-4 rounded-lg">
                            <h4 className="font-bold text-lg text-pf-brown flex items-center">
                                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                {allergen.name}
                            </h4>
                            <p className="text-sm text-pf-brown/80 mt-1">Presente en:</p>
                            <ul className="list-disc list-inside text-sm mt-1 text-pf-brown">
                                {allergen.ingredients.map(ing => <li key={ing}>{ing}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-green-700 font-semibold bg-green-100 p-4 rounded-lg flex items-center">
                    <i className="fas fa-check-circle mr-2"></i>
                    No se identificaron alérgenos comunes en el análisis.
                </p>
            )
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-pf-beige">
        <h2 className="text-2xl font-bold mb-4 text-pf-brown border-b-2 border-pf-green pb-2">Impacto Ambiental (CO2)</h2>
        {!recipe.co2Impact ? (
            <div>
                <p className="text-gray-600 mb-4">Analiza la huella de carbono de esta receta. El cálculo considera los ingredientes, el método de cocción y el uso de gas transportado desde Cartagena.</p>
                <Button onClick={handleCalculateCo2} disabled={isCalculatingCo2}>
                    {isCalculatingCo2 ? <Spinner /> : <><i className="fas fa-seedling mr-2"></i>Calcular Impacto CO2</>}
                </Button>
                {co2Error && <p className="text-red-500 mt-2">{co2Error}</p>}
            </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`p-6 rounded-xl border-l-8 ${getCo2ImpactStyles(recipe.co2Impact.rating).borderColor} bg-pf-beige/50 flex-1`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-3 py-1 text-sm font-bold leading-none rounded-full ${getCo2ImpactStyles(recipe.co2Impact.rating).badge}`}>
                    <i className={`fas ${getCo2ImpactStyles(recipe.co2Impact.rating).icon} mr-2`}></i>
                    Impacto {recipe.co2Impact.rating}
                  </span>
                  <p className={`text-4xl font-extrabold mt-2 ${getCo2ImpactStyles(recipe.co2Impact.rating).text}`}>
                    {recipe.co2Impact.value.toFixed(2)}
                  </p>
                  <p className="text-sm text-pf-brown/80">{recipe.co2Impact.unit}</p>
                </div>
                <div className="text-center">
                    <Button onClick={() => onOpenCo2Suggestions(recipe)}>
                        <i className="fas fa-lightbulb mr-2"></i>
                        Sugerir Mejoras
                    </Button>
                    <button onClick={handleCalculateCo2} disabled={isCalculatingCo2} className="text-xs text-pf-brown/60 hover:text-pf-brown mt-2">
                      {isCalculatingCo2 ? <Spinner/> : 'Volver a calcular'}
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;