// services/spoonacularServices.ts - ENHANCED WITH SMART PARAMETER MAPPING
/**
 * Spoonacular API Service - INTELLIGENT SEARCH
 *
 * NEW FEATURES:
 * 1. Maps enhanced Groq analysis to optimal Spoonacular params
 * 2. Respects priority levels (Critical > High > Medium > Low)
 * 3. Progressive relaxation strategy when no results
 * 4. Smart ingredient simplification
 * 5. Meal goal integration
 * 6. Better caching strategy
 * 7. ULTIMATE FALLBACK: Ensures no zero-result states
 */

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SpoonacularRecipe,
  SpoonacularSearchParams,
  SpoonacularSearchResponse,
  NutritionInfo,
  SpoonacularRecipeSearchResult,
} from "@/types/recipe";
import { RecipeAnalysisResponse } from "./groqServices";

const SPOONACULAR_API_KEY =
  Constants.expoConfig?.extra?.spoonacularApiKey ||
  process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";

// Cache settings
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const CACHE_KEY_PREFIX = "spoonacular_cache_";

// Ingredient simplification mapping
const INGREDIENT_SIMPLIFICATION: Record<string, string> = {
  "jollof rice": "rice",
  "fried rice": "rice",
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "chicken breast": "chicken",
  "chicken thigh": "chicken",
  catfish: "fish",
  tilapia: "fish",
  salmon: "fish",
  "bell pepper": "peppers",
  "red onion": "onions",
  "white onion": "onions",
  "cherry tomatoes": "tomatoes",
};

export function isSpoonacularConfigured(): boolean {
  return !!SPOONACULAR_API_KEY;
}

/**
 * Simplify ingredient name
 */
function simplifyIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase().trim();
  return INGREDIENT_SIMPLIFICATION[lower] || lower;
}

/**
 * Generate cache key
 */
function getCacheKey(params: SpoonacularSearchParams): string {
  return `${CACHE_KEY_PREFIX}${JSON.stringify(params)}`;
}

/**
 * Get cached results
 */
async function getCachedResults(
  params: SpoonacularSearchParams
): Promise<SpoonacularSearchResponse | null> {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(params));
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log("✅ Using cached results");
        return data;
      }
      await AsyncStorage.removeItem(getCacheKey(params));
    }
  } catch (error) {
    console.error("Cache read error:", error);
  }
  return null;
}

/**
 * Cache results
 */
async function cacheResults(
  params: SpoonacularSearchParams,
  results: SpoonacularSearchResponse
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      getCacheKey(params),
      JSON.stringify({ data: results, timestamp: Date.now() })
    );
    console.log("💾 Cached results");
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

/**
 * Generic Spoonacular API fetch
 */
async function spoonacularFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (!SPOONACULAR_API_KEY) {
    throw new Error("Spoonacular API key not configured");
  }

  const searchParams = new URLSearchParams({
    apiKey: SPOONACULAR_API_KEY,
    ...params,
  });

  const url = `${BASE_URL}${endpoint}?${searchParams}`;
  console.log(`🔍 Fetching: ${endpoint}`);

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Spoonacular API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

/**
 * ENHANCED: Search recipes with progressive relaxation
 */
