// hooks/useImagePicker.ts
/**
 * Hook for picking images from camera or gallery
 *
 * Features:
 * - Take photo with camera
 * - Select from gallery
 * - Multiple image selection
 * - Base64 encoding for AI analysis
 */

import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export interface PickedImage {
  uri: string;
  base64?: string;
  width: number;
  height: number;
}

export function useImagePicker() {
  const [images, setImages] = useState<PickedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setError("Camera permission is required to take photos");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Camera permission error:", err);
      setError("Failed to request camera permission");
      return false;
    }
  };

  /**
   * Request media library permissions
   */
  const requestGalleryPermission = async (): Promise<boolean> => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Gallery permission is required to select photos");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Gallery permission error:", err);
      setError("Failed to request gallery permission");
      return false;
    }
  };

  /**
   * Take photo with camera
   */
  const takePhoto = async (): Promise<PickedImage | null> => {
    try {
      setLoading(true);
      setError(null);

      // Check permissions
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        return null;
      }

      console.log("📷 Opening camera...");

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Compress to reduce size
        base64: true, // Get base64 for AI analysis
      });

      if (result.canceled) {
        console.log("📷 Camera cancelled");
        return null;
      }

      const asset = result.assets[0];
      const pickedImage: PickedImage = {
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        width: asset.width,
        height: asset.height,
      };

      // Add to images array
      setImages((prev) => [...prev, pickedImage]);

      console.log("✅ Photo taken");
      return pickedImage;
    } catch (err) {
      console.error("❌ Failed to take photo:", err);
      setError("Failed to take photo");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select image from gallery
   */
  const selectFromGallery = async (
    multiple: boolean = false
  ): Promise<PickedImage[]> => {
    try {
      setLoading(true);
      setError(null);

      // Check permissions
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        return [];
      }

      console.log("🖼️ Opening gallery...");

      // Launch gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !multiple, // Only allow editing for single selection
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
        allowsMultipleSelection: multiple,
      });

      if (result.canceled) {
        console.log("🖼️ Gallery cancelled");
        return [];
      }

      const pickedImages: PickedImage[] = result.assets.map((asset) => ({
        uri: asset.uri,
        base64: asset.base64 ?? undefined,
        width: asset.width,
        height: asset.height,
      }));

      // Add to images array
      setImages((prev) => [...prev, ...pickedImages]);

      console.log(`✅ ${pickedImages.length} image(s) selected`);
      return pickedImages;
    } catch (err) {
      console.error("❌ Failed to select from gallery:", err);
      setError("Failed to select image");
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove an image by URI
   */
  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
    console.log("✅ Image removed");
  };

  /**
   * Clear all images
   */
  const clearImages = () => {
    setImages([]);
    setError(null);
    console.log("✅ All images cleared");
  };

  /**
   * Get base64 strings for AI analysis
   */
  const getBase64Images = (): string[] => {
    return images
      .map((img) => img.base64)
      .filter((b64): b64 is string => !!b64);
  };

  /**
   * Get image URIs
   */
  const getImageUris = (): string[] => {
    return images.map((img) => img.uri);
  };

  return {
    // State
    images,
    loading,
    error,

    // Actions
    takePhoto,
    selectFromGallery,
    removeImage,
    clearImages,

    // Utils
    getBase64Images,
    getImageUris,
    requestCameraPermission,
    requestGalleryPermission,

    // Direct setters (for advanced use)
    setImages,
    setError,
  };
}

export default useImagePicker;
