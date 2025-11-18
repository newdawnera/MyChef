// app/profile/index.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  User,
  Mail,
  Bell,
  Lock,
  Heart,
  ChefHat,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Home as HomeIcon,
  Bookmark,
  Settings as SettingsIcon,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";

const profileStats = [
  { label: "Recipes Saved", value: "24", icon: Bookmark, color: "#70AD47" },
  { label: "Recipes Cooked", value: "18", icon: ChefHat, color: "#FF9500" },
  { label: "Favorites", value: "12", icon: Heart, color: "#FF6B6B" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [userName, setUserName] = useState("Sarah Johnson");
  const [userEmail, setUserEmail] = useState("sarah.johnson@email.com");
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);

  const settingsOptions = [
    {
      icon: User,
      label: "Edit Profile",
      value: "",
      action: () => setShowEditModal(true),
    },
    { icon: Bell, label: "Notifications", value: "On", action: () => {} },
    { icon: Lock, label: "Privacy", value: "", action: () => {} },
    { icon: SettingsIcon, label: "Preferences", value: "", action: () => {} },
  ];

  const handleSaveProfile = () => {
    setUserName(tempName);
    setUserEmail(tempEmail);
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setTempEmail(userEmail);
    setShowEditModal(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["bottom"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <ArrowLeft size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "600", color: "#1A1A1A" }}>
          Profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {/* Profile Info Card */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#70AD47",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                shadowColor: "#70AD47",
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <User size={48} color="#FFFFFF" strokeWidth={1.5} />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#1A1A1A",
                marginBottom: 4,
              }}
            >
              {userName}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 20,
              }}
            >
              {userEmail}
            </Text>

            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={{
                backgroundColor: "#70AD47",
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 20,
                shadowColor: "#70AD47",
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
            {profileStats.map((stat, index) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 16,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: `${stat.color}20`,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${stat.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <stat.icon size={20} color={stat.color} strokeWidth={1.5} />
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1A1A1A",
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#6B7280",
                    textAlign: "center",
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Settings Section */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1A1A1A",
              marginBottom: 16,
            }}
          >
            Settings
          </Text>

          <View style={{ gap: 12 }}>
            {/* Theme Toggle */}
            <TouchableOpacity
              onPress={() => setIsDarkMode(!isDarkMode)}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#70AD4715",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isDarkMode ? (
                    <Moon size={20} color="#70AD47" strokeWidth={1.5} />
                  ) : (
                    <Sun size={20} color="#70AD47" strokeWidth={1.5} />
                  )}
                </View>
                <Text
                  style={{ fontSize: 15, color: "#1A1A1A", fontWeight: "500" }}
                >
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 14, color: "#6B7280" }}>On</Text>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Settings Options */}
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={option.label}
                onPress={option.action}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#70AD4715",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <option.icon size={20} color="#70AD47" strokeWidth={1.5} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#1A1A1A",
                      fontWeight: "500",
                    }}
                  >
                    {option.label}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {option.value && (
                    <Text style={{ fontSize: 14, color: "#6B7280" }}>
                      {option.value}
                    </Text>
                  )}
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}

            {/* Logout Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginTop: 12,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#FF6B6B15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LogOut size={20} color="#FF6B6B" strokeWidth={1.5} />
              </View>
              <Text
                style={{ fontSize: 15, color: "#FF6B6B", fontWeight: "500" }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {/* Bottom Navigation */}
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingTop: 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            height: 64,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
            onPress={() => {
              setActiveTab("home");
              router.push("/home");
            }}
          >
            <HomeIcon
              size={24}
              // Use the green from your new code for consistency
              color={activeTab === "home" ? "#16a34a" : "#9ca3af"}
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color: activeTab === "home" ? "#16a34a" : "#9ca3af",
                fontWeight: activeTab === "home" ? "500" : "400",
              }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
            onPress={() => {
              setActiveTab("saved");
              router.push("../recipes/saved");
            }}
          >
            <Bookmark
              size={24}
              color={activeTab === "saved" ? "#16a34a" : "#9ca3af"}
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color: activeTab === "saved" ? "#16a34a" : "#9ca3af",
                fontWeight: activeTab === "saved" ? "500" : "400",
              }}
            >
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
            onPress={() => setActiveTab("profile")}
          >
            <User
              size={24}
              color={activeTab === "profile" ? "#16a34a" : "#9ca3af"}
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color: activeTab === "profile" ? "#16a34a" : "#9ca3af",
                fontWeight: activeTab === "profile" ? "500" : "400",
              }}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelEdit}
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
              backgroundColor: "#FFFFFF",
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
                style={{ fontSize: 20, fontWeight: "700", color: "#1A1A1A" }}
              >
                Edit Profile
              </Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#1A1A1A",
                  marginBottom: 8,
                }}
              >
                Name
              </Text>
              <TextInput
                value={tempName}
                onChangeText={setTempName}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: "#1A1A1A",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#1A1A1A",
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
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: "#1A1A1A",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                style={{
                  flex: 1,
                  backgroundColor: "#70AD47",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  shadowColor: "#70AD47",
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
                >
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