export async function searchRecipes(
  params: SpoonacularSearchParams
): Promise<SpoonacularSearchResponse> {
  console.log("🔍 Searching recipes with params:", params);

  // Try cache first
  const cached = await getCachedResults(params);
  if (cached) return cached;

  // Convert to API params
  const apiParams: Record<string, string> = {
    number: String(params.number || 20),
    offset: String(params.offset || 0),
  };

  if (params.query) apiParams.query = params.query;
  if (params.cuisine) apiParams.cuisine = params.cuisine;
  if (params.diet) apiParams.diet = params.diet;
  if (params.intolerances) apiParams.intolerances = params.intolerances;
  if (params.excludeIngredients)
    apiParams.excludeIngredients = params.excludeIngredients;
  if (params.type) apiParams.type = params.type;

  // FIX: Ensure maxReadyTime is a number string
  if (params.maxReadyTime && !isNaN(Number(params.maxReadyTime))) {
    apiParams.maxReadyTime = String(params.maxReadyTime);
  }

  if (params.sort) apiParams.sort = params.sort;
  if (params.addRecipeInformation) apiParams.addRecipeInformation = "true";
  if (params.fillIngredients) apiParams.fillIngredients = "true";

  // Nutritional params
  if (params.maxCalories) apiParams.maxCalories = String(params.maxCalories);
  if (params.minProtein) apiParams.minProtein = String(params.minProtein);
  if (params.maxCarbs) apiParams.maxCarbs = String(params.maxCarbs);

  try {
    // Strategy 1: Try full search
    console.log("📊 Strategy 1: Full search");
    let results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      apiParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "full" } as any;
    }

    // Strategy 2: Remove nutritional constraints
    console.log("📊 Strategy 2: Remove nutrition filters");
    delete apiParams.maxCalories;
    delete apiParams.minProtein;
    delete apiParams.maxCarbs;

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      apiParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "no-nutrition" } as any;
    }

    // Strategy 3: Remove cuisine constraint
    console.log("📊 Strategy 3: Remove cuisine filter");
    delete apiParams.cuisine;

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      apiParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "no-cuisine" } as any;
    }

    // Strategy 4: Remove time constraint
    console.log("📊 Strategy 4: Remove time filter");
    delete apiParams.maxReadyTime;

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      apiParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "no-time" } as any;
    }

    // Strategy 5: Broadest search (keep only critical filters)
    console.log("📊 Strategy 5: Critical filters only");
    const criticalParams: Record<string, string> = {
      number: apiParams.number,
      offset: apiParams.offset,
      sort: "popularity",
      addRecipeInformation: "true",
    };

    // Keep CRITICAL filters
    if (apiParams.intolerances)
      criticalParams.intolerances = apiParams.intolerances;
    if (apiParams.excludeIngredients)
      criticalParams.excludeIngredients = apiParams.excludeIngredients;
    if (apiParams.diet) criticalParams.diet = apiParams.diet;

    // Simple query
    if (apiParams.query) {
      const words = apiParams.query.split(" ");
      criticalParams.query = words.slice(0, 2).join(" ") || "recipes";
    } else {
      criticalParams.query = "popular recipes";
    }

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      criticalParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "broad" } as any;
    }

    // Strategy 6: Ultimate Fallback I - Remove Query, Keep all Filters + Random Sort
    console.log("📊 Strategy 6: Remove query completely, keep all filters");
    const noQueryParams: Record<string, string> = {
      number: apiParams.number,
      addRecipeInformation: "true",
      sort: "random",
    };
    if (apiParams.diet) noQueryParams.diet = apiParams.diet;
    if (apiParams.intolerances)
      noQueryParams.intolerances = apiParams.intolerances;
    if (apiParams.excludeIngredients)
      noQueryParams.excludeIngredients = apiParams.excludeIngredients;

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      noQueryParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "no-query-random" } as any;
    }

    // Strategy 7: Ultimate Fallback II - Remove Diet, Keep Safety (Allergies) only
    console.log("📊 Strategy 7: Safety only (Allergies only), Popular sort");
    const safetyParams: Record<string, string> = {
      number: apiParams.number,
      addRecipeInformation: "true",
      sort: "popularity",
    };
    // CRITICAL: We MUST keep intolerances to prevent allergic reactions
    if (apiParams.intolerances)
      safetyParams.intolerances = apiParams.intolerances;

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      safetyParams
    );

    if (results.results.length > 0) {
      await cacheResults(params, results);
      return { ...results, searchStrategy: "safety-only" } as any;
    }

    // Strategy 8: Absolute Last Resort (Everything removed)
    // Only reachable if even "popular recipes without peanuts" returns 0.
    console.log("📊 Strategy 8: Absolute Fallback (Random Popular)");
    const absoluteParams: Record<string, string> = {
      number: apiParams.number,
      addRecipeInformation: "true",
      sort: "random",
    };

    results = await spoonacularFetch<SpoonacularSearchResponse>(
      "/recipes/complexSearch",
      absoluteParams
    );

    await cacheResults(params, results);
    return { ...results, searchStrategy: "absolute-fallback" } as any;
  } catch (error) {
    console.error("❌ Search error:", error);
    throw error;
  }
}

