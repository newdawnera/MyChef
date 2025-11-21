// services/groqServices.ts
/**
 * Groq AI Service for Recipe Analysis
 *
 * Documentation: https://console.groq.com/docs
 *
 * IMPORTANT: Get your API key from https://console.groq.com/
 * Free tier: Generous limits
 */

import Constants from "expo-constants";
import {
  GroqRecipeAnalysisRequest,
  GroqRecipeAnalysisResponse,
  GroqChatRequest,
  GroqChatResponse,
  GROQ_RECIPE_ANALYSIS_SYSTEM_PROMPT,
  formatGroqRecipePrompt,
  parseGroqJsonResponse,
} from "@/types/groq";

const GROQ_API_KEY =
  Constants.expoConfig?.extra?.groqApiKey ||
  process.env.EXPO_PUBLIC_GROQ_API_KEY;
const BASE_URL = "https://api.groq.com/openai/v1";

// Recommended models
const MODELS = {
  FAST: "llama-3.3-70b-versatile", // Fast, good for most tasks
  SMART: "llama-3.1-70b-versatile", // Smarter, slower
  VISION: "llama-3.2-90b-vision-preview", // For image analysis
};

/**
 * Check if API key is configured
 */
export function isGroqConfigured(): boolean {
  return !!GROQ_API_KEY;
}

/**
 * Generic Groq chat completion
 */
async function groqChat(request: GroqChatRequest): Promise<GroqChatResponse> {
  if (!GROQ_API_KEY) {
    throw new Error(
      "Groq API key not configured. Please add EXPO_PUBLIC_GROQ_API_KEY to .env"
    );
  }

  console.log("🤖 Calling Groq AI...");

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(
      `Groq API error: ${error.error?.message || response.statusText}`
    );
  }

  return response.json();
}

/**
 * Analyze recipe requirements from user input
 * Main function for recipe generation flow
 */
