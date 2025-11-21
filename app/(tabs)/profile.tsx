// app/(tabs)/profile.tsx

import React, { useState } from "react";
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
  Switch, // 1. Import Switch
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
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";

const profileStats = [
  { label: "Recipes Saved", value: "24", icon: ChefHat },
  { label: "Recipes Cooked", value: "18", icon: ChefHat },
  { label: "Favorites", value: "12", icon: Heart },
];

export default function ProfileScreen() {
  const { colors, theme } = useTheme();
  const { name, email, avatar, updateProfile, updateAvatar } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);

  const [tempName, setTempName] = useState(name);
  const [tempEmail, setTempEmail] = useState(email);

  // 2. Define the state for the notification switch
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Function to pick an image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      updateAvatar(result.assets[0].uri);
    }
  };

  const settingsOptions = [
    {
      icon: User,
      label: "Edit Profile",
      value: "",
      action: () => setShowEditModal(true),
    },
    // Removed "On" value since we are using a switch now
    { icon: Bell, label: "Notifications", value: "", action: () => {} },
    {
      icon: Lock,
      label: "Privacy",
      value: "",
      action: () => {
        router.push("../privacy");
      },
    },
    {
      icon: SettingsIcon,
      label: "Preferences",
      value: "",
      action: () => {
        router.push("../preferences");
      },
    },
  ];

  const handleSaveProfile = () => {
    updateProfile(tempName, tempEmail);
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setTempName(name);
    setTempEmail(email);
    setShowEditModal(false);
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
                  {avatar ? (
                    <Image
                      source={{ uri: avatar }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <User size={48} color="#FFFFFF" strokeWidth={1.5} />
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
                {name}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 20,
                }}
              >
                {email}
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
                  <View
                    key={stat.label}
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
                  </View>
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
                // 3. Toggle switch on row press if it's the notification row
                onPress={() => {
                  if (option.label === "Notifications") {
                    setNotificationsEnabled(!notificationsEnabled);
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

                {/* 4. Conditional Rendering: Switch vs Arrow */}
                {option.label === "Notifications" ? (
                  <Switch
                    trackColor={{ false: "#E5E7EB", true: colors.primary }} // Gray off, Green on
                    thumbColor={"#FFFFFF"}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={setNotificationsEnabled}
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

              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Email
                </Text>
                <TextInput
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