/**
 * Get recipe details
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
 * Get recipe nutrition
 */
export async function getRecipeNutrition(
  recipeId: number
): Promise<NutritionInfo> {
  return spoonacularFetch<NutritionInfo>(
    `/recipes/${recipeId}/nutritionWidget.json`,
    {}
  );
}

/**
 * Get similar recipes
 */
export async function getSimilarRecipes(
  recipeId: number,
  numberOfResults: number = 5
): Promise<SpoonacularRecipeSearchResult[]> {
  return spoonacularFetch<SpoonacularRecipeSearchResult[]>(
    `/recipes/${recipeId}/similar`,
    { number: String(numberOfResults) }
  );
}

/**
 * Get random recipes
 */
export async function getRandomRecipes(
  numberOfResults: number = 10,
  tags?: string[]
): Promise<{ recipes: SpoonacularRecipe[] }> {
  const params: Record<string, string> = {
    number: String(numberOfResults),
  };

  if (tags && tags.length > 0) {
    params.tags = tags.join(",");
  }

  return spoonacularFetch<{ recipes: SpoonacularRecipe[] }>(
    "/recipes/random",
    params
  );
}

/**
 * Search by ingredients
 */
export async function searchByIngredients(
  ingredients: string[],
  numberOfResults: number = 10
): Promise<any[]> {
  const simplified = ingredients.map(simplifyIngredient).slice(0, 2);

  return spoonacularFetch<any[]>("/recipes/findByIngredients", {
    ingredients: simplified.join(","),
    number: String(numberOfResults),
    ranking: "1",
    ignorePantry: "true",
  });
}

/**
 * Get recipes by category
 */
export async function getRecipesByCategory(
  category: string,
  numberOfResults: number = 20
): Promise<SpoonacularSearchResponse> {
  return searchRecipes({
    query: category,
    number: numberOfResults,
    addRecipeInformation: true,
    sort: "popularity",
  });
}

/**
 * Autocomplete recipe search
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
 * Parse ingredients
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
 * ENHANCED: Convert enhanced Groq response to Spoonacular params
 */
