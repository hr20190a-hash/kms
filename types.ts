export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Step {
  description: string;
}

export interface AllergenInfo {
  allergens: {
    name: string;
    ingredients: string[];
  }[];
}

export interface IngredientSubstitution {
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

export interface Co2Impact {
  rating: 'Bajo' | 'Medio' | 'Alto';
  value: number; // e.g., 1.25
  unit: string; // e.g., "kg CO2e / porción"
}

export interface Co2ReductionSuggestion {
  suggestion: string;
  explanation: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  allergens?: AllergenInfo;
  co2Impact?: Co2Impact;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId?: string;
  purchaseDate: string; // ISO string
  expiryDate: string; // ISO string
  correctionFactor?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
}

export interface ComplianceDocument {
  id: string;
  name: string;
  url: string; // For simulation, in a real app this would be a URL to the file
  uploadedAt: string;
}

export interface ComplianceTask {
  id: string;
  name: string;
  category: string;
  frequency: 'Diaria' | 'Semanal' | 'Mensual';
  dueDate: string; // ISO string
  status: 'Pendiente' | 'Completado' | 'Atrasado';
  completedBy?: string;
  completedAt?: string; // ISO string
  documents?: ComplianceDocument[];
}

export interface EventLog {
  id: string;
  date: string; // ISO string
  observation: string;
  correctiveAction: string;
  isCorrected: boolean;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  createdAt: string; // ISO string
  status: 'Pendiente' | 'Realizado';
  items: PurchaseOrderItem[];
  totalCost: number;
}

export interface SavedMenu {
  id: string;
  name: string;
  date: string; // ISO string
  recipeIds: string[];
}

export interface DayPlan {
  lunch?: string; // SavedMenu ID
  dinner?: string; // SavedMenu ID
  guests: number;
}

export interface WeeklyPlan {
  [date: string]: DayPlan; // Key is ISO date string YYYY-MM-DD
}


export interface IngredientCost {
  name: string;
  cost: number;
  percentage: number;
  realCostPerUnit: number;
  unit: string;
}

export interface WasteUtilizationIdea {
  ideaName: string;
  wasteUsed: string[];
  preparation: string;
}

export interface PriceCheckResult {
  isReasonable: boolean;
  justification: string;
  estimatedPrice: string; // e.g., "entre $5,000 y $7,000 COP por kg"
}

export interface BulkPurchaseAnalysisResult {
  isRecommended: boolean;
  suggestedBulkQuantity: string;
  estimatedBulkPricePerUnit: number;
  estimatedSavingsPerUnit: number;
  justification: string;
}

export interface BulkPurchaseSuggestion {
  ingredientName: string;
  inventoryItem: InventoryItem;
  fourWeekUsage: {
    quantity: number;
    unit: string;
  };
  analysis: BulkPurchaseAnalysisResult;
}

export type WasteReason = 'Expirado' | 'Error de preparación' | 'Deterioro' | 'Sobreproducción' | 'Dañado en entrega';

export interface WasteLogEntry {
  id: string;
  date: string; // ISO string
  dish: string;
  ingredient: string;
  quantity: number;
  unit: string;
  reason: WasteReason;
  observations: string;
}

export interface YieldTest {
  id: string;
  date: string; // ISO string
  ingredientName: string;
  supplierName: string;
  purchaseSpecification: string;
  grossWeightKg: number;
  netWeightKg: number;
  wasteWeightKg: number; // calculated: grossWeightKg - netWeightKg
  yieldPercentage: number; // calculated: (netWeightKg / grossWeightKg) * 100
  correctionFactor: number; // calculated: grossWeightKg / netWeightKg
  costPerKgGross: number;
  realCostPerKgNet: number; // calculated: costPerKgGross * correctionFactor
  performedBy: string;
  observations: string;
}