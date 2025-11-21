// app/privacy/index.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext"; // 1. Import Theme Hook
import {
  ArrowLeft,
  Camera,
  Mic,
  Clock,
  Bookmark,
  ChefHat,
  Trash2,
  FileText,
  Shield,
  ChevronRight,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";

// ... (Keep your privacyPolicyContent and termsOfServiceContent strings here exactly as they were)
const privacyPolicyContent = `# Privacy Policy for MyChef

Last Updated: ${new Date().toLocaleDateString()}

## 1. Introduction
Welcome to MyChef! We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

## 2. Information We Collect
We collect information that you provide directly to us, including:
-  Account Information:  Name, email address, and profile information
-  Recipe Preferences:  Dietary restrictions, favorite cuisines, cooking skill level
-  Usage Data:  Recipes you view, save, and cook
-  Device Information:  Device type, operating system, and unique device identifiers

## 3. How We Use Your Information
We use the information we collect to:
- Provide, maintain, and improve our services
- Personalize your recipe recommendations
- Send you updates, marketing communications, and other information
- Monitor and analyze trends, usage, and activities
- Detect, prevent, and address technical issues

## 4. Information Sharing
We do not sell your personal information. We may share your information with:
-  Service Providers:  Third-party vendors who perform services on our behalf
-  API Partners:  Spoonacular and other recipe APIs for personalized recommendations
-  Legal Requirements:  When required by law or to protect our rights

## 5. Data Security
We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## 6. Your Privacy Rights
You have the right to:
- Access and receive a copy of your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Object to processing of your data
- Withdraw consent at any time

## 7. Children's Privacy
Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.

## 8. Changes to Privacy Policy
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

## 9. Contact Us
If you have questions about this Privacy Policy, please contact us at:
- Email: privacy@mychefapp.com
- Address: Hub Residences, DD1, Dundee, United Kingdom`;

const termsOfServiceContent = `# Terms of Service for MyChef

 Last Updated:  ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms
By accessing and using MyChef ("the App"), you accept and agree to be bound by the terms and provisions of this agreement.

## 2. Use License
Permission is granted to temporarily use the App for personal, non-commercial use only. This is the grant of a license, not a transfer of title.

## 3. User Account
- You are responsible for maintaining the confidentiality of your account
- You are responsible for all activities that occur under your account
- You must provide accurate and complete information
- You must be at least 13 years old to use this App

## 4. Acceptable Use
You agree not to:
- Use the App for any illegal purpose
- Attempt to gain unauthorized access to the App
- Interfere with or disrupt the App's servers or networks
- Upload viruses or malicious code
- Collect user information without consent

## 5. Recipe Content
- Recipes are provided through third-party APIs (including Spoonacular)
- We do not guarantee the accuracy of recipe information
- You are responsible for verifying ingredients for allergens
- Follow food safety guidelines when preparing recipes

## 6. Intellectual Property
- The App and its original content are owned by MyChef
- User-generated content remains the property of users
- By posting content, you grant us a license to use, modify, and display it

## 7. Subscription and Payments
- Some features may require a paid subscription
- Subscriptions automatically renew unless cancelled
- Refunds are subject to our refund policy
- We reserve the right to modify pricing

## 8. Disclaimer of Warranties
The App is provided "as is" without warranties of any kind, either express or implied.

## 9. Limitation of Liability
MyChef shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App.

## 10. Privacy
Your use of the App is also governed by our Privacy Policy.

## 11. Termination
We reserve the right to terminate or suspend your account at any time without notice for conduct that we believe violates these Terms or is harmful to other users.

## 12. Changes to Terms
We reserve the right to modify these terms at any time. Continued use of the App constitutes acceptance of modified terms.

## 13. Governing Law
These Terms shall be governed by the laws of the jurisdiction in which MyChef operates.

## 14. Contact Information
For questions about these Terms of Service, contact us at:
- Email: support@mychefapp.com
- Address:  Hub Residences, DD1, Dundee, United Kingdom`;

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme(); // 2. Get colors
  const [cameraAccess, setCameraAccess] = useState(true);
  const [microphoneAccess, setMicrophoneAccess] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleClearData = (type: string) => {
    Alert.alert(
      `Clear ${type}?`,
      `This action will permanently remove all ${type.toLowerCase()}. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Alert.alert("Success", `${type} cleared successfully`);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Account Deleted",
              "Your account has been permanently deleted."
            );
          },
        },
      ]
    );
  };

  const PermissionCard = ({
    icon: Icon,
    title,
    enabled,
    onToggle,
  }: {
    icon: any;
    title: string;
    enabled: boolean;
    onToggle: (val: boolean) => void;
  }) => (
    <View
      style={{
        backgroundColor: colors.cardBg, // Dynamic bg
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: colors.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border, // Dynamic border
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colors.primary}15`, // Dynamic primary with opacity
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text
          style={{
            fontSize: 15,
            color: colors.textPrimary, // Dynamic text
            fontWeight: "500",
          }}
        >
          {title}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#E5E7EB", true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const ActionCard = ({
    icon: Icon,
    title,
    onPress,
    iconColor = "#FF9500",
    textColor,
    showChevron = true,
  }: {
    icon: any;
    title: string;
    onPress: () => void;
    iconColor?: string;
    textColor?: string;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.cardBg, // Dynamic bg
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: colors.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border, // Dynamic border
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${iconColor}15`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={iconColor} strokeWidth={1.5} />
        </View>
        <Text
          style={{
            fontSize: 15,
            // Use passed textColor or fallback to dynamic textPrimary
            color: textColor || colors.textPrimary,
            fontWeight: "500",
          }}
        >
          {title}
        </Text>
      </View>
      {showChevron && <ChevronRight size={20} color={colors.textTertiary} />}
    </TouchableOpacity>
  );

  const LegalModal = ({
    visible,
    onClose,
    title,
    content,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    content: string;
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              marginTop: 60,
              backgroundColor: colors.cardBg, // Dynamic modal bg
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.textPrimary, // Dynamic title
                }}
              >
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 20,
              }}
            >
              {content.split("\n").map((line, index) => {
                if (line.startsWith("# ")) {
                  return (
                    <Text
                      key={index}
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: colors.textPrimary, // Dynamic H1
                        marginTop: index > 0 ? 24 : 0,
                        marginBottom: 12,
                      }}
                    >
                      {line.replace("# ", "")}
                    </Text>
                  );
                } else if (line.startsWith("## ")) {
                  return (
                    <Text
                      key={index}
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: colors.textPrimary, // Dynamic H2
                        marginTop: 20,
                        marginBottom: 8,
                      }}
                    >
                      {line.replace("## ", "")}
                    </Text>
                  );
                } else if (line.startsWith(" ") && line.endsWith(" ")) {
                  return (
                    <Text
                      key={index}
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: colors.textPrimary,
                        marginTop: 8,
                        marginBottom: 4,
                      }}
                    >
                      {line.replace(/\*\*/g, "")}
                    </Text>
                  );
                } else if (line.startsWith("- ")) {
                  return (
                    <Text
                      key={index}
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary, // Dynamic text
                        marginLeft: 16,
                        marginBottom: 4,
                        lineHeight: 20,
                      }}
                    >
                      • {line.replace("- ", "")}
                    </Text>
                  );
                } else if (line.trim()) {
                  return (
                    <Text
                      key={index}
                      style={{
                        fontSize: 14,
                        color: colors.textSecondary, // Dynamic text
                        marginBottom: 8,
                        lineHeight: 22,
                      }}
                    >
                      {line}
                    </Text>
                  );
                }
                return null;
              })}
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cardBg }}>
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
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background, // Dynamic button bg
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: colors.textPrimary,
          }}
        >
          Privacy
        </Text>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* App Permissions Section */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          >
            App Permissions
          </Text>
          <PermissionCard
            icon={Camera}
            title="Camera Access"
            enabled={cameraAccess}
            onToggle={setCameraAccess}
          />
          <PermissionCard
            icon={Mic}
            title="Microphone Access"
            enabled={microphoneAccess}
            onToggle={setMicrophoneAccess}
          />

          {/* Manage My Data Section */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            Manage My Data
          </Text>
          <ActionCard
            icon={Clock}
            title="Clear Recent Recipes"
            onPress={() => handleClearData("Recent Recipes")}
            iconColor="#FF9500"
          />
          <ActionCard
            icon={Bookmark}
            title="Clear Saved Recipes"
            onPress={() => handleClearData("Saved Recipes")}
            iconColor="#FF9500"
          />
          <ActionCard
            icon={ChefHat}
            title="Clear Cooking History"
            onPress={() => handleClearData("Cooking History")}
            iconColor="#FF9500"
          />

          {/* Account Data Section */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            Account Data
          </Text>
          <ActionCard
            icon={Trash2}
            title="Delete My Account"
            onPress={handleDeleteAccount}
            iconColor="#FF6B6B"
            textColor="#FF6B6B" // This will override the default primary text color
            showChevron={false}
          />

          {/* Legal Documents Section */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginTop: 24,
              marginBottom: 12,
            }}
          >
            Legal Documents
          </Text>
          <ActionCard
            icon={Shield}
            title="Privacy Policy"
            onPress={() => setShowPrivacyPolicy(true)}
            iconColor={colors.primary}
          />
          <ActionCard
            icon={FileText}
            title="Terms & Conditions"
            onPress={() => setShowTerms(true)}
            iconColor={colors.primary}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Modals */}
      <LegalModal
        visible={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        title="Privacy Policy"
        content={privacyPolicyContent}
      />

      <LegalModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms & Conditions"
        content={termsOfServiceContent}
      />
    </SafeAreaView>
  );
}
