// components/ImprovedSearchBar.tsx
/**
 * Improved Search Bar with Audio Recording
 *
 * Features:
 * - Taller input (120px max) with vertical scrolling
 * - Audio recording with AssemblyAI transcription
 * - Image attachments (camera + gallery)
 * - Keyboard dismissal on outside touch
 * - Visual feedback for recording
 */

import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Search, Camera, ImageIcon, X, Mic } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { useTheme } from "@/contexts/ThemeContext";
import { transcribeAudio } from "@/services/assemblyaiServices";

interface ImprovedSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onImagesSelected?: (images: string[]) => void;
  placeholder?: string;
  maxImages?: number;
}

export function ImprovedSearchBar({
  value,
  onChangeText,
  onImagesSelected,
  placeholder = "Search recipes, ingredients, or describe what you want to cook...",
  maxImages = 5,
}: ImprovedSearchBarProps) {
  const { colors } = useTheme();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);
  const silenceTimer = useRef<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  /**
   * Start pulsing animation for mic
   */
  const startPulsing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micPulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(micPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Stop pulsing animation
   */
  const stopPulsing = () => {
    micPulseAnim.stopAnimation();
    micPulseAnim.setValue(1);
  };

  /**
   * Start audio recording
   */
  /**
   * Start audio recording with Auto-Stop
   */
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant microphone access.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording with Metering enabled and Status Callback
      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true, // Enable volume measuring
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Detect speaking (volume > -50dB)
            if (status.metering > -40) {
              // 1. Clear existing timer (user is speaking)
              if (silenceTimer.current) clearTimeout(silenceTimer.current);

              // 2. Start new 3-second countdown
              silenceTimer.current = setTimeout(() => {
                stopRecording();
              }, 3000);
            }
          }
        },
        200 // Check every 200ms
      );

      // Save to State AND Ref (Ref is needed for the timer to work)
      setRecording(newRecording);
      recordingRef.current = newRecording;

      setIsRecording(true);
      startPulsing();
      console.log("🎤 Recording started");

      // Start an initial timer (in case user never speaks at all)
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        stopRecording();
      }, 3000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording.");
    }
  };

  /**
   * Stop recording and transcribe
   */
  /**
   * Stop recording and transcribe
   */
  const stopRecording = async () => {
    // 1. Cleanup Timer immediately
    if (silenceTimer.current) clearTimeout(silenceTimer.current);

    // 2. Use Ref to get the active recording (fixes state issues in timers)
    const activeRecording = recordingRef.current;

    if (!activeRecording) return;

    try {
      stopPulsing();
      setIsRecording(false);

      // Cleanup State and Ref
      setRecording(null);
      recordingRef.current = null;

      console.log("⏸️ Stopping recording...");
      await activeRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = activeRecording.getURI();

      if (!uri) {
        Alert.alert("Error", "No audio recorded");
        return;
      }

      setIsTranscribing(true);

      const result = await transcribeAudio(uri, (status) => {
        console.log("📝 Transcription status:", status);
      });

      setIsTranscribing(false);

      if (result.text) {
        const newText = value ? `${value} ${result.text}` : result.text;
        onChangeText(newText);
      } else {
        Alert.alert("No Speech Detected", "Please try speaking again.");
      }
    } catch (error: any) {
      console.error("❌ Recording/Transcription error:", error);
      setIsTranscribing(false);
      Alert.alert("Error", error.message || "Failed to transcribe.");
    }
  };

  /**
   * Toggle recording
   */
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /**
   * Pick image from gallery
   */
  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to add images."
        );
        return;
      }

      if (selectedImages.length >= maxImages) {
        Alert.alert(
          "Maximum Images",
          `You can only add up to ${maxImages} images.`
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...selectedImages, result.assets[0].uri];
        setSelectedImages(newImages);
        onImagesSelected?.(newImages);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  /**
   * Take photo with camera
   */
  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to take photos."
        );
        return;
      }

      if (selectedImages.length >= maxImages) {
        Alert.alert(
          "Maximum Images",
          `You can only add up to ${maxImages} images.`
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...selectedImages, result.assets[0].uri];
        setSelectedImages(newImages);
        onImagesSelected?.(newImages);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  /**
   * Remove an image
   */
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    onImagesSelected?.(newImages);
  };

  /**
   * Dismiss keyboard when tapping outside
   */
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Search Input - Doubled Height with Scrolling */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            paddingTop: 16,
            paddingHorizontal: 16,
          }}
        >
          <Search
            size={20}
            color={colors.textSecondary}
            style={{ marginTop: 4 }}
          />

          <ScrollView
            style={{
              flex: 1,
              marginLeft: 12,
              maxHeight: 60, // Doubled height
            }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                fontSize: 16,
                color: colors.textPrimary,
                minHeight: 100, // Doubled height
                paddingVertical: 0,
                lineHeight: 22,
              }}
            />
          </ScrollView>
          {value.length > 0 && (
            <TouchableOpacity
              onPress={() => onChangeText("")}
              style={{
                backgroundColor: "rgba(142, 142, 147, 0.2)", // Light grey background
                borderRadius: 12,
                width: 24,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
                marginTop: 4, // Aligns with the first line of text
              }}
            >
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
            }}
            contentContainerStyle={{
              gap: 8,
            }}
          >
            {selectedImages.map((uri, index) => (
              <View
                key={index}
                style={{
                  position: "relative",
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
                {/* Remove button */}
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Action Buttons at Bottom */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 12,
          }}
        >
          {/* Transcribing Loader */}
          {isTranscribing && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
          )}

          {/* Microphone Button with Pulsing Effect */}
          <TouchableOpacity
            onPress={toggleRecording}
            disabled={isTranscribing}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: isRecording
                ? "rgba(239, 68, 68, 0.1)"
                : colors.cardBg,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isRecording ? "#EF4444" : colors.border,
              opacity: isTranscribing ? 0.5 : 1,
            }}
          >
            <Animated.View
              style={{
                transform: [{ scale: isRecording ? micPulseAnim : 1 }],
              }}
            >
              <Mic size={18} color={isRecording ? "#EF4444" : colors.primary} />
            </Animated.View>
          </TouchableOpacity>

          {/* Camera Button */}
          <TouchableOpacity
            onPress={takePhotoWithCamera}
            disabled={isRecording || isTranscribing}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.cardBg,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isRecording || isTranscribing ? 0.5 : 1,
            }}
          >
            <Camera size={18} color={colors.primary} />
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            onPress={pickImageFromGallery}
            disabled={isRecording || isTranscribing}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.cardBg,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isRecording || isTranscribing ? 0.5 : 1,
            }}
          >
            <ImageIcon size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
