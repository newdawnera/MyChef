// components/HelpSupportModal.tsx
/**
 * Help & Support Modal
 *
 * Keyboard-aware modal for user support requests
 * - Auto-captures user info & device details
 * - Saves to Firestore /support-tickets
 * - Shows success confirmation
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X, Send } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as Device from "expo-device";
import Constants from "expo-constants";

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

// Helper function to generate the HTML with data filled in
const generateSupportEmailHtml = (data: any) => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Support Ticket - MyChef</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #70AD47 0%, #5a8c39 100%); color: #ffffff; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header .icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 30px 20px; }
    .ticket-id { background-color: #f8f9fa; border-left: 4px solid #70AD47; padding: 12px 16px; margin-bottom: 20px; font-family: monospace; font-size: 14px; color: #666; }
    .info-section { margin-bottom: 25px; }
    .info-section h3 { color: #70AD47; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #70AD47; padding-bottom: 5px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eeeeee; }
    .info-label { font-weight: 600; color: #555555; min-width: 140px; }
    .info-value { color: #333333; flex: 1; }
    .message-box { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF6B6B; }
    .message-box h3 { margin-top: 0; color: #FF6B6B; font-size: 16px; }
    .message-text { color: #333333; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999999; }
    .action-button { display: inline-block; background-color: #70AD47; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🆘</div>
      <h1>New Support Ticket</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">MyChef App</p>
    </div>
    <div class="content">
      <div class="ticket-id"><strong>Ticket ID:</strong> ${data.ticketId}</div>
      
      <div class="info-section">
        <h3>👤 User Information</h3>
        <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${data.userName}</div></div>
        <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${data.userEmail}</div></div>
        <div class="info-row"><div class="info-label">User ID:</div><div class="info-value">${data.userId}</div></div>
      </div>

      <div class="message-box">
        <h3>📝 User's Message</h3>
        <div class="message-text">${data.message}</div>
      </div>

      <div class="info-section">
        <h3>📱 Device Information</h3>
        <div class="info-row"><div class="info-label">Device:</div><div class="info-value">${data.deviceBrand} ${data.deviceModel}</div></div>
        <div class="info-row"><div class="info-label">Operating System:</div><div class="info-value">${data.deviceOS}</div></div>
        <div class="info-row"><div class="info-label">Platform:</div><div class="info-value">${data.platform}</div></div>
        <div class="info-row"><div class="info-label">App Version:</div><div class="info-value">${data.appVersion}</div></div>
        <div class="info-row"><div class="info-label">Submitted:</div><div class="info-value">${data.timestamp}</div></div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://console.firebase.google.com" class="action-button">View in Firebase Console</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">This is an automated message from MyChef App</p>
      <p style="margin: 5px 0 0 0;">Please respond to ${data.userEmail} within 2 hours</p>
    </div>
  </div>
</body>
</html>`;
};

export function HelpSupportModal({
  visible,
  onClose,
  userName = "",
  userEmail = "",
}: HelpSupportModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(
        "Message Required",
        "Please enter your message or complaint."
      );
      return;
    }

    setSubmitting(true);

    try {
      // Generate ticket ID
      const ticketId = `ticket_${Date.now()}`;

      // Auto-capture device info
      const deviceInfo = {
        brand: Device.brand || "Unknown",
        manufacturer: Device.manufacturer,
        modelName: Device.modelName || "Unknown",
        osName: Device.osName || "Unknown",
        osVersion: Device.osVersion || "",
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || "1.0.0",
      };

      const emailData = {
        ticketId,
        userName: userName || "Anonymous User",
        userEmail: userEmail || user?.email || "No email provided",
        userId: user?.uid || "anonymous",
        message: message.trim(),
        deviceBrand: deviceInfo.brand,
        deviceModel: deviceInfo.modelName,
        deviceOS: `${deviceInfo.osName} ${deviceInfo.osVersion}`,
        platform: deviceInfo.platform,
        appVersion: deviceInfo.appVersion,
        timestamp: new Date().toLocaleString(),
      };

      // 1. Generate the HTML string with the data filled in
      const emailHtml = generateSupportEmailHtml(emailData);

      // 2. Save to Firestore /support-tickets
      await setDoc(doc(db, "support-tickets", ticketId), {
        ...emailData,
        deviceInfo,
        status: "open",
        createdAt: serverTimestamp(),
      });

      // 3. Send email via 'mail' collection (SMTP)
      // IMPORTANT: We send the HTML directly here.
      await setDoc(doc(db, "mail", `support-${ticketId}`), {
        to: "hillsprocv@gmail.com",
        message: {
          subject: `Support Ticket: ${ticketId} - ${emailData.userName}`,
          html: emailHtml, // The pre-filled HTML template
          text: `New support ticket from ${emailData.userName}: ${emailData.message}`, // Fallback
          attachments: [], // REQUIRED: Fixes the "undefined reading attachments" error
        },
      });

      // Success
      Alert.alert(
        "Message Sent! ✓",
        "We usually respond within 2 hours. Thank you for your feedback!",
        [
          {
            text: "OK",
            onPress: () => {
              setMessage("");
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Failed to submit support ticket:", error);
      Alert.alert(
        "Error",
        "Failed to send message. Please try again or contact support@mychef.com"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        enabled={Platform.OS === "ios"}
        behavior="padding"
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
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "80%",
              paddingTop: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Help & Support
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.cardBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 20,
              }}
            >
              {/* Info Text */}
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                Have a question or complaint? We&apos;re here to help! Send us a
                message and we&apos;ll get back to you within 2 hours.
              </Text>

              {/* Message Input */}
              <View
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your issue or feedback..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  style={{
                    color: colors.textPrimary,
                    fontSize: 15,
                    minHeight: 120,
                  }}
                />
              </View>

              {/* User Info Display */}
              <View
                style={{
                  backgroundColor: `${colors.primary}10`,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  Your contact info:
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textPrimary,
                    fontWeight: "600",
                  }}
                >
                  {userName || "Anonymous User"}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                  }}
                >
                  {userEmail || "No email provided"}
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting || !message.trim()}
                style={{
                  backgroundColor:
                    submitting || !message.trim()
                      ? colors.textSecondary
                      : colors.primary,
                  paddingVertical: 16,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFFFFF" />
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      Send Message
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
