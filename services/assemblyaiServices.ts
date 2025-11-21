// services/assemblyaiServices.ts
/**
 * AssemblyAI Service for Voice Transcription
 *
 * Documentation: https://www.assemblyai.com/docs
 *
 * IMPORTANT: Get your API key from https://www.assemblyai.com/
 * Free tier: 5 hours/month
 */

import Constants from "expo-constants";
import {
  AssemblyAIUploadResponse,
  AssemblyAITranscriptionRequest,
  AssemblyAITranscriptionResponse,
  SimpleTranscription,
} from "@/types/assemblyai";

const ASSEMBLYAI_API_KEY =
  Constants.expoConfig?.extra?.assemblyaiApiKey ||
  process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY;
const BASE_URL = "https://api.assemblyai.com/v2";

/**
 * Check if API key is configured
 */
export function isAssemblyAIConfigured(): boolean {
  return !!ASSEMBLYAI_API_KEY;
}

/**
 * Upload audio file to AssemblyAI
 * POST /v2/upload
 */
export async function uploadAudio(audioUri: string): Promise<string> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error(
      "AssemblyAI API key not configured. Please add EXPO_PUBLIC_ASSEMBLYAI_API_KEY to .env"
    );
  }

  console.log("📤 Uploading audio to AssemblyAI...");

  // Read the audio file
  const response = await fetch(audioUri);
  const audioBlob = await response.blob();

  // Upload to AssemblyAI
  const uploadResponse = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: audioBlob,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Upload failed: ${error.error || uploadResponse.statusText}`
    );
  }

  const data: AssemblyAIUploadResponse = await uploadResponse.json();
  console.log("✅ Audio uploaded:", data.upload_url);

  return data.upload_url;
}

/**
 * Create transcription request
 * POST /v2/transcript
 */
export async function createTranscription(
  audioUrl: string,
  options?: Partial<AssemblyAITranscriptionRequest>
): Promise<string> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("AssemblyAI API key not configured");
  }

  console.log("🎯 Creating transcription request...");

  const requestBody: AssemblyAITranscriptionRequest = {
    audio_url: audioUrl,
    language_code: "en", // English by default
    punctuate: true,
    format_text: true,
    disfluencies: true, // Remove "um", "uh", etc.
    ...options,
  };

  const response = await fetch(`${BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Transcription request failed: ${error.error || response.statusText}`
    );
  }

  const data: AssemblyAITranscriptionResponse = await response.json();
  console.log("✅ Transcription created:", data.id);

  return data.id;
}

/**
 * Get transcription status and result
 * GET /v2/transcript/{id}
 */
export async function getTranscription(
  transcriptId: string
): Promise<AssemblyAITranscriptionResponse> {
  if (!ASSEMBLYAI_API_KEY) {
    throw new Error("AssemblyAI API key not configured");
  }

  const response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get transcription: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll transcription until completed
 * Polls every 1 second for up to 60 seconds
 */
export async function pollTranscription(
  transcriptId: string,
  maxAttempts: number = 60,
  intervalMs: number = 1000,
  onProgress?: (status: string) => void
): Promise<AssemblyAITranscriptionResponse> {
  console.log("⏳ Polling transcription...");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const data = await getTranscription(transcriptId);

    if (onProgress) {
      onProgress(data.status);
    }

    if (data.status === "completed") {
      console.log("✅ Transcription completed!");
      return data;
    }

    if (data.status === "error") {
      throw new Error(`Transcription failed: ${data.error}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Transcription timeout - took longer than expected");
}

/**
 * Complete transcription workflow
 * Upload → Create → Poll → Return text
 */
export async function transcribeAudio(
  audioUri: string,
  onProgress?: (status: string) => void
): Promise<SimpleTranscription> {
  try {
    // Step 1: Upload audio
    if (onProgress) onProgress("Uploading audio...");
    const audioUrl = await uploadAudio(audioUri);

    // Step 2: Create transcription
    if (onProgress) onProgress("Creating transcription...");
    const transcriptId = await createTranscription(audioUrl);

    // Step 3: Poll for completion
    if (onProgress) onProgress("Transcribing...");
    const result = await pollTranscription(transcriptId, 60, 1000, onProgress);

    // Step 4: Return simplified result
    return {
      text: result.text || "",
      confidence: result.confidence || 0,
      duration: result.audio_duration || 0,
    };
  } catch (error) {
    console.error("❌ Transcription error:", error);
    throw error;
  }
}

/**
 * Transcribe with timeout and error handling
 * Recommended wrapper for UI use
 */
export async function transcribeAudioSafe(
  audioUri: string,
  timeoutMs: number = 30000, // 30 seconds
  onProgress?: (status: string) => void
): Promise<SimpleTranscription> {
  return Promise.race([
    transcribeAudio(audioUri, onProgress),
    new Promise<SimpleTranscription>((_, reject) =>
      setTimeout(() => reject(new Error("Transcription timeout")), timeoutMs)
    ),
  ]);
}

export default {
  uploadAudio,
  createTranscription,
  getTranscription,
  pollTranscription,
  transcribeAudio,
  transcribeAudioSafe,
  isAssemblyAIConfigured,
};
