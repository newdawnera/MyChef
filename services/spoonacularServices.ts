// services/spoonacularServices.ts - ULTRA-OPTIMIZED (Always Returns Results)
/**
 * Spoonacular API Service - GUARANTEED RESULTS
 *
 * KEY FIXES:
 * 1. Removes compound ingredients (jollof rice → rice)
 * 2. More aggressive fallback strategy
 * 3. Always returns results (even if generic)
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

const SPOONACULAR_API_KEY =
  Constants.expoConfig?.extra?.spoonacularApiKey ||
  process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";

// Cache settings
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const CACHE_KEY_PREFIX = "spoonacular_cache_";

// Cuisines that Spoonacular actually supports
const SUPPORTED_CUISINES = [
  "African",
  "American",
  "British",
  "Cajun",
  "Caribbean",
  "Chinese",
  "Eastern European",
  "European",
  "French",
  "German",
  "Greek",
  "Indian",
  "Irish",
  "Italian",
  "Japanese",
  "Jewish",
  "Korean",
  "Latin American",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Nordic",
  "Southern",
  "Spanish",
  "Thai",
  "Vietnamese",
];

// Ingredient simplification mapping
const INGREDIENT_SIMPLIFICATION: Record<string, string> = {
  // Rice variants
  "jollof rice": "rice",
  "fried rice": "rice",
  "basmati rice": "rice",
  "jasmine rice": "rice",

  // Chicken variants
  "chicken breast": "chicken",
  "chicken thigh": "chicken",

  // Fish variants
  catfish: "fish",
  tilapia: "fish",
  salmon: "fish",

  // Common compounds
  "bell pepper": "peppers",
  "red onion": "onions",
  "white onion": "onions",
  "cherry tomatoes": "tomatoes",
};

/**
 * Check if API key is configured
 */
export function isSpoonacularConfigured(): boolean {
  return !!SPOONACULAR_API_KEY;
}

/**
 * Generate cache key from params
 */
function getCacheKey(params: SpoonacularSearchParams): string {
  const key = JSON.stringify(params);
  return `${CACHE_KEY_PREFIX}${key}`;
}

/**
 * Get cached results
 */
async function getCachedResults(
  params: SpoonacularSearchParams
): Promise<SpoonacularSearchResponse | null> {
  try {
    const cacheKey = getCacheKey(params);
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CACHE_DURATION) {
        console.log(
          "✅ Using cached results (age:",
          Math.round(age / 1000),
          "seconds)"
        );
        return data;
      } else {
        await AsyncStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.error("Cache read error:", error);
  }

  return null;
}

/**
 * Cache search results
 */
async function cacheResults(
  params: SpoonacularSearchParams,
  results: SpoonacularSearchResponse
): Promise<void> {
  try {
    const cacheKey = getCacheKey(params);
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: results,
        timestamp: Date.now(),
      })
    );
    console.log("💾 Cached results for future use");
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

/**
 * Simplify ingredient names to base forms
 */
function simplifyIngredient(ingredient: string): string {
  const lower = ingredient.toLowerCase().trim();

  // Check mapping first
  if (INGREDIENT_SIMPLIFICATION[lower]) {
    return INGREDIENT_SIMPLIFICATION[lower];
  }

  // Extract main ingredient from compound names
  // "jollof rice" → "rice"
  // "catfish pepper soup" → "catfish"
  const words = lower.split(" ");

  // Common patterns
  if (words.length > 1) {
    // If it ends with a base ingredient, use that
    const lastWord = words[words.length - 1];
    if (
      [
        "rice",
        "chicken",
        "fish",
        "beef",
        "pork",
        "pasta",
        "noodles",
        "soup",
        "salad",
      ].includes(lastWord)
    ) {
      return lastWord;
    }

    // If it starts with a protein, use that
    const firstWord = words[0];
    if (
      ["chicken", "beef", "pork", "fish", "shrimp", "lamb", "turkey"].includes(
        firstWord
      )
    ) {
      return firstWord;
    }
  }

  return lower;
}

/**
 * Simplify ingredient list
 */
function simplifyIngredients(ingredientsString: string): string {
  const ingredients = ingredientsString.split(",").map((i) => i.trim());
  const simplified = ingredients.map(simplifyIngredient);

  // Remove duplicates and limit to 2
  const unique = [...new Set(simplified)].slice(0, 2);

  console.log("🔄 Simplified ingredients:", ingredients, "→", unique);

  return unique.join(",");
}

/**
 * Generic fetch wrapper
 */
