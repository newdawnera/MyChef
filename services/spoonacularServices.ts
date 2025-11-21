// services/spoonacularServices.ts
/**
 * Spoonacular API Service
 *
 * Documentation: https://spoonacular.com/food-api/docs
 *
 * IMPORTANT: Get your API key from https://spoonacular.com/food-api/console#Dashboard
 * Free tier: 150 requests/day
 */

import Constants from "expo-constants";
import {
  SpoonacularRecipe,
  SpoonacularSearchParams,
  SpoonacularSearchResponse,
  NutritionInfo,
  SpoonacularRecipeSearchResult,
} from "@/types/recipe";

const SPOONACULAR_API_KEY =
  Constants.expoConfig?.extra?.spoonacularApiKey ||
  process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";

/**
 * Check if API key is configured
 */
export function isSpoonacularConfigured(): boolean {
  return !!SPOONACULAR_API_KEY;
}

/**
 * Generic fetch wrapper with error handling
 */
async function spoonacularFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  if (!SPOONACULAR_API_KEY) {
    throw new Error(
      "Spoonacular API key not configured. Please add EXPO_PUBLIC_SPOONACULAR_API_KEY to .env"
    );
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("apiKey", SPOONACULAR_API_KEY);

  // Add additional params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  console.log("🌐 Spoonacular API:", endpoint);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      `Spoonacular API error: ${error.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Search recipes with complex parameters
 * GET /recipes/complexSearch
 */
export async function searchRecipes(
  params: SpoonacularSearchParams
): Promise<SpoonacularSearchResponse> {
  const queryParams: Record<string, string> = {};

  // Convert params to string values
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams[key] = String(value);
    }
  });

  // Default params
  if (!queryParams.number) {
    queryParams.number = "10";
  }
  if (!queryParams.addRecipeInformation) {
    queryParams.addRecipeInformation = "true";
  }

  return spoonacularFetch<SpoonacularSearchResponse>(
    "/recipes/complexSearch",
    queryParams
  );
}

/**
 * Get detailed recipe information by ID
 * GET /recipes/{id}/information
 */
export async function getRecipeDetails(
  recipeId: number
): Promise<SpoonacularRecipe> {
  return spoonacularFetch<SpoonacularRecipe>(
    `/recipes/${recipeId}/information`,
    { includeNutrition: "true" }
  );
}

/**
 * Get recipe nutrition information
 * GET /recipes/{id}/nutritionWidget.json
 */
export async function getRecipeNutrition(
  recipeId: number
): Promise<NutritionInfo> {
  return spoonacularFetch<NutritionInfo>(
    `/recipes/${recipeId}/nutritionWidget.json`
  );
}

/**
 * Get similar recipes
 * GET /recipes/{id}/similar
 */
export async function getSimilarRecipes(
  recipeId: number,
  numberOfResults: number = 3
): Promise<SpoonacularRecipeSearchResult[]> {
  return spoonacularFetch<SpoonacularRecipeSearchResult[]>(
    `/recipes/${recipeId}/similar`,
    { number: String(numberOfResults) }
  );
}

/**
 * Get random recipes
 * GET /recipes/random
 */
export async function getRandomRecipes(params?: {
  tags?: string;
  number?: number;
}): Promise<{ recipes: SpoonacularRecipe[] }> {
  const queryParams: Record<string, string> = {};

  if (params?.tags) queryParams.tags = params.tags;
  if (params?.number) queryParams.number = String(params.number);
  else queryParams.number = "10";

  return spoonacularFetch<{ recipes: SpoonacularRecipe[] }>(
    "/recipes/random",
    queryParams
  );
}

/**
 * Search recipes by ingredients
 * GET /recipes/findByIngredients
 */
export async function searchByIngredients(
  ingredients: string[],
  numberOfResults: number = 10
): Promise<any[]> {
  return spoonacularFetch<any[]>("/recipes/findByIngredients", {
    ingredients: ingredients.join(","),
    number: String(numberOfResults),
    ranking: "2", // Maximize used ingredients
    ignorePantry: "false",
  });
}

/**
 * Get recipes by category (helper function)
 */
