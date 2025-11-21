// types/groq.ts
/**
 * Groq AI Type Definitions for Recipe Analysis
 *
 * Groq will analyze user input (text, images, preferences)
 * and return structured recipe search parameters
 */

import { UserPreferences } from "./preferences";

/**
 * Input to Groq AI for recipe analysis
 */
export interface GroqRecipeAnalysisRequest {
  // User's search text
  searchText: string;

  // Images of ingredients (base64 encoded or URLs)
  images?: string[];

  // User preferences
  preferences: UserPreferences;

  // Optional context
  context?: {
    timeOfDay?: "breakfast" | "lunch" | "dinner" | "snack";
    season?: "spring" | "summer" | "fall" | "winter";
    occasion?: string;
  };
}

/**
 * Groq AI response with recipe search parameters
 *
 * This will be converted to Spoonacular API parameters
 */
export interface GroqRecipeAnalysisResponse {
  // Detected or suggested ingredients from images/text
  ingredients: string[];

  // Cuisine suggestions
  cuisines?: string[];

  // Meal type (breakfast, lunch, dinner, etc.)
  mealType?: string;

  // Dietary filters (vegetarian, vegan, etc.)
  diets?: string[];

  // Intolerances to avoid
  intolerances?: string[];

  // Ingredients to exclude
  excludeIngredients?: string[];

  // Nutritional targets
  nutritionalTargets?: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
  };

  // Time constraint
  maxCookingTime?: number;

  // Natural language query for Spoonacular
  naturalLanguageQuery?: string;

  // Confidence score (0-1)
  confidence?: number;

  // Explanation of analysis (for debugging/transparency)
  explanation?: string;
}

/**
 * Groq Vision API request for image analysis
 * Specifically for analyzing ingredient images
 */
export interface GroqVisionRequest {
  image: string; // base64 or URL
  prompt: string; // What to look for in the image
}

/**
 * Groq Vision API response
 */
export interface GroqVisionResponse {
  detectedIngredients: string[];
  description: string;
  confidence: number;
}

/**
 * Groq Chat API message format
 */
export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Groq Chat API request
 */
export interface GroqChatRequest {
  model: string; // e.g., 'mixtral-8x7b-32768'
  messages: GroqChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

/**
 * Groq Chat API response
 */
export interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: GroqChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * System prompt for Groq recipe analysis
 */
export const GROQ_RECIPE_ANALYSIS_SYSTEM_PROMPT = `You are a culinary AI assistant specializing in recipe recommendations.

Your task is to analyze:
1. User's search text
2. Detected ingredients from images (if provided)
3. User's dietary preferences and restrictions
4. User's cooking skill level and goals

Based on this information, you should:
1. Identify the main ingredients and suggest complementary ingredients
2. Determine the most suitable cuisine type
3. Respect all dietary restrictions and allergies
4. Consider the user's cooking skill level
5. Align with their meal goals (weight loss, muscle gain, etc.)

Respond with a JSON object containing:
- ingredients: Array of suggested main ingredients
- cuisines: Array of suitable cuisine types (max 2)
- mealType: Type of meal (breakfast, lunch, dinner, snack, dessert)
- diets: Array of applicable dietary labels
- excludeIngredients: Array of ingredients to avoid
- maxCookingTime: Maximum cooking time in minutes (based on skill level)
- naturalLanguageQuery: A refined search query for the recipe database
- confidence: Your confidence level (0-1)
- explanation: Brief explanation of your recommendations

Be concise, practical, and respectful of dietary restrictions. If the user's preferences conflict, prioritize safety (allergies) over preferences.`;

/**
 * Helper: Format user input for Groq
 */
export function formatGroqRecipePrompt(
  request: GroqRecipeAnalysisRequest
): string {
  const parts: string[] = [];

  // Search text
  if (request.searchText) {
    parts.push(`User wants to cook: "${request.searchText}"`);
  }

  // Detected ingredients from images
  if (request.images && request.images.length > 0) {
    parts.push(
      `\nDetected ingredients from ${request.images.length} image(s). Please analyze them.`
    );
  }

  // Preferences
  const prefs = request.preferences;
  if (prefs.selectedDiets.length > 0) {
    parts.push(`\nDietary preferences: ${prefs.selectedDiets.join(", ")}`);
  }
  if (prefs.selectedAllergies.length > 0) {
    parts.push(
      `\nAllergies/Restrictions: ${prefs.selectedAllergies.join(
        ", "
      )} - MUST AVOID`
    );
  }
  if (prefs.selectedCuisines.length > 0) {
    parts.push(`\nPreferred cuisines: ${prefs.selectedCuisines.join(", ")}`);
  }
  if (prefs.avoidIngredients.length > 0) {
    parts.push(`\nIngredients to avoid: ${prefs.avoidIngredients.join(", ")}`);
  }
  parts.push(`\nCooking skill level: ${prefs.skillLevel}`);
  if (prefs.selectedGoals.length > 0) {
    parts.push(`\nMeal goals: ${prefs.selectedGoals.join(", ")}`);
  }
  parts.push(`\nDefault serving size: ${prefs.servingSize} people`);

  // Context
  if (request.context) {
    if (request.context.timeOfDay) {
      parts.push(`\nTime of day: ${request.context.timeOfDay}`);
    }
    if (request.context.season) {
      parts.push(`\nSeason: ${request.context.season}`);
    }
  }

  parts.push("\n\nPlease provide recipe recommendations in JSON format.");

  return parts.join("\n");
}

/**
 * Helper: Parse Groq response
 * Groq sometimes returns JSON in markdown code blocks
 */
export function parseGroqJsonResponse(response: string): any {
  try {
    // Try direct parse
    return JSON.parse(response);
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = response.match(/```json\n?(.*?)\n?```/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try extracting any JSON-like structure
    const jsonObjectMatch = response.match(/\{.*\}/s);
    if (jsonObjectMatch) {
      return JSON.parse(jsonObjectMatch[0]);
    }
    throw new Error("Could not parse Groq response as JSON");
  }
}
