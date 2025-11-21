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
  console.log("🔍 Starting search...");

  // Check cache first
  const cached = await getCachedResults(params);
  if (cached) {
    return cached;
  }

  // STRATEGY 1: Try with simplified ingredients only (no cuisine, no restrictions)
  console.log("📡 API Call 1: Simplified ingredients...");

  if (params.includeIngredients) {
    const simplified = simplifyIngredients(params.includeIngredients);

    const strategy1: SpoonacularSearchParams = {
      includeIngredients: simplified,
      number: 20,
      addRecipeInformation: true,
      sort: "popularity",
    };

    let result = await trySearch(strategy1);

    if (result.results.length > 0) {
      console.log(
        `✅ Found ${result.results.length} recipes with ingredients!`
      );
      await cacheResults(params, result);
      return result;
    }
  }

  // STRATEGY 2: Just basic query terms (guaranteed to return results)
  console.log("📡 API Call 2: Generic search...");

  // Extract main food terms from query
  const query = params.query || params.includeIngredients || "dinner";
  const mainTerms =
    query
      .toLowerCase()
      .split(" ")
      .filter((word) =>
        [
          "rice",
          "chicken",
          "fish",
          "beef",
          "pasta",
          "soup",
          "salad",
          "dinner",
          "lunch",
        ].includes(word)
      )
      .slice(0, 1)[0] || "dinner";

  const strategy2: SpoonacularSearchParams = {
    query: mainTerms,
    number: 20,
    addRecipeInformation: true,
    sort: "popularity",
  };

  let result = await trySearch(strategy2);

  if (result.results.length > 0) {
    console.log(`✅ Found ${result.results.length} generic recipes`);
  } else {
    console.log("⚠️ No results (this should never happen)");
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
  groqResponse: any
): SpoonacularSearchParams {
  const params: SpoonacularSearchParams = {
    number: 20,
    addRecipeInformation: true,
    sort: "popularity",
  };

  // Query - keep it simple
  if (groqResponse.naturalLanguageQuery) {
    let query = groqResponse.naturalLanguageQuery;
    query = query.replace(/nigerian|west african|ghanaian|kenyan/gi, "");
    params.query = query.trim();
  }

  // Ingredients - simplify and limit to 2
  if (groqResponse.ingredients && groqResponse.ingredients.length > 0) {
    const simplified = groqResponse.ingredients
      .map(simplifyIngredient)
      .slice(0, 2);
    params.includeIngredients = simplified.join(",");
  }

  // NO CUISINE (causes too many 0 results)
  // NO DIET (causes too many 0 results)
  // NO NUTRITIONAL TARGETS (causes too many 0 results)
  // NO TIME LIMITS (causes too many 0 results)

  console.log("📋 Groq → Spoonacular (ultra-simplified):", params);

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