export function groqToSpoonacularParams(
  groqResponse: RecipeAnalysisResponse,
  options?: { offset?: number; forceRandom?: boolean }
): SpoonacularSearchParams {
  console.log("🔄 Converting enhanced Groq response to Spoonacular params");

  const params: SpoonacularSearchParams = {
    number: 20,
    addRecipeInformation: true,
    offset: options?.offset || 0,
  };

  // Smart sort strategy
  if (options?.forceRandom) {
    params.sort = "random";
  } else {
    // Determine sort based on meal goals and context
    // Safe access with optional chaining and defaults
    const goals = groqResponse.appliedFilters?.medium?.mealGoals || [];
    const timePreference =
      groqResponse.extractedKeyPoints?.timePreference?.preference;

    if (goals.includes("Weight Loss") || goals.includes("Balanced Diet")) {
      params.sort = "healthiness";
    } else if (goals.includes("Quick Meals") || timePreference === "quick") {
      params.sort = "time";
    } else if (groqResponse.extractedKeyPoints?.cuisine?.requested) {
      params.sort = "meta-score";
    } else {
      params.sort = "popularity";
    }
  }

  // Natural language query
  if (groqResponse.spoonacularParams?.query) {
    params.query = groqResponse.spoonacularParams.query;
  }

  // Cuisine - use first cuisine from analysis
  if (groqResponse.spoonacularParams?.cuisines?.length > 0) {
    params.cuisine = groqResponse.spoonacularParams.cuisines[0];
  }

  // PRIMARY INGREDIENTS - Add to query for better results
  // SAFE ACCESS: Check if extractedKeyPoints, primaryIngredients, and items exist
  const primaryIngredients =
    groqResponse.extractedKeyPoints?.primaryIngredients?.items || [];

  if (primaryIngredients.length > 0) {
    const simplified = primaryIngredients.map(simplifyIngredient).slice(0, 2);
    params.includeIngredients = simplified.join(",");
  }

  // CRITICAL: Diets (from HIGH priority)
  // SAFE ACCESS: Check appliedFilters, high, and diets
  const highPriorityDiets = groqResponse.appliedFilters?.high?.diets || [];

  if (highPriorityDiets.length > 0) {
    const dietMap: Record<string, string> = {
      vegetarian: "vegetarian",
      vegan: "vegan",
      keto: "ketogenic",
      paleo: "paleo",
      glutenFree: "gluten free",
      dairyFree: "dairy free",
      lowCarb: "ketogenic",
      highProtein: "primal",
    };
    const diet = highPriorityDiets[0];
    params.diet = dietMap[diet] || diet;
  }

  // CRITICAL: Intolerances (from CRITICAL priority)
  // SAFE ACCESS
  const criticalIntolerances =
    groqResponse.appliedFilters?.critical?.intolerances || [];
  if (criticalIntolerances.length > 0) {
    params.intolerances = criticalIntolerances.join(",");
  }

  // CRITICAL: Allergies (from CRITICAL priority)
  // SAFE ACCESS
  const criticalAllergies =
    groqResponse.appliedFilters?.critical?.allergies || [];
  if (criticalAllergies.length > 0) {
    const allergyMap: Record<string, string> = {
      peanuts: "peanut",
      treeNuts: "tree nut",
      eggs: "egg",
      soy: "soy",
      shellfish: "shellfish",
      wheat: "wheat",
      lactose: "dairy",
    };
    const allergies = criticalAllergies
      .map((a) => allergyMap[a] || a)
      .join(",");
    if (params.intolerances) {
      params.intolerances += "," + allergies;
    } else {
      params.intolerances = allergies;
    }
  }

  // HIGH: Exclude ingredients
  // SAFE ACCESS
  const excludeIngredients =
    groqResponse.appliedFilters?.high?.excludeIngredients || [];
  if (excludeIngredients.length > 0) {
    params.excludeIngredients = excludeIngredients.join(",");
  }

  // Meal type
  if (groqResponse.extractedKeyPoints?.mealType?.type) {
    params.type = groqResponse.extractedKeyPoints.mealType.type;
  }

  // Cooking time (FIXED: Handle text values from AI)
  // SAFE ACCESS
  const maxTime = groqResponse.extractedKeyPoints?.timePreference?.max;
  if (maxTime) {
    if (typeof maxTime === "number") {
      params.maxReadyTime = maxTime;
    } else if (typeof maxTime === "string") {
      // Handle hallucinated strings
      const lower = String(maxTime).toLowerCase();
      if (lower.includes("quick")) params.maxReadyTime = 30;
      else if (lower.includes("moderate")) params.maxReadyTime = 60;
      else if (lower.includes("elaborate")) params.maxReadyTime = 120;
      else {
        const parsed = parseInt(String(maxTime));
        if (!isNaN(parsed)) params.maxReadyTime = parsed;
      }
    }
  } else if (
    groqResponse.extractedKeyPoints?.timePreference?.preference === "quick"
  ) {
    params.maxReadyTime = 30;
  }

  // Nutritional targets (only if specified)
  if (groqResponse.spoonacularParams?.nutritionalTargets) {
    const targets = groqResponse.spoonacularParams.nutritionalTargets;
    if (targets.maxCalories) params.maxCalories = targets.maxCalories;
    if (targets.minProtein) params.minProtein = targets.minProtein;
    if (targets.maxCarbs) params.maxCarbs = targets.maxCarbs;
  }

  console.log("✅ Converted params:", params);

  return params;
}

/**
 * Clear cache
 */
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`🗑️ Cleared ${cacheKeys.length} cached items`);
  } catch (error) {
    console.error("Cache clear error:", error);
  }
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
  clearCache,
};
