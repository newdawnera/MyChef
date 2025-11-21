// types/preferences.ts
/**
 * User Preferences Data Model
 *
 * Matches the preferences screen UI (app/preferences/index.tsx)
 * These preferences will be:
 * 1. Stored in Firestore under users/{userId}/preferences
 * 2. Sent to Groq AI for personalized recipe recommendations
 * 3. Used to filter Spoonacular API results
 */

export interface UserPreferences {
  // Dietary restrictions (vegetarian, vegan, keto, etc.)
  selectedDiets: string[];

  // Allergies and food restrictions (peanuts, eggs, soy, etc.)
  selectedAllergies: string[];

  // Favorite cuisines (Italian, Mexican, Asian, etc.)
  selectedCuisines: string[];

  // Cooking skill level
  skillLevel: "Beginner" | "Intermediate" | "Advanced";

  // Meal goals (Weight Loss, Muscle Gain, etc.)
  selectedGoals: string[];

  // Ingredients to avoid (comma-separated or array)
  avoidIngredients: string[];

  // Default serving size (number of people)
  servingSize: number;

  // Optional: Nutritional goals
  nutritionalGoals?: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxSodium?: number;
  };

  // Optional: Time preferences
  maxCookingTime?: number; // in minutes

  // Metadata
  lastUpdated?: Date;
}

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  selectedDiets: [],
  selectedAllergies: [],
  selectedCuisines: [],
  skillLevel: "Intermediate",
  selectedGoals: [],
  avoidIngredients: [],
  servingSize: 2,
};

/**
 * Spoonacular diet type mapping
 * Maps our diet IDs to Spoonacular's diet parameter values
 */
export const SPOONACULAR_DIET_MAP: Record<string, string> = {
  vegetarian: "vegetarian",
  vegan: "vegan",
  keto: "ketogenic",
  paleo: "paleo",
  glutenFree: "gluten free",
  dairyFree: "dairy free",
  lowCarb: "ketogenic", // Spoonacular doesn't have low-carb, use keto
  highProtein: "primal", // Closest match
};

/**
 * Spoonacular intolerance mapping
 * Maps our allergy IDs to Spoonacular's intolerance parameter
 */
export const SPOONACULAR_INTOLERANCE_MAP: Record<string, string> = {
  peanuts: "peanut",
  treeNuts: "tree nut",
  eggs: "egg",
  soy: "soy",
  shellfish: "shellfish",
  wheat: "wheat",
  lactose: "dairy",
};

/**
 * Helper: Convert preferences to Spoonacular query parameters
 */
export function preferencesToSpoonacularParams(
  preferences: UserPreferences
): Record<string, string> {
  const params: Record<string, string> = {};

  // Diet
  if (preferences.selectedDiets.length > 0) {
    const diet = preferences.selectedDiets
      .map((d) => SPOONACULAR_DIET_MAP[d])
      .filter(Boolean)[0]; // Spoonacular accepts only one diet
    if (diet) params.diet = diet;
  }

  // Intolerances (can be comma-separated)
  if (preferences.selectedAllergies.length > 0) {
    const intolerances = preferences.selectedAllergies
      .map((a) => SPOONACULAR_INTOLERANCE_MAP[a])
      .filter(Boolean)
      .join(",");
    if (intolerances) params.intolerances = intolerances;
  }

  // Cuisine (can be comma-separated)
  if (preferences.selectedCuisines.length > 0) {
    params.cuisine = preferences.selectedCuisines.join(",").toLowerCase();
  }

  // Exclude ingredients
  if (preferences.avoidIngredients.length > 0) {
    params.excludeIngredients = preferences.avoidIngredients
      .join(",")
      .toLowerCase();
  }

  // Nutritional goals
  if (preferences.nutritionalGoals?.maxCalories) {
    params.maxCalories = preferences.nutritionalGoals.maxCalories.toString();
  }
  if (preferences.nutritionalGoals?.minProtein) {
    params.minProtein = preferences.nutritionalGoals.minProtein.toString();
  }
  if (preferences.nutritionalGoals?.maxCarbs) {
    params.maxCarbs = preferences.nutritionalGoals.maxCarbs.toString();
  }

  // Cooking time
  if (preferences.maxCookingTime) {
    params.maxReadyTime = preferences.maxCookingTime.toString();
  }

  return params;
}
