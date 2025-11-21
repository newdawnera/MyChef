// services/groqServices.ts - IMPROVED WITH SPOONACULAR AWARENESS
/**
 * Groq AI Service - Now aware of Spoonacular limitations
 *
 * Provides more flexible cuisine suggestions and better fallbacks
 */

import Constants from "expo-constants";

const GROQ_API_KEY =
  Constants.expoConfig?.extra?.groqApiKey ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Cuisines that Spoonacular actually supports
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

export function isGroqConfigured(): boolean {
  return !!GROQ_API_KEY;
}

interface RecipeAnalysisRequest {
  searchText?: string;
  images?: string[]; // base64 encoded images
  preferences?: any;
}

interface RecipeAnalysisResponse {
  naturalLanguageQuery: string;
  ingredients: string[];
  cuisines: string[];
  diets: string[];
  intolerances: string[];
  excludeIngredients: string[];
  mealType?: "breakfast" | "lunch" | "dinner" | "snack" | "dessert";
  maxCookingTime?: number;
  nutritionalTargets?: {
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
  };
  confidence: number;
  explanation: string;
}

/**
 * Main function: Analyze recipe request with AI
 */
export async function analyzeRecipeRequest(
  request: RecipeAnalysisRequest
): Promise<RecipeAnalysisResponse> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  console.log("📊 Analyzing recipe request...");

  const { searchText, images, preferences } = request;

  // Build the prompt
  const systemPrompt = buildSystemPrompt(preferences);
  const userPrompt = buildUserPrompt(searchText, preferences);

  // Prepare messages
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // Add images if provided
  if (images && images.length > 0) {
    console.log(`🖼️ Adding ${images.length} images to analysis`);
    const imageMessages = images.slice(0, 3).map((imageBase64) => ({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: "Identify the ingredients visible in this image.",
        },
      ],
    }));
    messages.push(...imageMessages);
  }

  try {
    console.log("🤖 Calling Groq AI...");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          images && images.length > 0
            ? "llama-3.2-90b-vision-preview"
            : "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(`Groq API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("✅ Groq analysis complete");
    console.log("📝 Raw response:", content);

    // Parse the JSON response
    const analysis = parseGroqResponse(content);

    console.log("✅ Groq analysis complete:", analysis);

    return analysis;
  } catch (error) {
    console.error("❌ Groq analysis error:", error);
    throw error;
  }
}

/**
 * Build system prompt with Spoonacular awareness
 */
function buildSystemPrompt(preferences: any): string {
  return `You are a recipe recommendation AI assistant that helps users find recipes.

IMPORTANT CONSTRAINTS:
1. You MUST respond with ONLY valid JSON - no markdown, no backticks, no explanations before or after
2. Cuisine options are LIMITED to: ${SPOONACULAR_CUISINES.join(", ")}
3. If user requests unsupported cuisine (e.g., Nigerian, Ghanaian), suggest:
   - Use "African" as the cuisine
   - Focus on the INGREDIENTS they mentioned (e.g., catfish, peppers)
   - Use descriptive terms in the query (e.g., "spicy fish soup")
4. Prioritize INGREDIENTS over cuisine when possible
5. Keep naturalLanguageQuery simple and flexible

Response format (JSON only):
{
  "naturalLanguageQuery": "short descriptive query",
  "ingredients": ["ingredient1", "ingredient2"],
  "cuisines": ["supported cuisine from the list above"],
  "diets": ["diet1"],
  "intolerances": [],
  "excludeIngredients": [],
  "mealType": "breakfast|lunch|dinner|snack|dessert",
  "maxCookingTime": 60,
  "nutritionalTargets": {
    "maxCalories": 500,
    "minProtein": 20,
    "maxCarbs": 50
  },
  "confidence": 0.8,
  "explanation": "brief explanation"
}

User preferences:
${preferences ? JSON.stringify(preferences, null, 2) : "None provided"}`;
}

/**
 * Build user prompt from search text and preferences
 */
function buildUserPrompt(searchText?: string, preferences?: any): string {
  let prompt =
    "Analyze this recipe request and provide recommendations in JSON format:\n\n";

  if (searchText) {
    prompt += `User query: "${searchText}"\n\n`;
  }

  if (preferences) {
    if (preferences.selectedDiets?.length > 0) {
      prompt += `Dietary preferences: ${preferences.selectedDiets.join(
        ", "
      )}\n`;
    }
    if (preferences.selectedAllergies?.length > 0) {
      prompt += `Allergies: ${preferences.selectedAllergies.join(", ")}\n`;
    }
    if (preferences.avoidIngredients?.length > 0) {
      prompt += `Avoid: ${preferences.avoidIngredients.join(", ")}\n`;
    }
    if (preferences.servingSize) {
      prompt += `Serving size: ${preferences.servingSize}\n`;
    }
  }

  prompt +=
    "\nIMPORTANT: Return ONLY valid JSON with no additional text. If the user requests an unsupported cuisine, suggest African cuisine and focus on ingredients.";

  return prompt;
}

/**
 * Parse Groq response (handles markdown wrapping)
 */
function parseGroqResponse(content: string): RecipeAnalysisResponse {
  try {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    cleaned = cleaned.replace(/```json\n?/g, "");
    cleaned = cleaned.replace(/```\n?/g, "");
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);

    // Validate required fields
    return {
      naturalLanguageQuery: parsed.naturalLanguageQuery || "popular recipes",
      ingredients: parsed.ingredients || [],
      cuisines: parsed.cuisines || [],
      diets: parsed.diets || [],
      intolerances: parsed.intolerances || [],
      excludeIngredients: parsed.excludeIngredients || [],
      mealType: parsed.mealType,
      maxCookingTime: parsed.maxCookingTime,
      nutritionalTargets: parsed.nutritionalTargets,
      confidence: parsed.confidence || 0.5,
      explanation: parsed.explanation || "Recipe recommendations generated",
    };
  } catch (error) {
    console.error("Failed to parse Groq response:", error);
    console.error("Raw content:", content);

    // Return a basic fallback
    return {
      naturalLanguageQuery: "popular recipes",
      ingredients: [],
      cuisines: [],
      diets: [],
      intolerances: [],
      excludeIngredients: [],
      confidence: 0.3,
      explanation: "Using fallback recommendations due to parsing error",
    };
  }
}

/**
 * Detect ingredients from images using vision model
 */
export async function detectIngredientsFromImages(
  images: string[]
): Promise<string[]> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  if (!images || images.length === 0) {
    return [];
  }

  console.log(`🖼️ Detecting ingredients from ${images.length} images...`);

  const messages = images.slice(0, 3).map((imageBase64) => ({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      },
      {
        type: "text",
        text: 'List all food ingredients visible in this image. Return only a JSON array of ingredient names, like: ["ingredient1", "ingredient2"]',
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
        model: "llama-3.2-90b-vision-preview",
        messages,
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to detect ingredients");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the response
    let cleaned = content.trim();
    cleaned = cleaned.replace(/```json\n?/g, "");
    cleaned = cleaned.replace(/```\n?/g, "");
    cleaned = cleaned.trim();

    const ingredients = JSON.parse(cleaned);
    console.log("✅ Detected ingredients:", ingredients);

    return Array.isArray(ingredients) ? ingredients : [];
  } catch (error) {
    console.error("❌ Ingredient detection error:", error);
    return [];
  }
}

export default {
  analyzeRecipeRequest,
  detectIngredientsFromImages,
  isGroqConfigured,
};
