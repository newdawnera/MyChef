// services/groqServices.ts - IMPROVED WITH SPOONACULAR AWARENESS
/**
 * Groq AI Service - Now aware of Spoonacular limitations
 *
 * Provides more flexible cuisine suggestions and better fallbacks
 */

import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";

const GROQ_API_KEY =
  Constants.expoConfig?.extra?.groqApiKey ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// The user-specified model to use for everything
const TEXT_MODEL = "llama-3.3-70b-versatile"; // Fast text model for text-only
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Llama 4 Scout - supports vision!

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
  images?: string[]; // Can be base64 OR file URIs now
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
 * HELPER: Process image for API
 * Returns a full data URI (data:image/...) OR a remote URL string
 */
const processImageForApi = async (image: string): Promise<string> => {
  console.log(`🖼️ Processing image: ${image.substring(0, 50)}...`);

  // 1. If it's already a remote URL (http/https), return as is
  if (image.startsWith("http://") || image.startsWith("https://")) {
    console.log("✅ Image is remote URL");
    return image;
  }

  // 2. If it looks like a local file, read it as Base64
  if (
    image.startsWith("file://") ||
    image.startsWith("content://") ||
    image.startsWith("/") ||
    image.startsWith("ph://") // iOS Photos Asset
  ) {
    try {
      console.log("📁 Reading local file as base64...");

      // NEW Expo FileSystem API (v54+)
      const fileUri = image.startsWith("file://") ? image : `file://${image}`;
      const file = new FileSystem.File(fileUri);
      const base64 = await file.base64();

      console.log(`✅ Converted to base64 (${base64.length} chars)`);
      // Return properly formatted data URI
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error("❌ Failed to convert image to base64:", error);
      // Fallback: If read fails, we can't send it. Return null or empty.
      // But returning original image will cause "unsupported protocol" error.
      // So we return empty string to be filtered out later.
      return "";
    }
  }

  // 3. If it's already a data URI, return as is
  if (image.startsWith("data:image")) {
    console.log("✅ Image is already data URI");
    return image;
  }

  // 4. Assume it's raw base64 string without header
  // We prepend the header to satisfy "invalid base64 url" error
  console.log("🔧 Adding data URI header to base64 string");
  return `data:image/jpeg;base64,${image}`;
};

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
  let hasImages = false;
  if (images && images.length > 0) {
    console.log(`🖼️ Processing ${images.length} images...`);

    // Process all images to get valid URLs or Data URIs
    const processedImages = await Promise.all(
      images.slice(0, 3).map((img) => processImageForApi(img))
    );

    // Filter out any empty strings from failed conversions
    const validImages = processedImages.filter((img) => img && img.length > 0);

    if (validImages.length > 0) {
      console.log(
        `✅ Successfully processed ${validImages.length} images for API.`
      );
      hasImages = true;

      const imageMessages = validImages.map((imgUrl) => ({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: imgUrl,
            },
          },
          {
            type: "text",
            text: "Identify the ingredients visible in this image.",
          },
        ],
      }));
      messages.push(...imageMessages);
    } else {
      console.warn(
        "⚠️ No valid images found after processing. Proceeding with text only."
      );
    }
  }

  try {
    console.log("🤖 Calling Groq AI...");

    // Use vision model if images present, text model otherwise
    const modelToUse = hasImages ? VISION_MODEL : TEXT_MODEL;
    console.log(`📦 Using model: ${modelToUse}`);

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

    // Parse the JSON response
    const analysis = parseGroqResponse(content);

    console.log("✅ Groq analysis parsed successfully");

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

CRITICAL - NUTRITIONAL TARGETS (READ THIS CAREFULLY):
⚠️ DEFAULT BEHAVIOR: Leave nutritionalTargets as EMPTY OBJECT {}
⚠️ ONLY add values if user gives EXACT NUMBERS with units

DO NOT SET nutritionalTargets for:
❌ "low sugar" / "no sugar" / "less sugar"
❌ "low carb" / "no carb" / "keto-friendly"
❌ "high protein" / "lots of protein"
❌ "healthy" / "nutritious" / "balanced"
❌ "help me gain weight" / "help me lose weight"
❌ "light" / "heavy" / "filling"
❌ ANY vague health terms

ONLY SET nutritionalTargets when user says:
✅ "under 300 calories" → {"maxCalories": 300}
✅ "at least 25g protein" → {"minProtein": 25}
✅ "less than 40g carbs" → {"maxCarbs": 40}
✅ "300-400 calories" → {"maxCalories": 400}

For vague requests, use DESCRIPTIVE QUERY TERMS instead:
- "low sugar" → query: "desserts" (let search find options)
- "no carb" → query: "protein meals" or "meat dishes"
- "high protein" → query: "chicken fish beef"
- "healthy" → query: "nutritious balanced meals"
- "gain weight" → query: "hearty filling meals"

Response format (JSON only):
{
  "naturalLanguageQuery": "simple descriptive terms (NOT constraints)",
  "ingredients": [],
  "cuisines": [],
  "diets": [],
  "intolerances": [],
  "excludeIngredients": [],
  "mealType": "breakfast|lunch|dinner|snack|dessert",
  "maxCookingTime": 60,
  "nutritionalTargets": {},
  "confidence": 0.8,
  "explanation": "brief explanation"
}

REAL EXAMPLES:
Input: "something sugary, tasty, and no carb"
Output: {
  "naturalLanguageQuery": "sweet desserts",
  "cuisines": [],
  "diets": [],
  "nutritionalTargets": {},
  "explanation": "Sweet dessert options"
}

Input: "low sugar recipes to gain weight safely"
Output: {
  "naturalLanguageQuery": "high protein hearty meals",
  "cuisines": [],
  "diets": [],
  "nutritionalTargets": {},
  "explanation": "Protein-rich meals for healthy weight gain"
}

Input: "Italian pasta under 400 calories"
Output: {
  "naturalLanguageQuery": "Italian pasta",
  "cuisines": ["Italian"],
  "diets": [],
  "nutritionalTargets": {"maxCalories": 400},
  "explanation": "Italian pasta with calorie limit"
}

Input: "healthy chicken dinner"
Output: {
  "naturalLanguageQuery": "chicken dinner",
  "ingredients": ["chicken"],
  "cuisines": [],
  "diets": [],
  "nutritionalTargets": {},
  "explanation": "Chicken-based dinner recipes"
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

  // Process images to get valid URLs or Data URIs
  const processedImages = await Promise.all(
    images.slice(0, 3).map((img) => processImageForApi(img))
  );

  // Filter out invalid images
  const validImages = processedImages.filter((img) => img && img.length > 0);

  if (validImages.length === 0) {
    console.warn("⚠️ No valid images to analyze.");
    return [];
  }

  const messages = validImages.map((imgUrl) => ({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: imgUrl,
        },
      },
      {
        type: "text",
        text: 'List all food ingredients visible in this image. Return only a JSON array of ingredient names, like: ["ingredient1", "ingredient2"]',
      },
    ],
  }));

  try {
    console.log(`🔍 Using vision model: ${VISION_MODEL}`);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL, // Always use vision model for image detection
        messages,
        temperature: 0.5,
        max_tokens: 500,
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