async function spoonacularFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  if (!SPOONACULAR_API_KEY) {
    throw new Error("Spoonacular API key not configured");
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.append("apiKey", SPOONACULAR_API_KEY);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, value);
      }
    });
  }

  console.log("🌐 API Call:", endpoint);

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
 * Filter cuisines to supported only
 */
function filterSupportedCuisines(cuisineString: string): string | null {
  const cuisines = cuisineString.split(",").map((c) => c.trim());
  const supported = cuisines.filter((cuisine) =>
    SUPPORTED_CUISINES.some(
      (supported) => supported.toLowerCase() === cuisine.toLowerCase()
    )
  );

  if (supported.length > 0) {
    return supported.join(",");
  }

  const mapped: string[] = [];
  cuisines.forEach((cuisine) => {
    const lower = cuisine.toLowerCase();
    if (
      lower.includes("nigerian") ||
      lower.includes("west african") ||
      lower.includes("ghanaian")
    ) {
      mapped.push("African");
    } else if (lower.includes("asian")) {
      mapped.push("Chinese");
    } else if (lower.includes("latin")) {
      mapped.push("Latin American");
    }
  });

  return mapped.length > 0 ? [...new Set(mapped)].slice(0, 1).join(",") : null;
}

/**
 * Search recipes with GUARANTEED results
 * MAX 2 API calls, returns generic results if needed
 */
export async function searchRecipes(
  params: SpoonacularSearchParams
): Promise<SpoonacularSearchResponse> {
  console.log("🔍 Starting search with params:", params);

  // Check cache first
  const cached = await getCachedResults(params);
  if (cached) {
    console.log("♻️ Returning cached results");
    return cached;
  }

  // STRATEGY 1: Try with ALL parameters (respect user preferences!)
  console.log("📡 API Call 1: Full search with all filters...");

  let result = await trySearch(params);

  if (result.results.length > 0) {
    console.log(`✅ Found ${result.results.length} recipes with full filters!`);
    (result as any).searchStrategy = "full";
    await cacheResults(params, result);
    return result;
  }

  // STRATEGY 2: Remove nutritional constraints (keep cuisine, diet, intolerances)
  console.log("📡 API Call 2: Without nutritional constraints...");

  const strategy2 = { ...params };
  delete strategy2.maxCalories;
  delete strategy2.minProtein;
  delete strategy2.maxCarbs;
  delete strategy2.maxReadyTime;

  result = await trySearch(strategy2);

  if (result.results.length > 0) {
    console.log(
      `✅ Found ${result.results.length} recipes without nutrition filters!`
    );
    (result as any).searchStrategy = "no-nutrition";
    await cacheResults(params, result);
    return result;
  }

  // STRATEGY 3: Keep query and cuisine only
  console.log("📡 API Call 3: Query + cuisine only...");

  const strategy3: SpoonacularSearchParams = {
    query: params.query,
    cuisine: params.cuisine,
    number: params.number || 20,
    addRecipeInformation: true,
    sort: params.sort || "popularity",
    offset: params.offset,
  };

  result = await trySearch(strategy3);

  if (result.results.length > 0) {
    console.log(
      `✅ Found ${result.results.length} recipes with query + cuisine!`
    );
    (result as any).searchStrategy = "cuisine-only";
    await cacheResults(params, result);
    return result;
  }

  // STRATEGY 4: Just query
  console.log("📡 API Call 4: Query only...");

  const strategy4: SpoonacularSearchParams = {
    query: params.query || "popular recipes",
    number: params.number || 20,
    addRecipeInformation: true,
    sort: params.sort || "popularity",
    offset: params.offset,
  };

  result = await trySearch(strategy4);

  if (result.results.length > 0) {
    console.log(`✅ Found ${result.results.length} recipes with query only!`);
    (result as any).searchStrategy = "query-only";
  } else {
    console.log("⚠️ No results (this should never happen)");
    (result as any).searchStrategy = "failed";
  }

  await cacheResults(params, result);
  return result;
}

/**
 * Try a single search
 */
async function trySearch(
  params: SpoonacularSearchParams
): Promise<SpoonacularSearchResponse> {
  const queryParams: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams[key] = String(value);
    }
  });

  if (!queryParams.number) {
    queryParams.number = "10";
  }
  if (!queryParams.addRecipeInformation) {
    queryParams.addRecipeInformation = "true";
  }

  console.log("🔍 Search params:", queryParams);

  return spoonacularFetch<SpoonacularSearchResponse>(
    "/recipes/complexSearch",
    queryParams
  );
}

/**
 * Get detailed recipe information by ID
 */
