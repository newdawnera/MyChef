// services/groqServices.ts - ENHANCED WITH STRICT API TYPING
/**
 * Groq AI Service - INTELLIGENT SPEECH ANALYSIS
 *
 * NEW FEATURES:
 * 1. Priority-based preference ranking (Critical > High > Medium > Low)
 * 2. Detailed key point extraction and labeling
 * 3. Conflict resolution between speech and preferences
 * 4. Smart meal goal mapping
 * 5. Confidence scoring for each category
 * 6. Progressive fallback strategy
 * 7. STRICT TYPE ENFORCEMENT for API parameters
 */

import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import { UserPreferences } from "@/types/preferences";

const GROQ_API_KEY =
  Constants.expoConfig?.extra?.groqApiKey ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Models
const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// Supported cuisines
const SPOONACULAR_CUISINES = [
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

// Meal goal mappings
const MEAL_GOAL_MAPPINGS = {
  "Weight Loss": {
    maxCalories: 500,
    sortBy: "healthiness",
    preferredDiets: ["low-carb", "ketogenic"],
    keywords: ["light", "healthy", "low-calorie"],
  },
  "Muscle Gain": {
    minProtein: 30,
    preferredIngredients: ["chicken", "fish", "eggs", "beans", "tofu"],
    keywords: ["high-protein", "protein-rich", "muscle building"],
  },
  "Quick Meals": {
    maxCookingTime: 30,
    sortBy: "time",
    keywords: ["quick", "fast", "easy", "simple"],
  },
  "Budget Cooking": {
    sortBy: "price",
    avoidExpensiveIngredients: ["saffron", "truffle", "caviar", "wagyu"],
    keywords: ["budget", "cheap", "affordable", "economical"],
  },
  "Balanced Diet": {
    sortBy: "healthiness",
    keywords: ["balanced", "nutritious", "wholesome", "healthy"],
  },
};

export function isGroqConfigured(): boolean {
  return !!GROQ_API_KEY;
}

/**
 * ENHANCED: Request interface with user preferences
 */
interface RecipeAnalysisRequest {
  searchText?: string;
  images?: string[];
  preferences?: UserPreferences;
}

/**
 * ENHANCED: Response with detailed key points and priority levels
 */
export interface RecipeAnalysisResponse {
  // Core search components
  naturalLanguageQuery: string;

  // Extracted key points with confidence
  extractedKeyPoints: {
    primaryIngredients: {
      items: string[];
      confidence: number;
      source: "speech" | "image" | "inferred";
    };
    supportingIngredients: {
      items: string[];
      confidence: number;
    };
    cuisine: {
      requested: string | null;
      alternatives: string[];
      confidence: number;
    };
    mealType: {
      type: "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | null;
      confidence: number;
    };
    cookingMethod: {
      method: string | null;
      confidence: number;
    };
    timePreference: {
      max: number | null;
      preference: "quick" | "moderate" | "elaborate" | null;
      confidence: number;
    };
    healthIntent: {
      goal: string | null;
      specific: string[];
      confidence: number;
    };
  };

  // Applied filters with priority levels
  appliedFilters: {
    critical: {
      allergies: string[];
      intolerances: string[];
    };
    high: {
      diets: string[];
      excludeIngredients: string[];
    };
    medium: {
      preferredCuisines: string[];
      mealGoals: string[];
    };
    low: {
      skillLevel: string | null;
      servingSize: number | null;
    };
  };

  // Spoonacular parameters
  spoonacularParams: {
    query: string;
    cuisines: string[];
    diets: string[];
    intolerances: string[];
    excludeIngredients: string[];
    mealType?: string;
    maxCookingTime?: number;
    nutritionalTargets?: {
      maxCalories?: number;
      minProtein?: number;
      maxCarbs?: number;
    };
  };

  // Conflict resolution
  conflicts: {
    hasConflicts: boolean;
    resolved: Array<{
      type: "diet" | "ingredient" | "cuisine";
      userRequest: string;
      userPreference: string;
      resolution: string;
      action: "override" | "substitute" | "combine";
    }>;
  };

  // Overall confidence and explanation
  confidence: number;
  explanation: string;

  // Search strategy recommendation
  searchStrategy: {
    primary: "exact" | "flexible" | "broad";
    fallbackSteps: string[];
  };
}

/**
 * Process image for API
 */
const processImageForApi = async (image: string): Promise<string> => {
  console.log(`🖼️ Processing image: ${image.substring(0, 50)}...`);

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  if (
    image.startsWith("file://") ||
    image.startsWith("content://") ||
    image.startsWith("/") ||
    image.startsWith("ph://")
  ) {
    try {
      const fileUri = image.startsWith("file://") ? image : `file://${image}`;
      const file = new FileSystem.File(fileUri);
      const base64 = await file.base64();
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("❌ Failed to convert image:", error);
      return "";
    }
  }

  if (image.startsWith("data:image")) {
    return image;
  }

  return `data:image/jpeg;base64,${image}`;
};

/**
 * MAIN: Analyze recipe request with enhanced intelligence
 */
export async function analyzeRecipeRequest(
  request: RecipeAnalysisRequest
): Promise<RecipeAnalysisResponse> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  console.log("📊 Starting enhanced recipe analysis...");

  const { searchText, images, preferences } = request;

  // Build enhanced prompts
  const systemPrompt = buildEnhancedSystemPrompt(preferences);
  const userPrompt = buildEnhancedUserPrompt(searchText, preferences);

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // Add images if provided
  let hasImages = false;
  if (images && images.length > 0) {
    const processedImages = await Promise.all(
      images.slice(0, 3).map((img) => processImageForApi(img))
    );

    const validImages = processedImages.filter((img) => img && img.length > 0);

    if (validImages.length > 0) {
      hasImages = true;
      const imageMessages = validImages.map((imgUrl) => ({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imgUrl } },
          {
            type: "text",
            text: "Analyze: Identify ingredients with quantities/states, detect equipment, suggest dishes.",
          },
        ],
      }));
      messages.push(...imageMessages);
    }
  }

  try {
    const modelToUse = hasImages ? VISION_MODEL : TEXT_MODEL;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown" }));
      throw new Error(`Groq API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return parseEnhancedGroqResponse(content, preferences);
  } catch (error) {
    console.error("❌ Groq analysis error:", error);
    throw error;
  }
}

/**
 * Build enhanced system prompt with STRICT TYPES
 */
function buildEnhancedSystemPrompt(preferences?: UserPreferences): string {
  const goalMappings = preferences?.selectedGoals
    ?.map((goal) => {
      const mapping =
        MEAL_GOAL_MAPPINGS[goal as keyof typeof MEAL_GOAL_MAPPINGS];
      return mapping ? `${goal}: ${JSON.stringify(mapping)}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `You are an intelligent recipe AI with PRIORITY-BASED ANALYSIS.

🎯 PRIORITY LEVELS:
1. CRITICAL: Allergies/intolerances (NEVER compromise)
2. HIGH: Diets/avoid ingredients (strongly prioritize)
3. MEDIUM: Cuisine/goals (flexible guidance)
4. LOW: Skill/servings (helpful context)

⚙️ API DATA TYPE CONSTRAINTS (CRITICAL):
- maxCookingTime: MUST be an INTEGER (minutes). Example: 30. NEVER use strings like "quick".
- nutritionalTargets: Values (calories, protein) must be INTEGERS.
- mealType: String from specific list ONLY: [main course, side dish, dessert, appetizer, salad, bread, breakfast, soup, beverage, sauce, marinade, fingerfood, snack, drink].
- diets: Lowercase strings (e.g. "vegetarian").
- intolerances: Comma-separated strings.

📊 EXTRACT KEY POINTS:
- Ingredients: PRIMARY vs SUPPORTING
- Cuisine: Requested + alternatives
- Meal Type: See list above
- Cooking Method: grilled/baked/fried/etc
- Time: quick/moderate/elaborate
- Health Intent: healthy/indulgent/comfort/etc
- Nutrition: ONLY if EXACT numbers given

⚠️ CONFLICT RESOLUTION:
- CRITICAL: Always use preference
- HIGH: Suggest alternative
- MEDIUM: Allow override

🔍 CUISINES: ${SPOONACULAR_CUISINES.join(", ")}

🎯 GOALS: ${goalMappings || "None"}

📝 RESPONSE (JSON ONLY):
{
  "naturalLanguageQuery": "simple terms",
  "extractedKeyPoints": {
    "primaryIngredients": {"items": [], "confidence": 0.9, "source": "speech"},
    "supportingIngredients": {"items": [], "confidence": 0.7},
    "cuisine": {"requested": null, "alternatives": [], "confidence": 0},
    "mealType": {"type": null, "confidence": 0},
    "cookingMethod": {"method": null, "confidence": 0},
    "timePreference": {"max": null, "preference": null, "confidence": 0},
    "healthIntent": {"goal": null, "specific": [], "confidence": 0}
  },
  "appliedFilters": {
    "critical": {"allergies": [], "intolerances": []},
    "high": {"diets": [], "excludeIngredients": []},
    "medium": {"preferredCuisines": [], "mealGoals": []},
    "low": {"skillLevel": null, "servingSize": null}
  },
  "spoonacularParams": {
    "query": "",
    "cuisines": [],
    "diets": [],
    "intolerances": [],
    "excludeIngredients": [],
    "mealType": "",
    "maxCookingTime": null,
    "nutritionalTargets": {}
  },
  "conflicts": {"hasConflicts": false, "resolved": []},
  "confidence": 0.85,
  "explanation": "",
  "searchStrategy": {"primary": "exact", "fallbackSteps": []}
}

USER PREFERENCES: ${
    preferences ? JSON.stringify(preferences, null, 2) : "None"
  }`;
}

/**
 * Build user prompt
 */
function buildEnhancedUserPrompt(
  searchText?: string,
  preferences?: UserPreferences
): string {
  let prompt = "Analyze with DETAILED KEY POINTS:\n\n";

  if (searchText) {
    prompt += `🗣️ USER: "${searchText}"\n\n`;
  }

  if (preferences) {
    prompt += `📋 PREFERENCES:\n`;
    if (preferences.selectedAllergies?.length) {
      prompt += `🚨 CRITICAL - Allergies: ${preferences.selectedAllergies.join(
        ", "
      )}\n`;
    }
    if (preferences.selectedDiets?.length) {
      prompt += `⭐ HIGH - Diets: ${preferences.selectedDiets.join(", ")}\n`;
    }
    if (preferences.avoidIngredients?.length) {
      prompt += `⭐ HIGH - Avoid: ${preferences.avoidIngredients.join(", ")}\n`;
    }
    if (preferences.selectedCuisines?.length) {
      prompt += `🎯 MEDIUM - Prefers: ${preferences.selectedCuisines.join(
        ", "
      )}\n`;
    }
    if (preferences.selectedGoals?.length) {
      prompt += `🎯 MEDIUM - Goals: ${preferences.selectedGoals.join(", ")}\n`;
    }
  }

  prompt += `\n✅ RETURN ONLY JSON (no markdown).`;

  return prompt;
}

/**
 * Parse response
 */
function parseEnhancedGroqResponse(
  content: string,
  preferences?: UserPreferences
): RecipeAnalysisResponse {
  try {
    let cleaned = content.trim();

    // Find the first '{' and the last '}' to extract the JSON object
    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1) {
      cleaned = cleaned.substring(startIndex, endIndex + 1);
    }

    const parsed = JSON.parse(cleaned);

    return {
      naturalLanguageQuery: parsed.naturalLanguageQuery || "popular recipes",
      extractedKeyPoints: parsed.extractedKeyPoints || getDefaultKeyPoints(),
      appliedFilters: parsed.appliedFilters || getDefaultFilters(preferences),
      spoonacularParams: parsed.spoonacularParams || {
        query: "",
        cuisines: [],
        diets: [],
        intolerances: [],
        excludeIngredients: [],
      },
      conflicts: parsed.conflicts || { hasConflicts: false, resolved: [] },
      confidence: parsed.confidence || 0.5,
      explanation: parsed.explanation || "Analysis complete",
      searchStrategy: parsed.searchStrategy || {
        primary: "flexible",
        fallbackSteps: ["broaden search"],
      },
    };
  } catch (error) {
    console.error("Parse error:", error);
    return createFallbackResponse(preferences);
  }
}

