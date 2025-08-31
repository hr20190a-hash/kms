import { Recipe, AllergenInfo, Ingredient, IngredientSubstitution, WasteUtilizationIdea, PriceCheckResult, InventoryItem, BulkPurchaseAnalysisResult, Supplier, Co2Impact, Co2ReductionSuggestion } from '../types.ts';

// Helper function to handle fetch requests to our PHP proxy
const fetchFromAIProxy = async (action: string, payload: any) => {
    const response = await fetch('api/ai_handler.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error from AI proxy: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    if (result.error) {
        throw new Error(result.error);
    }
    return result.data;
};


export const generateRecipe = async (ingredients: string): Promise<Recipe> => {
  try {
    const recipeData = await fetchFromAIProxy('generateRecipe', { ingredients });
    
    // Add a placeholder image and a temporary ID
    return {
      ...recipeData,
      id: `ai-recipe-${Date.now()}`,
      imageUrl: `https://picsum.photos/seed/${recipeData.name.split(' ').join('-')}/800/600`,
    };

  } catch (error) {
    console.error("Error generating recipe via proxy:", error);
    throw new Error("Failed to generate recipe. Please check the backend proxy and your API key.");
  }
};

export const analyzeAllergens = async (ingredients: { name: string }[]): Promise<AllergenInfo> => {
    try {
        return await fetchFromAIProxy('analyzeAllergens', { ingredients });
    } catch (error) {
        console.error("Error analyzing allergens via proxy:", error);
        throw new Error("Failed to analyze allergens.");
    }
};

export const getIngredientSubstitutions = async (
  ingredient: Ingredient,
  recipeName: string,
  allIngredients: Ingredient[]
): Promise<IngredientSubstitution[]> => {
  try {
    const data = await fetchFromAIProxy('getIngredientSubstitutions', { ingredient, recipeName, allIngredients });
    return data.substitutions || [];
  } catch (error) {
    console.error("Error getting substitutions via proxy:", error);
    throw new Error("Failed to get ingredient substitutions.");
  }
};

export const convertToVegetarian = async (recipe: Recipe): Promise<Recipe> => {
  try {
    return await fetchFromAIProxy('convertToVegetarian', { recipe });
  } catch (error) {
    console.error("Error converting recipe to vegetarian via proxy:", error);
    throw new Error("Failed to convert recipe to vegetarian.");
  }
};

export const suggestHealthierAlternative = async (recipe: Recipe): Promise<Recipe> => {
  try {
    return await fetchFromAIProxy('suggestHealthierAlternative', { recipe });
  } catch (error) {
    console.error("Error suggesting healthier alternative via proxy:", error);
    throw new Error("Failed to suggest healthier alternative.");
  }
};

export const suggestRecipesFromWaste = async (menuItems: Recipe[]): Promise<WasteUtilizationIdea[]> => {
    try {
        const data = await fetchFromAIProxy('suggestRecipesFromWaste', { menuItems });
        return data.suggestions || [];
    } catch (error) {
        console.error("Error suggesting recipes from waste via proxy:", error);
        throw new Error("Failed to suggest recipes from waste.");
    }
};

export const checkItemPrice = async (itemName: string, itemPrice: number, itemUnit: string): Promise<PriceCheckResult> => {
    try {
        return await fetchFromAIProxy('checkItemPrice', { itemName, itemPrice, itemUnit });
    } catch (error) {
        console.error("Error checking item price via proxy:", error);
        return {
            isReasonable: true,
            estimatedPrice: "N/A",
            justification: "No se pudo verificar el precio debido a un error del servicio."
        };
    }
};

export const getBulkPurchaseSuggestion = async (
    item: InventoryItem,
    supplier: Supplier | undefined,
    monthlyUsage: number
): Promise<BulkPurchaseAnalysisResult> => {
    try {
        return await fetchFromAIProxy('getBulkPurchaseSuggestion', { item, supplier, monthlyUsage });
    } catch (error) {
        console.error("Error getting bulk purchase suggestion via proxy:", error);
        throw new Error("Failed to get bulk purchase suggestion.");
    }
};

export const calculateCo2Impact = async (recipe: Recipe): Promise<Co2Impact> => {
    try {
        return await fetchFromAIProxy('calculateCo2Impact', { recipe });
    } catch (error) {
        console.error("Error calculating CO2 impact via proxy:", error);
        throw new Error("Failed to calculate CO2 impact.");
    }
};

export const getCo2ReductionSuggestions = async (recipe: Recipe): Promise<Co2ReductionSuggestion[]> => {
    try {
        const data = await fetchFromAIProxy('getCo2ReductionSuggestions', { recipe });
        return data.suggestions || [];
    } catch (error)
    {
        console.error("Error getting CO2 reduction suggestions via proxy:", error);
        throw new Error("Failed to get CO2 reduction suggestions.");
    }
};

export const getCorrectionFactorSuggestion = async (itemName: string): Promise<number> => {
    try {
        const data = await fetchFromAIProxy('getCorrectionFactorSuggestion', { itemName });
        if (data && typeof data.factor === 'number' && data.factor >= 1) {
            return parseFloat(data.factor.toFixed(2));
        }
        console.warn("Received invalid factor from proxy, defaulting to 1.0", data);
        return 1.0;
    } catch (error) {
        console.error(`Error getting correction factor for "${itemName}" via proxy:`, error);
        throw new Error("Failed to get correction factor suggestion.");
    }
};