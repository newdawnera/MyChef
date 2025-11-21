// hooks/useVoiceInput.ts
/**
 * Hook for voice input using expo-av + AssemblyAI
 *
 * Features:
 * - Record audio
 * - Upload to AssemblyAI
 * - Transcribe to text
 * - Progress tracking
 */

import { useState, useRef } from "react";
import { Audio } from "expo-av";
import { Platform } from "react-native";
import { transcribeAudioSafe } from "@/services/assemblyaiServices";

export interface VoiceInputState {
  isRecording: boolean;
  isTranscribing: boolean;
  transcription: string;
  error: string | null;
  progress: string;
}

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const recording = useRef<Audio.Recording | null>(null);

  /**
   * Request audio recording permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Microphone permission is required for voice input");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Permission error:", err);
      setError("Failed to request microphone permission");
      return false;
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = async (): Promise<boolean> => {
    try {
      setError(null);
      setTranscription("");
      setProgress("");

      // Check permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("🎤 Starting recording...");

      // Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setIsRecording(true);
      setProgress("Recording...");

      console.log("✅ Recording started");
      return true;
    } catch (err) {
      console.error("❌ Failed to start recording:", err);
      setError("Failed to start recording");
      return false;
    }
  };

  /**
   * Stop recording and transcribe
   */
  const stopRecording = async (): Promise<string> => {
    try {
      if (!recording.current) {
        throw new Error("No active recording");
      }

      console.log("⏹️ Stopping recording...");
      setProgress("Stopping recording...");

      // Stop and unload recording
      await recording.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.current.getURI();
      recording.current = null;
      setIsRecording(false);

      if (!uri) {
        throw new Error("No recording URI");
      }

      console.log("✅ Recording saved:", uri);

      // Transcribe
      setIsTranscribing(true);
      setProgress("Transcribing...");

      const result = await transcribeAudioSafe(
        uri,
        30000, // 30 second timeout
        (status) => {
          setProgress(status);
        }
      );

      const text = result.text.trim();
      setTranscription(text);
      setProgress("");
      setIsTranscribing(false);

      console.log("✅ Transcription:", text);

      return text;
    } catch (err) {
      console.error("❌ Failed to stop recording or transcribe:", err);
      setError(err instanceof Error ? err.message : "Transcription failed");
      setIsRecording(false);
      setIsTranscribing(false);
      setProgress("");
      throw err;
    }
  };

  /**
   * Cancel recording without transcribing
   */
  const cancelRecording = async () => {
    try {
      if (recording.current) {
        await recording.current.stopAndUnloadAsync();
        recording.current = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      setIsRecording(false);
      setProgress("");
      console.log("✅ Recording cancelled");
    } catch (err) {
      console.error("❌ Failed to cancel recording:", err);
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setTranscription("");
    setError(null);
    setProgress("");
  };

  /**
   * Complete voice input flow: record → stop → transcribe
   */
  const recordAndTranscribe = async (): Promise<string> => {
    // If already recording, stop and transcribe
    if (isRecording) {
      return stopRecording();
    }

    // Start new recording
    const started = await startRecording();
    if (!started) {
      throw new Error("Failed to start recording");
    }

    // Return empty string - user needs to manually stop
    return "";
  };

  return {
    // State
    isRecording,
    isTranscribing,
    transcription,
    error,
    progress,

    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    recordAndTranscribe,

    // Utils
    requestPermissions,
  };
}

export default useVoiceInput;