function getDefaultKeyPoints() {
  return {
    primaryIngredients: {
      items: [],
      confidence: 0,
      source: "inferred" as const,
    },
    supportingIngredients: { items: [], confidence: 0 },
    cuisine: { requested: null, alternatives: [], confidence: 0 },
    mealType: { type: null, confidence: 0 },
    cookingMethod: { method: null, confidence: 0 },
    timePreference: { max: null, preference: null, confidence: 0 },
    healthIntent: { goal: null, specific: [], confidence: 0 },
  };
}

function getDefaultFilters(preferences?: UserPreferences) {
  return {
    critical: {
      allergies: preferences?.selectedAllergies || [],
      intolerances: [],
    },
    high: {
      diets: preferences?.selectedDiets || [],
      excludeIngredients: preferences?.avoidIngredients || [],
    },
    medium: {
      preferredCuisines: preferences?.selectedCuisines || [],
      mealGoals: preferences?.selectedGoals || [],
    },
    low: {
      skillLevel: preferences?.skillLevel || null,
      servingSize: preferences?.servingSize || null,
    },
  };
}

function createFallbackResponse(
  preferences?: UserPreferences
): RecipeAnalysisResponse {
  return {
    naturalLanguageQuery: "popular recipes",
    extractedKeyPoints: getDefaultKeyPoints(),
    appliedFilters: getDefaultFilters(preferences),
    spoonacularParams: {
      query: "popular recipes",
      cuisines: [],
      diets: [],
      intolerances: [],
      excludeIngredients: [],
    },
    conflicts: { hasConflicts: false, resolved: [] },
    confidence: 0.3,
    explanation: "Using fallback",
    searchStrategy: {
      primary: "broad",
      fallbackSteps: ["show popular"],
    },
  };
}