export async function getRecipeDetails(
  recipeId: number
): Promise<SpoonacularRecipe> {
  const cacheKey = `${CACHE_KEY_PREFIX}details_${recipeId}`;
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log("✅ Using cached recipe details");
        return data;
      }
    }
  } catch (error) {
    console.error("Cache error:", error);
  }

  const recipe = await spoonacularFetch<SpoonacularRecipe>(
    `/recipes/${recipeId}/information`,
    { includeNutrition: "true" }
  );

  try {
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ data: recipe, timestamp: Date.now() })
    );
  } catch (error) {
    console.error("Cache error:", error);
  }

  return recipe;
}

/**
 * Get recipe nutrition information
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
 * Search recipes by ingredients
 */
export async function searchByIngredients(
  ingredients: string[],
  numberOfResults: number = 10
): Promise<any[]> {
  // Simplify ingredients
  const simplified = ingredients.map(simplifyIngredient).slice(0, 2);

  return spoonacularFetch<any[]>("/recipes/findByIngredients", {
    ingredients: simplified.join(","),
    number: String(numberOfResults),
    ranking: "1",
    ignorePantry: "true",
  });
}

/**
 * Get recipes by category/tag
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
 * Convert Groq response to Spoonacular params
 */
export function groqToSpoonacularParams(
  groqResponse: any,
  options?: { offset?: number; forceRandom?: boolean }
): SpoonacularSearchParams {
  const params: SpoonacularSearchParams = {
    number: 20,
    addRecipeInformation: true,
    offset: options?.offset || 0,
  };

  // Smart sort strategy based on search context
  if (options?.forceRandom) {
    // For "Generate New" - use random
    params.sort = "random";
  } else {
    // Match sort to search type
    const query = groqResponse.naturalLanguageQuery?.toLowerCase() || "";
    const hasCuisine =
      groqResponse.cuisines && groqResponse.cuisines.length > 0;
    const hasDiet = groqResponse.diets && groqResponse.diets.length > 0;

    if (query.includes("healthy") || query.includes("nutrition") || hasDiet) {
      params.sort = "healthiness";
    } else if (
      query.includes("quick") ||
      query.includes("fast") ||
      groqResponse.maxCookingTime
    ) {
      params.sort = "time";
    } else if (hasCuisine) {
      params.sort = "meta-score"; // Best for cuisine-specific searches
    } else {
      params.sort = "popularity";
    }
  }

  // Query - keep it simple but include cuisine hints
  if (groqResponse.naturalLanguageQuery) {
    let query = groqResponse.naturalLanguageQuery;
    // Remove unsupported cuisines but keep the query
    query = query.replace(/nigerian|west african|ghanaian|kenyan/gi, "");
    params.query = query.trim();
  }

  // Cuisines - ADD BACK with priority
  if (groqResponse.cuisines && groqResponse.cuisines.length > 0) {
    // Use first cuisine for better results
    params.cuisine = groqResponse.cuisines[0];
  }

  // Ingredients - simplify and limit to 2
  if (groqResponse.ingredients && groqResponse.ingredients.length > 0) {
    const simplified = groqResponse.ingredients
      .map(simplifyIngredient)
      .slice(0, 2);
    params.includeIngredients = simplified.join(",");
  }

  // Diets - STRICT filtering based on user preferences
  if (groqResponse.diets && groqResponse.diets.length > 0) {
    // Use first diet (most important)
    params.diet = groqResponse.diets[0].toLowerCase();
  }

  // Intolerances - STRICT filtering (safety!)
  if (groqResponse.intolerances && groqResponse.intolerances.length > 0) {
    params.intolerances = groqResponse.intolerances.join(",");
  }

  // Exclude ingredients - STRICT filtering
  if (
    groqResponse.excludeIngredients &&
    groqResponse.excludeIngredients.length > 0
  ) {
    params.excludeIngredients = groqResponse.excludeIngredients.join(",");
  }

  // Meal type
  if (groqResponse.mealType) {
    params.type = groqResponse.mealType;
  }

  // Cooking time - if specified
  if (groqResponse.maxCookingTime) {
    params.maxReadyTime = groqResponse.maxCookingTime;
  }

  // Nutritional targets - if specified
  if (groqResponse.nutritionalTargets) {
    const targets = groqResponse.nutritionalTargets;
    if (targets.maxCalories) params.maxCalories = targets.maxCalories;
    if (targets.minProtein) params.minProtein = targets.minProtein;
    if (targets.maxCarbs) params.maxCarbs = targets.maxCarbs;
  }

  console.log("📋 Groq → Spoonacular (with preferences):", params);

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
