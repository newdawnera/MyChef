// components/EnhancedSearchBar.tsx
/**
 * Enhanced Search Bar Component
 *
 * Features:
 * - Text input for search
 * - Camera icon - Take photo of ingredients
 * - Gallery icon - Select photo from gallery
 * - Microphone icon - Voice input
 *
 * All inputs are collected and passed to parent via onSearch callback
 */

import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Search, Camera, ImageIcon, Mic, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useImagePicker } from "@/hooks/useImagePicker";

interface EnhancedSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onImagesSelected?: (images: string[]) => void; // base64 images
  placeholder?: string;
  editable?: boolean;
}

export function EnhancedSearchBar({
  value,
  onChangeText,
  onImagesSelected,
  placeholder = "Search recipes, ingredients...",
  editable = true,
}: EnhancedSearchBarProps) {
  const { colors } = useTheme();
  const [showImageModal, setShowImageModal] = useState(false);

  // Voice input hook
  const {
    isRecording,
    isTranscribing,
    progress,
    startRecording,
    stopRecording,
    error: voiceError,
  } = useVoiceInput();

  // Image picker hook
  const {
    images,
    loading: imageLoading,
    takePhoto,
    selectFromGallery,
    removeImage,
    getBase64Images,
    error: imageError,
  } = useImagePicker();

  /**
   * Handle microphone press
   */
  const handleMicPress = async () => {
    if (!editable) return;

    try {
      if (isRecording) {
        // Stop recording and get transcription
        const text = await stopRecording();
        if (text) {
          // Append to existing text or replace
          onChangeText(value ? `${value} ${text}` : text);
        }
      } else {
        // Start recording
        await startRecording();
      }
    } catch (error) {
      console.error("Voice input error:", error);
      Alert.alert(
        "Voice Input Error",
        "Failed to process voice input. Please try again."
      );
    }
  };

  /**
   * Handle camera press
   */
  const handleCameraPress = async () => {
    if (!editable) return;

    try {
      const photo = await takePhoto();
      if (photo) {
        // Notify parent of new images
        if (onImagesSelected) {
          onImagesSelected(getBase64Images());
        }
        // Show image modal
        setShowImageModal(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Camera Error", "Failed to take photo. Please try again.");
    }
  };

  /**
   * Handle gallery press
   */
  const handleGalleryPress = async () => {
    if (!editable) return;

    try {
      const selected = await selectFromGallery(true); // Allow multiple
      if (selected.length > 0) {
        // Notify parent of new images
        if (onImagesSelected) {
          onImagesSelected(getBase64Images());
        }
        // Show image modal
        setShowImageModal(true);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert(
        "Gallery Error",
        "Failed to select images. Please try again."
      );
    }
  };

  /**
   * Handle remove image
   */
  const handleRemoveImage = (uri: string) => {
    removeImage(uri);
    if (onImagesSelected) {
      onImagesSelected(getBase64Images());
    }
  };

  return (
    <View>
      {/* Main Search Bar */}
      <View
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        {/* Search Icon */}
        <Search
          size={20}
          color={colors.textSecondary}
          style={{ marginRight: 8 }}
        />

        {/* Text Input */}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          editable={editable && !isRecording && !isTranscribing}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.textPrimary,
            padding: 0,
          }}
        />

        {/* Action Icons Container */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginLeft: 8,
          }}
        >
          {/* Camera Icon */}
          <TouchableOpacity
            onPress={handleCameraPress}
            disabled={!editable || imageLoading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imageLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Camera size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {/* Gallery Icon */}
          <TouchableOpacity
            onPress={handleGalleryPress}
            disabled={!editable || imageLoading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Microphone Icon */}
          <TouchableOpacity
            onPress={handleMicPress}
            disabled={!editable || isTranscribing}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isRecording ? colors.primary : colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Mic
                size={18}
                color={isRecording ? "#ffffff" : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Recording Status */}
      {(isRecording || isTranscribing || progress) && (
        <View
          style={{
            marginTop: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: colors.cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: colors.primary,
              textAlign: "center",
            }}
          >
            {isRecording
              ? "🎤 Recording... Tap mic to stop"
              : isTranscribing
              ? "✨ Transcribing..."
              : progress}
          </Text>
        </View>
      )}

      {/* Error Display */}
      {(voiceError || imageError) && (
        <View
          style={{
            marginTop: 8,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: "#FEE2E2",
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: "#DC2626",
              textAlign: "center",
            }}
          >
            {voiceError || imageError}
          </Text>
        </View>
      )}

      {/* Selected Images Preview */}
      {images.length > 0 && (
        <View
          style={{
            marginTop: 12,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {images.map((img, index) => (
            <View
              key={img.uri}
              style={{
                position: "relative",
                width: 60,
                height: 60,
              }}
            >
              <Image
                source={{ uri: img.uri }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: colors.primary,
                }}
              />
              <TouchableOpacity
                onPress={() => handleRemoveImage(img.uri)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setShowImageModal(true)}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: "dashed",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ fontSize: 20, color: colors.textSecondary }}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Management Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 40,
              maxHeight: "70%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Ingredient Images ({images.length})
              </Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Images Grid */}
            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {images.map((img) => (
                  <View
                    key={img.uri}
                    style={{
                      position: "relative",
                      width: "31%",
                      aspectRatio: 1,
                    }}
                  >
                    <Image
                      source={{ uri: img.uri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 12,
                      }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(img.uri)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add More Buttons */}
              <View style={{ marginTop: 20, gap: 12 }}>
                <TouchableOpacity
                  onPress={async () => {
                    await handleCameraPress();
                  }}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Camera size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    Take Photo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    await handleGalleryPress();
                  }}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <ImageIcon size={20} color={colors.textPrimary} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.textPrimary,
                    }}
                  >
                    Select from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default EnhancedSearchBar;