/**
 * Detect ingredients from images
 */
export async function detectIngredientsFromImages(images: string[]): Promise<{
  ingredients: Array<{
    name: string;
    quantity?: string;
    state?: string;
    confidence: number;
  }>;
  suggestedDishes: string[];
}> {
  if (!GROQ_API_KEY || !images?.length) {
    return { ingredients: [], suggestedDishes: [] };
  }

  const processedImages = await Promise.all(
    images.slice(0, 3).map((img) => processImageForApi(img))
  );

  const validImages = processedImages.filter((img) => img?.length > 0);

  if (!validImages.length) {
    return { ingredients: [], suggestedDishes: [] };
  }

  const messages = validImages.map((imgUrl) => ({
    role: "user",
    content: [
      { type: "image_url", image_url: { url: imgUrl } },
      {
        type: "text",
        text: `Return ONLY JSON:
{"ingredients": [{"name":"","quantity":"","state":"","confidence":0.9}], "suggestedDishes": []}`,
      },
    ],
  }));

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!response.ok) throw new Error("Failed to analyze");

    const data = await response.json();
    const content = data.choices[0].message.content;

    let cleaned = content
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("❌ Detection error:", error);
    return { ingredients: [], suggestedDishes: [] };
  }
}

export default {
  analyzeRecipeRequest,
  detectIngredientsFromImages,
  isGroqConfigured,
};
