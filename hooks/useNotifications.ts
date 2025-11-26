// hooks/useNotifications.ts
/**
 * Daily Notification Hook
 *
 * Simple local notifications at 10 AM daily
 * - Works offline (no internet needed)
 * - Device local timezone
 * - 20 rotating messages
 * - AsyncStorage for preferences
 */

import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Alert } from "react-native";

const NOTIFICATIONS_KEY = "@mychef_notifications_enabled";
const NOTIFICATION_ID_KEY = "@mychef_notification_id";

// 20 rotating motivational messages
const DAILY_MESSAGES = [
  "What are you cooking today, {userName}?",
  "Time to create something delicious! 👨‍🍳",
  "Your kitchen is calling, {userName}! 🍳",
  "Ready to cook up something amazing?",
  "Let's make today delicious, {userName}!",
  "What's on the menu today?",
  "Time to put those chef skills to work! 🔥",
  "Your next great meal awaits, {userName}!",
  "Hungry for a new recipe?",
  "Let's cook something special today!",
  "Time to turn up the heat in the kitchen! 🍲",
  "What culinary adventure awaits you today?",
  "Your kitchen misses you, {userName}! 👨‍🍳",
  "Ready to whip up something tasty?",
  "Time to create kitchen magic! ✨",
  "What's cooking, {userName}?",
  "Let's make today a flavorful one!",
  "Your next delicious creation starts now! 🍽️",
  "Time to explore new flavors!",
  "Ready to cook up a storm, {userName}?",
];

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,

    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(userName: string = "Chef") {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved preference
  useEffect(() => {
    loadPreference();
  }, []);

  // Schedule/cancel when enabled changes
  useEffect(() => {
    if (!loading) {
      if (enabled) {
        scheduleDailyNotification(userName);
      } else {
        cancelDailyNotification();
      }
    }
  }, [enabled, userName, loading]);

  const loadPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      setEnabled(saved === "true");
    } catch (error) {
      console.error("Failed to load notification preference:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    try {
      // Request permissions if enabling
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive daily cooking reminders.",
            [{ text: "OK" }]
          );
          return false;
        }
      }

      // Save preference
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, value.toString());
      setEnabled(value);

      // Show feedback alert
      if (value) {
        Alert.alert(
          "🔔 Notifications Enabled!",
          "You will receive a daily reminder at 10 AM with motivational cooking messages like:\n\n" +
            '• "What are you cooking today?"\n' +
            '• "Time to create something delicious!"\n' +
            '• "Your kitchen is calling!"\n\n' +
            "And 17 more inspiring messages!",
          [{ text: "Got it!" }]
        );
      } else {
        Alert.alert(
          "🔕 Notifications Disabled",
          "You will no longer receive daily cooking reminders at 10 AM.",
          [{ text: "OK" }]
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
      return false;
    }
  };

  const scheduleDailyNotification = async (userName: string) => {
    try {
      // CRITICAL FIX: Cancel ALL scheduled notifications first to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("🧹 Cleared all scheduled notifications");

      // Get random message
      const randomIndex = Math.floor(Math.random() * DAILY_MESSAGES.length);
      const message = DAILY_MESSAGES[randomIndex].replace(
        "{userName}",
        userName
      );

      // Schedule for 10 AM daily (ONLY ONE)
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "MyChef 👨‍🍳",
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: "calendar",
          hour: 10,
          minute: 0,
          repeats: true,
        } as Notifications.CalendarTriggerInput,
      });

      // Save notification ID
      await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);
      console.log("✅ Single daily notification scheduled for 7 AM");
    } catch (error) {
      console.error("Failed to schedule notification:", error);
    }
  };

  const cancelDailyNotification = async () => {
    try {
      // Cancel ALL scheduled notifications to prevent duplicates
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
      console.log("✅ All notifications cancelled");
    } catch (error) {
      console.error("Failed to cancel notification:", error);
    }
  };

  return {
    enabled,
    loading,
    toggleNotifications,
  };
}
