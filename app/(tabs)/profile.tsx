// app/(tabs)/profile.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Bell,
  Lock,
  Heart,
  ChefHat,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Settings as SettingsIcon,
  X,
  Camera,
  HelpCircle,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import { useNotifications } from "@/hooks/useNotifications";
import { HelpSupportModal } from "@/components/HelpSupportModal";

// Imports for functionality
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SessionManager } from "@/lib/sessionManager";

// --- CLOUDINARY CONFIGURATION ---
// Added .trim() and replace to clean up potentially accidental quotes from .env
const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/"/g, "").trim();
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.replace(/"/g, "").trim();
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function ProfileScreen() {
  const { colors, theme } = useTheme();
  // We mainly need the UID from useUser/Auth to set up the Firestore listener
  // const { user } = useUser();
  const { savedRecipes, getFavorites, getCookedRecipes } = useSavedRecipes();

  // Local state for Firestore data (The Source of Truth)
  const [firestoreUser, setFirestoreUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Temp state for editing
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");

  // --- 1. REAL-TIME FIRESTORE SYNC ---
  useEffect(() => {
    if (auth.currentUser?.uid) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setFirestoreUser(userData);

            // Sync edit fields if not currently editing
            if (!showEditModal) {
              setTempName(userData.name || "");
              setTempEmail(userData.email || auth.currentUser?.email || "");
            }
          }
          setLoadingUser(false);
        },
        (error) => {
          console.error("Error fetching user data:", error);
          setLoadingUser(false);
        }
      );

      return () => unsubscribe();
    } else {
      setLoadingUser(false);
    }
  }, [auth.currentUser?.uid, showEditModal]);

  // Use Firestore data for display, fall back to Auth defaults
  const userName =
    firestoreUser?.name || auth.currentUser?.displayName || "User";
  const displayEmail = firestoreUser?.email || auth.currentUser?.email || "";
  const displayAvatar = firestoreUser?.photoURL || auth.currentUser?.photoURL;

  const { enabled: notificationsEnabled, toggleNotifications } =
    useNotifications(userName);

  const settingsOptions = [
    {
      icon: User,
      label: "Edit Profile",
      value: "",
      action: () => {
        setTempName(userName);
        setTempEmail(displayEmail);
        setShowEditModal(true);
      },
    },
    {
      icon: Bell,
      label: "Notifications",
      value: "",
      action: () => {}, // Logic handled by Switch
    },
    {
      icon: Lock,
      label: "Privacy",
      value: "",
      action: () => router.push("../privacy"),
    },
    {
      icon: SettingsIcon,
      label: "Preferences",
      value: "",
      action: () => router.push("../preferences"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      value: "",
      action: () => setShowHelpModal(true),
    },
  ];

  // Dynamic stats
  const profileStats = [
    {
      label: "Recipes Saved",
      value: savedRecipes.length.toString(),
      icon: ChefHat,
      filter: "all" as const,
    },
    {
      label: "Recipes Cooked",
      value: getCookedRecipes().length.toString(),
      icon: ChefHat,
      filter: "cooked" as const,
    },
    {
      label: "Favorites",
      value: getFavorites().length.toString(),
      icon: Heart,
      filter: "favorites" as const,
    },
  ];

  // --- CLOUDINARY UPLOAD HELPER ---
  const uploadToCloudinary = async (uri: string) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      console.error("Missing Cloudinary Config:", {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_UPLOAD_PRESET,
      });
      throw new Error(
        "Cloudinary configuration is missing. Please check your .env file."
      );
    }

    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);

      // IMPORTANT: These must be appended correctly for unsigned upload
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      console.log(
        `Uploading to ${CLOUDINARY_URL} with preset ${CLOUDINARY_UPLOAD_PRESET}`
      );

      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await res.json();

      if (result.error) {
        console.error("Cloudinary API Error:", result.error);
        throw new Error(result.error.message);
      }

      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload network error:", error);
      throw error;
    }
  };

  // Function to pick and upload image
  const pickImage = async () => {
    // 1. Check permissions
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to change your avatar."
      );
      return;
    }

    // 2. Pick Image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Compress for faster upload
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;

      // 3. Upload Process
      setIsUploading(true);
      try {
        console.log("Starting upload process...");
        const downloadUrl = await uploadToCloudinary(selectedUri);
        console.log("Upload success, updating Firestore:", downloadUrl);

        // A. Update Firestore (This will automatically trigger the useEffect to update UI)
        if (auth.currentUser) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            photoURL: downloadUrl,
          });
        }

        Alert.alert("Success", "Profile picture updated!");
      } catch (error: any) {
        console.error("Avatar update flow error:", error);
        Alert.alert(
          "Upload Failed",
          error.message || "Could not upload image."
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  // --- SAVE PROFILE HANDLER (Name Only) ---
  const handleSaveProfile = async () => {
    if (!tempName.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    setIsSavingProfile(true);
    try {
      // 1. Update Firestore (name field)
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          name: tempName.trim(),
          updatedAt: new Date(),
        });

        // 2. Update Firebase Auth displayName (modular syntax)
        await updateProfile(auth.currentUser, {
          displayName: tempName.trim(),
        });

        // Note: onSnapshot listener will update firestoreUser automatically
      }

      setShowEditModal(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.error("Profile save error:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setTempEmail(displayEmail);
    setShowEditModal(false);
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await SessionManager.clearSession();
            await signOut(auth);
            router.replace("/login");
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cardBg }}
      edges={["top"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.cardBg,
          shadowColor: colors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          zIndex: 1,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary }}
        >
          Profile
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          paddingBottom: 80,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Profile Info Card */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            <View
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: 20,
                padding: 24,
                alignItems: "center",
                shadowColor: colors.shadow,
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <TouchableOpacity
                onPress={pickImage}
                disabled={isUploading}
                style={{
                  marginBottom: 16,
                  position: "relative",
                }}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                    overflow: "hidden",
                  }}
                >
                  {isUploading ? (
                    <ActivityIndicator color="#FFFFFF" size="large" />
                  ) : displayAvatar ? (
                    <Image
                      source={{ uri: displayAvatar }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/fallback.png")}
                      style={{ width: "100%", height: "100%" }}
                    />
                  )}
                </View>
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    backgroundColor: colors.cardBg,
                    borderRadius: 15,
                    width: 30,
                    height: 30,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                >
                  <Camera size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                {userName}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 20,
                }}
              >
                {displayEmail}
              </Text>

              <TouchableOpacity
                onPress={() => setShowEditModal(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 20,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "600",
                  }}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {profileStats.map((stat, index) => {
                const statColor =
                  index === 0
                    ? colors.primary
                    : index === 1
                    ? "#FF9500"
                    : "#FF6B6B";
                return (
                  <TouchableOpacity
                    key={stat.label}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/saved",
                        params: { filter: stat.filter },
                      })
                    }
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      backgroundColor: colors.cardBg,
                      borderRadius: 20,
                      padding: 16,
                      alignItems: "center",
                      shadowColor: colors.shadow,
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: `${statColor}15`,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    >
                      <stat.icon
                        size={20}
                        color={statColor}
                        strokeWidth={1.5}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        color: colors.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      {stat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Theme Toggle Section */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <ThemeToggle />
          </View>

          {/* Settings Section */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textPrimary,
                marginBottom: 12,
              }}
            >
              Settings
            </Text>

            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => {
                  if (option.label === "Notifications") {
                    // Do nothing - switch handles it
                  } else {
                    option.action();
                  }
                }}
                activeOpacity={option.label === "Notifications" ? 1 : 0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.cardBg,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  shadowColor: colors.shadow,
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <option.icon
                    size={20}
                    color={colors.primary}
                    strokeWidth={1.5}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.textPrimary,
                    fontWeight: "500",
                  }}
                >
                  {option.label}
                </Text>

                {option.label === "Notifications" ? (
                  <Switch
                    trackColor={{ false: "#E5E7EB", true: colors.primary }}
                    thumbColor={"#FFFFFF"}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={(val) => {
                      toggleNotifications(val);
                    }}
                    value={notificationsEnabled}
                  />
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {option.value ? (
                      <Text
                        style={{
                          fontSize: 14,
                          color: colors.textSecondary,
                        }}
                      >
                        {option.value}
                      </Text>
                    ) : null}
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <View
            style={{
              paddingHorizontal: 20,
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.cardBg,
                paddingVertical: 16,
                paddingHorizontal: 16,
                borderRadius: 16,
                shadowColor: colors.shadow,
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
                borderWidth: 1,
                borderColor: `${colors.error}30`,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${colors.error}15`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <LogOut size={20} color={colors.error} strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: colors.error,
                  fontWeight: "500",
                }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
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
                padding: 24,
                paddingBottom: 40,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: colors.textPrimary,
                  }}
                >
                  Edit Profile
                </Text>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Name
                </Text>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* READ-ONLY EMAIL FIELD */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Email (Read Only)
                </Text>
                <TextInput
                  value={tempEmail}
                  editable={false} // Disable editing
                  style={{
                    backgroundColor: theme === "dark" ? "#374151" : "#F3F4F6", // Gray background
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.textSecondary, // Muted text color
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: 0.7,
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: colors.textSecondary,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                    opacity: isSavingProfile ? 0.7 : 1,
                  }}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#FFFFFF",
                      }}
                    >
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Help & Support Modal */}
      <HelpSupportModal
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        userName={userName}
        userEmail={displayEmail}
      />
    </SafeAreaView>
  );
}
