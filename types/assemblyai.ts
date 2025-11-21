// types/assemblyai.ts
/**
 * AssemblyAI Type Definitions for Voice Transcription
 *
 * Documentation: https://www.assemblyai.com/docs
 */

/**
 * AssemblyAI upload response
 * POST /v2/upload
 */
export interface AssemblyAIUploadResponse {
  upload_url: string;
}

/**
 * AssemblyAI transcription request
 * POST /v2/transcript
 */
export interface AssemblyAITranscriptionRequest {
  audio_url: string;
  language_code?: string; // e.g., 'en', 'es', 'fr'
  punctuate?: boolean;
  format_text?: boolean;
  disfluencies?: boolean; // Remove filler words like "um", "uh"
  dual_channel?: boolean;
  webhook_url?: string;
  auto_highlights?: boolean;
  audio_start_from?: number;
  audio_end_at?: number;
  word_boost?: string[];
  boost_param?: "low" | "default" | "high";
  filter_profanity?: boolean;
  redact_pii?: boolean;
  speaker_labels?: boolean;
  content_safety?: boolean;
  iab_categories?: boolean;
}

/**
 * AssemblyAI transcription response
 * GET /v2/transcript/{id}
 */
export interface AssemblyAITranscriptionResponse {
  id: string;
  language_model: string;
  acoustic_model: string;
  language_code: string;
  status: "queued" | "processing" | "completed" | "error";
  audio_url: string;
  text: string | null;
  words: Word[] | null;
  utterances: Utterance[] | null;
  confidence: number | null;
  audio_duration: number | null;
  punctuate: boolean;
  format_text: boolean;
  dual_channel: boolean | null;
  webhook_url: string | null;
  webhook_status_code: number | null;
  webhook_auth: boolean;
  webhook_auth_header_name: string | null;
  speed_boost: boolean;
  auto_highlights_result: AutoHighlightsResult | null;
  audio_start_from: number | null;
  audio_end_at: number | null;
  word_boost: string[];
  boost_param: string | null;
  filter_profanity: boolean;
  redact_pii: boolean;
  redact_pii_audio: boolean;
  redact_pii_audio_quality: string | null;
  redact_pii_policies: string[] | null;
  redact_pii_sub: string | null;
  speaker_labels: boolean;
  content_safety: boolean;
  iab_categories: boolean;
  content_safety_labels: ContentSafetyLabels | null;
  iab_categories_result: IABCategoriesResult | null;
  language_detection: boolean;
  custom_spelling: CustomSpelling[] | null;
  auto_chapters: boolean;
  chapters: Chapter[] | null;
  disfluencies: boolean;
  entity_detection: boolean;
  entities: Entity[] | null;
  summary_model: string | null;
  summary_type: string | null;
  summary: string | null;
  custom_topics: boolean;
  topics: string[];
  speech_threshold: number | null;
  error: string | null;
}

export interface Word {
  confidence: number;
  end: number;
  start: number;
  text: string;
  speaker: string | null;
}

export interface Utterance {
  confidence: number;
  end: number;
  start: number;
  text: string;
  words: Word[];
  speaker: string;
}

export interface AutoHighlightsResult {
  status: string;
  results: HighlightResult[];
}

export interface HighlightResult {
  count: number;
  rank: number;
  text: string;
  timestamps: { start: number; end: number }[];
}

export interface ContentSafetyLabels {
  status: string;
  results: ContentSafetyLabel[];
  summary: Record<string, number>;
  severity_score_summary: Record<string, SeverityScore>;
}

export interface ContentSafetyLabel {
  text: string;
  labels: LabelResult[];
  timestamp: { start: number; end: number };
}

export interface LabelResult {
  label: string;
  confidence: number;
  severity: number;
}

export interface SeverityScore {
  low: number;
  medium: number;
  high: number;
}

export interface IABCategoriesResult {
  status: string;
  results: IABCategory[];
  summary: Record<string, number>;
}

export interface IABCategory {
  text: string;
  labels: IABLabel[];
  timestamp: { start: number; end: number };
}

export interface IABLabel {
  relevance: number;
  label: string;
}

export interface CustomSpelling {
  from: string[];
  to: string;
}

export interface Chapter {
  gist: string;
  headline: string;
  summary: string;
  start: number;
  end: number;
}

export interface Entity {
  entity_type: string;
  text: string;
  start: number;
  end: number;
}

/**
 * Simplified transcription result for our use case
 */
export interface SimpleTranscription {
  text: string;
  confidence: number;
  duration: number; // in seconds
}

/**
 * Helper: Poll for transcription completion
 */
export async function pollTranscription(
  transcriptId: string,
  apiKey: string,
  maxAttempts: number = 60,
  intervalMs: number = 1000
): Promise<AssemblyAITranscriptionResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: {
          authorization: apiKey,
        },
      }
    );

    const data: AssemblyAITranscriptionResponse = await response.json();

    if (data.status === "completed") {
      return data;
    }

    if (data.status === "error") {
      throw new Error(`Transcription failed: ${data.error}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Transcription timeout");
}