export async function getRecipesByCategory(
  category: string,
  numberOfResults: number = 20
): Promise<SpoonacularSearchResponse> {
  // Map category to Spoonacular parameters
  const categoryMap: Record<string, Partial<SpoonacularSearchParams>> = {
    meat: { type: "main course", query: "meat" },
    vegetarian: { diet: "vegetarian", type: "main course" },
    vegan: { diet: "vegan", type: "main course" },
    desserts: { type: "dessert" },
    quickMeals: { maxReadyTime: 30, type: "main course" },
    breakfast: { type: "breakfast" },
    seafood: { type: "main course", query: "seafood" },
    pasta: { type: "main course", query: "pasta" },
    salads: { type: "salad" },
    soups: { type: "soup" },
  };

  const categoryParams = categoryMap[category] || { query: category };

  return searchRecipes({
    ...categoryParams,
    number: numberOfResults,
    sort: "popularity",
    addRecipeInformation: true,
  });
}

/**
 * Autocomplete recipe search (for search suggestions)
 * GET /recipes/autocomplete
 */
export async function autocompleteRecipeSearch(
  query: string,
  numberOfResults: number = 5
): Promise<{ id: number; title: string; imageType: string }[]> {
  return spoonacularFetch<{ id: number; title: string; imageType: string }[]>(
    "/recipes/autocomplete",
    { query, number: String(numberOfResults) }
  );
}

/**
 * Parse ingredients (for future use)
 * POST /recipes/parseIngredients
 */
export async function parseIngredients(
  ingredientList: string,
  servings: number = 1
): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/recipes/parseIngredients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY!,
      ingredientList,
      servings: String(servings),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to parse ingredients");
  }

  return response.json();
}

/**
 * Helper: Convert Groq response to Spoonacular search params
 */
export function groqToSpoonacularParams(
  groqResponse: any
): SpoonacularSearchParams {
  const params: SpoonacularSearchParams = {
    number: 20,
    addRecipeInformation: true,
    addRecipeNutrition: true,
    sort: "popularity",
  };

  // Natural language query
  if (groqResponse.naturalLanguageQuery) {
    params.query = groqResponse.naturalLanguageQuery;
  }

  // Ingredients
  if (groqResponse.ingredients && groqResponse.ingredients.length > 0) {
    params.includeIngredients = groqResponse.ingredients.join(",");
  }

  // Cuisine
  if (groqResponse.cuisines && groqResponse.cuisines.length > 0) {
    params.cuisine = groqResponse.cuisines.join(",");
  }

  // Meal type
  if (groqResponse.mealType) {
    params.type = groqResponse.mealType;
  }

  // Diet
  if (groqResponse.diets && groqResponse.diets.length > 0) {
    params.diet = groqResponse.diets[0]; // Spoonacular accepts only one diet
  }

  // Intolerances
  if (groqResponse.intolerances && groqResponse.intolerances.length > 0) {
    params.intolerances = groqResponse.intolerances.join(",");
  }

  // Exclude ingredients
  if (
    groqResponse.excludeIngredients &&
    groqResponse.excludeIngredients.length > 0
  ) {
    params.excludeIngredients = groqResponse.excludeIngredients.join(",");
  }

  // Nutritional targets
  if (groqResponse.nutritionalTargets) {
    if (groqResponse.nutritionalTargets.maxCalories) {
      params.maxCalories = groqResponse.nutritionalTargets.maxCalories;
    }
    if (groqResponse.nutritionalTargets.minProtein) {
      params.minProtein = groqResponse.nutritionalTargets.minProtein;
    }
    if (groqResponse.nutritionalTargets.maxCarbs) {
      params.maxCarbs = groqResponse.nutritionalTargets.maxCarbs;
    }
  }

  // Cooking time
  if (groqResponse.maxCookingTime) {
    params.maxReadyTime = groqResponse.maxCookingTime;
  }

  return params;
}

export default {
  searchRecipes,
  getRecipeDetails,
  getRecipeNutrition,
  getSimilarRecipes,
  getRandomRecipes,
  searchByIngredients,
  getRecipesByCategory,
  autocompleteRecipeSearch,
  parseIngredients,
  groqToSpoonacularParams,
  isSpoonacularConfigured,
};
