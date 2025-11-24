// app/privacy/index.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ArrowLeft,
  Clock,
  Bookmark,
  ChefHat,
  Trash2,
  FileText,
  Shield,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase Imports
import { deleteUser, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SessionManager } from "@/lib/sessionManager";
import { useAuth } from "@/hooks/useAuth";
import { useRecentRecipes } from "@/hooks/useRecentRecipes"; // Import this hook

// --- TYPES ---
type DataCleanupType =
  | "Recently Viewed Recipes"
  | "Saved Recipes"
  | "Cooking History";

// --- CONSTANTS ---
const RECENT_RECIPES_KEY = "@mychef_recent_recipes";
const SAVED_RECIPES_KEY = "@mychef_saved_recipes";

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
  const { colors, theme } = useTheme();
  const { user } = useAuth();

  // Hook to manage recent recipes state
  // We cast as any to safely handle optional clear method if it exists in your context
  const { clearRecentRecipes } = useRecentRecipes() as any;

  // UI State
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- DATA MANAGEMENT HANDLERS ---

  const handleClearData = (type: DataCleanupType) => {
    Alert.alert(
      `Clear ${type}?`,
      `This action will permanently remove all ${type.toLowerCase()}. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => executeClearData(type),
        },
      ]
    );
  };

  const executeClearData = async (type: DataCleanupType) => {
    if (!user) return;
    setIsProcessing(true);

    try {
      // Create a write batch for atomic updates (all or nothing)
      const batch = writeBatch(db);

      if (type === "Recently Viewed Recipes") {
        // 1. Clear Local Storage (Primary source for recent recipes)
        await AsyncStorage.removeItem(RECENT_RECIPES_KEY);

        // 2. Update Context to reflect on Home Page immediately
        if (clearRecentRecipes) {
          clearRecentRecipes();
        }
      } else if (type === "Saved Recipes") {
        // 1. Clear Firestore Subcollection
        const savedRef = collection(db, "users", user.uid, "savedRecipes");
        const snapshot = await getDocs(savedRef);

        snapshot.docs.forEach((doc) => batch.delete(doc.ref));

        if (!snapshot.empty) {
          await batch.commit();
        }

        // 2. Clear Local Cache
        await AsyncStorage.removeItem(SAVED_RECIPES_KEY);
      } else if (type === "Cooking History") {
        // OPTION A: "Unmark" items as cooked without deleting the bookmark.

        const savedRef = collection(db, "users", user.uid, "savedRecipes");
        const cookedQuery = query(savedRef, where("isCooked", "==", true));
        const snapshot = await getDocs(cookedQuery);

        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            isCooked: false,
            cookedAt: null,
            notes: null,
          });
        });

        if (!snapshot.empty) {
          await batch.commit();
        }
      }

      Alert.alert("Success", `${type} cleared successfully`);
    } catch (error) {
      console.error(`Failed to clear ${type}:`, error);
      Alert.alert("Error", `Failed to clear ${type}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DELETE ACCOUNT HANDLERS ---

  const confirmDeleteAccount = () => {
    // Step 1: Confirmation Alert
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: () => {
            // Step 2: Start Countdown
            setDeleteCountdown(10);
            setShowDeleteModal(true);
          },
        },
      ]
    );
  };

  // Effect to handle the countdown timer
  useEffect(() => {
    if (showDeleteModal && deleteCountdown > 0) {
      timerRef.current = setTimeout(() => {
        setDeleteCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showDeleteModal && deleteCountdown === 0) {
      // Timer finished -> Execute Delete automatically
      executeDeleteAccount();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showDeleteModal, deleteCountdown]);

  const abortDeleteAccount = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowDeleteModal(false);
    setDeleteCountdown(10); // Reset for next time
  };

  const executeDeleteAccount = async () => {
    if (!user) return;
    setIsProcessing(true);
    setShowDeleteModal(false); // Close modal to show global loading spinner

    try {
      console.log("⚠️ STARTING ACCOUNT DELETION...");

      // 1. Delete User Data from Firestore

      const savedRef = collection(db, "users", user.uid, "savedRecipes");
      const savedSnap = await getDocs(savedRef);
      const batch = writeBatch(db);

      // Queue deletion of saved recipes
      savedSnap.docs.forEach((doc) => batch.delete(doc.ref));

      // Queue deletion of main user preferences document
      const prefsRef = doc(
        db,
        "users",
        user.uid,
        "preferences",
        "userPreferences"
      );
      batch.delete(prefsRef);

      // Queue deletion of the main user document
      const userDocRef = doc(db, "users", user.uid);
      batch.delete(userDocRef);

      // Commit all deletions
      await batch.commit();

      // 2. Clear Local Session & Cache
      await SessionManager.clearSession();
      await AsyncStorage.clear(); // Completely wipe app data

      // 3. Delete Auth Account
      await deleteUser(user);

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted. We are sorry to see you go.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
    } catch (error: any) {
      console.error("Delete account failed:", error);
      setIsProcessing(false);

      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Security Check Required",
          "For security reasons, please log out and log back in before deleting your account.",
          [
            {
              text: "OK",
              onPress: () => {
                signOut(auth);
                router.replace("/login");
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to delete account. Please try again.");
      }
    }
  };

  // --- COMPONENTS ---

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
      disabled={isProcessing}
      style={{
        backgroundColor: colors.cardBg,
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
        borderColor: colors.border,
        opacity: isProcessing ? 0.5 : 1,
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
              backgroundColor: colors.cardBg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            {/* Modal Header */}
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
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
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
                        color: colors.textPrimary,
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
                        color: colors.textPrimary,
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
                        color: colors.textSecondary,
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
                        color: colors.textSecondary,
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

            {/* Modal Footer */}
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
          {/* Manage My Data Section */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          >
            Manage My Data
          </Text>
          <ActionCard
            icon={Clock}
            title="Clear Recently Viewed Recipes"
            onPress={() => handleClearData("Recently Viewed Recipes")}
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
            onPress={confirmDeleteAccount}
            iconColor="#FF6B6B"
            textColor="#FF6B6B"
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

      {/* Loading Overlay */}
      {isProcessing && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", marginTop: 12, fontWeight: "600" }}>
            Processing...
          </Text>
        </View>
      )}

      {/* Delete Account Countdown Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={abortDeleteAccount}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 24,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: `${colors.error || "#FF6B6B"}15`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={32} color={colors.error || "#FF6B6B"} />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: colors.textPrimary,
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Delete Account?
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 24,
                lineHeight: 22,
              }}
            >
              This action is irreversible. All your data will be lost forever.
            </Text>

            {/* Countdown Circle */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 4,
                borderColor: colors.error || "#FF6B6B",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: colors.error || "#FF6B6B",
                }}
              >
                {deleteCountdown}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 24,
                fontStyle: "italic",
              }}
            >
              Deleting in {deleteCountdown} seconds...
            </Text>

            <TouchableOpacity
              onPress={abortDeleteAccount}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 16,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                Abort & Keep Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Legal Modals */}
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