export async function analyzeRecipeRequest(
  request: GroqRecipeAnalysisRequest
): Promise<GroqRecipeAnalysisResponse> {
  try {
    console.log("📊 Analyzing recipe request...");

    // Format the user prompt
    const userPrompt = formatGroqRecipePrompt(request);

    // Prepare messages
    const messages: GroqChatRequest["messages"] = [
      {
        role: "system",
        content: GROQ_RECIPE_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    // If images are provided, analyze them first
    if (request.images && request.images.length > 0) {
      const ingredientAnalysis = await analyzeIngredientImages(request.images);

      // Add detected ingredients to the prompt
      messages.push({
        role: "assistant",
        content: `I detected the following ingredients from the images: ${ingredientAnalysis.join(
          ", "
        )}`,
      });
      messages.push({
        role: "user",
        content:
          "Great! Please include these detected ingredients in your recipe recommendations.",
      });
    }

    // Call Groq
    const chatRequest: GroqChatRequest = {
      model: MODELS.FAST,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await groqChat(chatRequest);

    // Parse response
    const assistantMessage = response.choices[0]?.message?.content;
    if (!assistantMessage) {
      throw new Error("No response from Groq");
    }

    console.log("✅ Groq analysis complete");

    // Parse JSON response
    const analysis = parseGroqJsonResponse(assistantMessage);

    return analysis as GroqRecipeAnalysisResponse;
  } catch (error) {
    console.error("❌ Groq analysis error:", error);
    throw error;
  }
}

/**
 * Analyze images to detect ingredients
 * Uses Groq's vision model
 */
export async function analyzeIngredientImages(
  images: string[]
): Promise<string[]> {
  try {
    console.log(`🔍 Analyzing ${images.length} image(s) for ingredients...`);

    const detectedIngredients: string[] = [];

    for (const image of images) {
      // Prepare vision request
      const messages: GroqChatRequest["messages"] = [
        {
          role: "user",
          content: `Analyze this image and list all the food ingredients you can identify. 
          Return ONLY a JSON array of ingredient names, like: ["tomato", "onion", "garlic"]
          
          Image: ${image}`,
        },
      ];

      const chatRequest: GroqChatRequest = {
        model: MODELS.VISION,
        messages,
        temperature: 0.3,
        max_tokens: 500,
      };

      const response = await groqChat(chatRequest);
      const content = response.choices[0]?.message?.content;

      if (content) {
        try {
          const ingredients = parseGroqJsonResponse(content);
          if (Array.isArray(ingredients)) {
            detectedIngredients.push(...ingredients);
          }
        } catch (e) {
          console.warn("Failed to parse ingredients from image:", e);
        }
      }
    }

    // Remove duplicates
    const uniqueIngredients = [...new Set(detectedIngredients)];
    console.log("✅ Detected ingredients:", uniqueIngredients);

    return uniqueIngredients;
  } catch (error) {
    console.error("❌ Image analysis error:", error);
    // Don't fail completely if image analysis fails
    return [];
  }
}

/**
 * Get recipe suggestions based on available ingredients
 * Simpler, faster version for quick suggestions
 */
export async function suggestRecipesFromIngredients(
  ingredients: string[],
  dietaryRestrictions?: string[]
): Promise<{ recipes: string[]; explanation: string }> {
  const prompt = `Given these ingredients: ${ingredients.join(", ")}
${
  dietaryRestrictions
    ? `\nDietary restrictions: ${dietaryRestrictions.join(", ")}`
    : ""
}

Suggest 3 recipe names that can be made with these ingredients.
Return a JSON object with:
{
  "recipes": ["Recipe 1", "Recipe 2", "Recipe 3"],
  "explanation": "Brief explanation of why these recipes work"
}`;

  const chatRequest: GroqChatRequest = {
    model: MODELS.FAST,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful cooking assistant. Always respond with valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.8,
    max_tokens: 500,
  };

  const response = await groqChat(chatRequest);
  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from Groq");
  }

  return parseGroqJsonResponse(content);
}

/**
 * Refine search query using AI
 * Helps improve natural language searches
 */
export async function refineSearchQuery(
  userQuery: string,
  preferences?: {
    diets?: string[];
    cuisines?: string[];
    allergies?: string[];
  }
): Promise<string> {
  const prompt = `User search: "${userQuery}"
${preferences?.diets ? `\nDiets: ${preferences.diets.join(", ")}` : ""}
${
  preferences?.cuisines
    ? `\nPreferred cuisines: ${preferences.cuisines.join(", ")}`
    : ""
}
${
  preferences?.allergies
    ? `\nAllergies: ${preferences.allergies.join(", ")}`
    : ""
}

Create a refined, concise search query (max 10 words) that will help find the best recipes. 
Return ONLY the refined query text, nothing else.`;

  const chatRequest: GroqChatRequest = {
    model: MODELS.FAST,
    messages: [
      {
        role: "system",
        content:
          "You are a search query optimizer. Return only the optimized query.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 50,
  };

  const response = await groqChat(chatRequest);
  return response.choices[0]?.message?.content?.trim() || userQuery;
}

/**
 * Chat with AI about recipes (for future chat feature)
 */
export async function chatAboutRecipe(
  userMessage: string,
  conversationHistory?: GroqChatRequest["messages"]
): Promise<string> {
  const messages: GroqChatRequest["messages"] = [
    {
      role: "system",
      content:
        "You are a friendly cooking assistant. Help users with cooking questions, recipe suggestions, and culinary advice.",
    },
    ...(conversationHistory || []),
    {
      role: "user",
      content: userMessage,
    },
  ];

  const chatRequest: GroqChatRequest = {
    model: MODELS.FAST,
    messages,
    temperature: 0.7,
    max_tokens: 500,
  };

  const response = await groqChat(chatRequest);
  return (
    response.choices[0]?.message?.content ||
    "Sorry, I could not process your request."
  );
}

export default {
  analyzeRecipeRequest,
  analyzeIngredientImages,
  suggestRecipesFromIngredients,
  refineSearchQuery,
  chatAboutRecipe,
  isGroqConfigured,
};
