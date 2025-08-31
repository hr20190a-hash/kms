import { Recipe, InventoryItem, IngredientCost, SavedMenu } from '../types.ts';

// Normalizes common unit variations to a standard form.
export const normalizeUnit = (unit: string): string => {
    const u = unit.toLowerCase().trim();
    if (['kg', 'k', 'kilo', 'kilos'].includes(u)) return 'kg';
    if (['g', 'gr', 'gramo', 'gramos'].includes(u)) return 'g';
    if (['l', 'litro', 'litros'].includes(u)) return 'L';
    if (['ml', 'mililitro', 'mililitros'].includes(u)) return 'ml';
    return u;
};


// A simple unit converter to handle basic cases like g to kg, ml to L, etc.
export const convertUnits = (quantity: number, fromUnit: string, toUnit: string): number => {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);

    if (from === to) return quantity;
    
    // Weight and Volume conversions
    if ((from === 'g' && to === 'kg') || (from === 'ml' && to === 'L')) return quantity / 1000;
    if ((from === 'kg' && to === 'g') || (from === 'L' && to === 'ml')) return quantity * 1000;
    
    // Cannot convert, e.g. 'unidad' to 'kg'. Return NaN to indicate conversion failure.
    return NaN;
}

export const calculateRecipeCost = (recipe: Recipe, inventory: InventoryItem[]): { totalCost: number; costPerServing: number } => {
    const inventoryMap = new Map(inventory.map(item => [item.name.toLowerCase(), item]));
    
    let totalCost = 0;
    recipe.ingredients.forEach(ing => {
        const inventoryItem = inventoryMap.get(ing.name.toLowerCase());
        if (inventoryItem && inventoryItem.costPerUnit > 0) {
            const quantityInInventoryUnit = convertUnits(ing.quantity, ing.unit, inventoryItem.unit);
            if (!isNaN(quantityInInventoryUnit)) {
                const realCostPerUnit = inventoryItem.costPerUnit * (inventoryItem.correctionFactor || 1);
                totalCost += quantityInInventoryUnit * realCostPerUnit;
            } else {
                 console.warn(`Could not convert units for ingredient: ${ing.name} (from ${ing.unit} to ${inventoryItem.unit})`);
            }
        }
    });
    
    const costPerServing = recipe.servings > 0 ? totalCost / recipe.servings : 0;
    
    return { totalCost, costPerServing };
};


export const calculateIngredientCosts = (recipe: Recipe, inventory: InventoryItem[]): { ingredientCosts: IngredientCost[]; totalCost: number } => {
  const inventoryMap = new Map(inventory.map(item => [item.name.toLowerCase(), item]));
  
  const costs = recipe.ingredients.map(ing => {
    const inventoryItem = inventoryMap.get(ing.name.toLowerCase());
    let cost = 0;
    let realCostPerUnit = 0;
    let unit = '';

    if (inventoryItem && inventoryItem.costPerUnit > 0) {
      unit = inventoryItem.unit;
      realCostPerUnit = inventoryItem.costPerUnit * (inventoryItem.correctionFactor || 1);
      
      const quantityInInventoryUnit = convertUnits(ing.quantity, ing.unit, inventoryItem.unit);
      if (!isNaN(quantityInInventoryUnit)) {
        cost = quantityInInventoryUnit * realCostPerUnit;
      } else {
        console.warn(`Could not convert units for ingredient: ${ing.name} (from ${ing.unit} to ${inventoryItem.unit})`);
      }
    }
    return { name: ing.name, cost, realCostPerUnit, unit };
  });

  const totalCost = costs.reduce((sum, item) => sum + item.cost, 0);

  const ingredientCosts: IngredientCost[] = costs.map(item => ({
    ...item,
    percentage: totalCost > 0 ? (item.cost / totalCost) * 100 : 0,
  })).sort((a, b) => b.cost - a.cost);

  return { ingredientCosts, totalCost };
};

export const calculateMenuCostPerGuest = (menu: SavedMenu, allRecipes: Recipe[], inventory: InventoryItem[]): number => {
    const recipeMap = new Map(allRecipes.map(r => [r.id, r]));
    let totalCostPerGuest = 0;

    menu.recipeIds.forEach(recipeId => {
        const recipe = recipeMap.get(recipeId);
        if (recipe) {
            const { costPerServing } = calculateRecipeCost(recipe, inventory);
            totalCostPerGuest += costPerServing;
        }
    });

    return totalCostPerGuest;
};