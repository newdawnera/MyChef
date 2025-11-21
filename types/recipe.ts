// types/recipe.ts
/**
 * Spoonacular Recipe Type Definitions
 *
 * Based on Spoonacular API v1 documentation:
 * https://spoonacular.com/food-api/docs
 */

/**
 * Recipe from Spoonacular complexSearch endpoint
 * GET /recipes/complexSearch
 */
export interface SpoonacularRecipeSearchResult {
  id: number;
  title: string;
  image: string;
  imageType: string;
}

/**
 * Complete recipe information
 * GET /recipes/{id}/information
 */
export interface SpoonacularRecipe {
  // Basic info
  id: number;
  title: string;
  image: string;
  imageType?: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl?: string;
  spoonacularSourceUrl: string;

  // Nutritional info
  healthScore?: number;
  pricePerServing?: number;

  // Categories
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  occasions: string[];

  // Content
  summary: string;
  instructions: string;
  analyzedInstructions: Instruction[];
  extendedIngredients: Ingredient[];

  // Flags
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  veryHealthy: boolean;
  cheap: boolean;
  veryPopular: boolean;
  sustainable: boolean;
  lowFodmap: boolean;
  weightWatcherSmartPoints: number;
  gaps: string;
  preparationMinutes: number;
  cookingMinutes: number;
  aggregateLikes: number;
  spoonacularScore: number;
  creditsText: string;
  license: string;
  sourceName: string;

  // Wine pairing (if available)
  winePairing?: WinePairing;
}

/**
 * Ingredient object
 */
export interface Ingredient {
  id: number;
  aisle: string;
  image: string;
  consistency: string;
  name: string;
  nameClean: string;
  original: string;
  originalName: string;
  amount: number;
  unit: string;
  meta: string[];
  measures: {
    us: Measure;
    metric: Measure;
  };
}

export interface Measure {
  amount: number;
  unitShort: string;
  unitLong: string;
}

/**
 * Cooking instructions
 */
export interface Instruction {
  name: string;
  steps: InstructionStep[];
}

export interface InstructionStep {
  number: number;
  step: string;
  ingredients: {
    id: number;
    name: string;
    localizedName: string;
    image: string;
  }[];
  equipment: {
    id: number;
    name: string;
    localizedName: string;
    image: string;
  }[];
  length?: { number: number; unit: string };
}

/**
 * Wine pairing
 */
export interface WinePairing {
  pairedWines: string[];
  pairingText: string;
  productMatches: WineProduct[];
}

export interface WineProduct {
  id: number;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  averageRating: number;
  ratingCount: number;
  score: number;
  link: string;
}

/**
 * Nutrition information
 * GET /recipes/{id}/nutritionWidget.json
 */
export interface NutritionInfo {
  nutrients: Nutrient[];
  properties: Property[];
  flavonoids: Flavonoid[];
  ingredients: IngredientNutrition[];
  caloricBreakdown: CaloricBreakdown;
  weightPerServing: WeightPerServing;
}

export interface Nutrient {
  name: string;
  amount: number;
  unit: string;
  percentOfDailyNeeds: number;
}

export interface Property {
  name: string;
  amount: number;
  unit: string;
}

export interface Flavonoid {
  name: string;
  amount: number;
  unit: string;
}

export interface IngredientNutrition {
  id: number;
  name: string;
  amount: number;
  unit: string;
  nutrients: Nutrient[];
}

export interface CaloricBreakdown {
  percentProtein: number;
  percentFat: number;
  percentCarbs: number;
}

export interface WeightPerServing {
  amount: number;
  unit: string;
}

/**
 * Simplified recipe for UI display
 * Used in recipe cards, lists, etc.
 */
export interface SimpleRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  calories?: number; // Extracted from nutrition
  difficulty?: "Easy" | "Medium" | "Hard"; // Calculated
  tags?: string[]; // From diets, dishTypes, etc.
}

/**
 * Helper: Calculate difficulty based on recipe data
 */
export function calculateDifficulty(
  recipe: SpoonacularRecipe
): "Easy" | "Medium" | "Hard" {
  const time = recipe.readyInMinutes;
  const ingredientCount = recipe.extendedIngredients?.length || 0;
  const stepCount = recipe.analyzedInstructions?.[0]?.steps?.length || 0;

  // Simple heuristic
  if (time <= 20 && ingredientCount <= 8 && stepCount <= 5) {
    return "Easy";
  }
  if (time <= 45 && ingredientCount <= 15 && stepCount <= 10) {
    return "Medium";
  }
  return "Hard";
}

/**
 * Helper: Extract calories from nutrition info
 */
export function extractCalories(nutrition?: NutritionInfo): number | undefined {
  if (!nutrition) return undefined;
  const calorieNutrient = nutrition.nutrients.find(
    (n) => n.name.toLowerCase() === "calories"
  );
  return calorieNutrient?.amount;
}

/**
 * Helper: Convert SpoonacularRecipe to SimpleRecipe
 */
export function toSimpleRecipe(
  recipe: SpoonacularRecipe,
  nutrition?: NutritionInfo
): SimpleRecipe {
  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes,
    servings: recipe.servings,
    calories: extractCalories(nutrition),
    difficulty: calculateDifficulty(recipe),
    tags: [
      ...recipe.diets,
      ...recipe.dishTypes.slice(0, 2), // Limit to 2 dish types
    ],
  };
}

/**
 * Spoonacular API search parameters
 */
export interface SpoonacularSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  excludeIngredients?: string;
  includeIngredients?: string;
  type?: string; // meal type: main course, side dish, dessert, etc.
  maxReadyTime?: number;
  minCarbs?: number;
  maxCarbs?: number;
  minProtein?: number;
  maxProtein?: number;
  minCalories?: number;
  maxCalories?: number;
  minFat?: number;
  maxFat?: number;
  number?: number; // number of results (default 10)
  offset?: number; // for pagination
  sort?:
    | "meta-score"
    | "popularity"
    | "healthiness"
    | "price"
    | "time"
    | "random";
  sortDirection?: "asc" | "desc";
  addRecipeInformation?: boolean;
  addRecipeNutrition?: boolean;
  fillIngredients?: boolean;
}

/**
 * Spoonacular API search response
 */
export interface SpoonacularSearchResponse {
  results: SpoonacularRecipeSearchResult[];
  offset: number;
  number: number;
  totalResults: number;
}
