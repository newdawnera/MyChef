// lib/sessionManager.ts
/**
 * Session Management Utility
 *
 * Handles automatic session expiration for enhanced security.
 * Tracks user activity and enforces session timeouts.
 *
 * SECURITY RATIONALE (for MSc documentation):
 * - Prevents unauthorized access if device is lost/stolen
 * - Follows OWASP Mobile Security guidelines
 * - Balances security with user convenience
 * - Industry standard: 15-30 minutes for sensitive apps, 24 hours for casual apps
 *
 * SESSION LIFECYCLE:
 * 1. User logs in → session starts, timestamp saved
 * 2. User uses app → timestamp updated
 * 3. User closes app → timestamp remains
 * 4. User reopens app → check if timestamp is within timeout period
 *    - Within timeout → auto-login (session valid)
 *    - Exceeded timeout → force re-login (session expired)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const LAST_ACTIVITY_KEY = "@mychef_last_activity";
const SESSION_TIMEOUT_KEY = "@mychef_session_timeout";

/**
 * Session timeout duration in milliseconds
 *
 * For MSc project, you can adjust this based on security requirements:
 * - High security (banking apps): 5-15 minutes (300000 - 900000 ms)
 * - Medium security (social apps): 30 minutes - 1 hour (1800000 - 3600000 ms)
 * - Low security (content apps): 24 hours - 7 days (86400000 - 604800000 ms)
 *
 * Current setting: 30 minutes (good balance for a cooking app)
 */
const DEFAULT_SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export class SessionManager {
  /**
   * Update the last activity timestamp to the current time
   * Call this whenever the user interacts with the app
   */
  static async updateActivity(): Promise<void> {
    try {
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem(LAST_ACTIVITY_KEY, timestamp);
    } catch (error) {
      console.error("Failed to update activity timestamp:", error);
    }
  }

  /**
   * Get the last activity timestamp
   * Returns null if no activity has been recorded
   */
  static async getLastActivity(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      console.error("Failed to get last activity timestamp:", error);
      return null;
    }
  }

  /**
   * Check if the current session is still valid
   *
   * @returns true if session is valid, false if expired
   */
  static async isSessionValid(): Promise<boolean> {
    try {
      const lastActivity = await this.getLastActivity();

      // If no activity recorded, session is invalid
      if (!lastActivity) {
        return false;
      }

      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivity;
      const timeout = await this.getSessionTimeout();

      // Session is valid if time since last activity is less than timeout
      return timeSinceLastActivity < timeout;
    } catch (error) {
      console.error("Failed to check session validity:", error);
      // On error, assume session is invalid for security
      return false;
    }
  }

  /**
   * Get the session timeout duration
   * Can be customized per user if needed (e.g., "Remember me" feature)
   */
  static async getSessionTimeout(): Promise<number> {
    try {
      const timeout = await AsyncStorage.getItem(SESSION_TIMEOUT_KEY);
      return timeout ? parseInt(timeout, 10) : DEFAULT_SESSION_TIMEOUT;
    } catch (error) {
      console.error("Failed to get session timeout:", error);
      return DEFAULT_SESSION_TIMEOUT;
    }
  }

  /**
   * Set a custom session timeout duration
   * Useful for implementing "Remember me" or security settings
   *
   * @param timeoutMs Timeout duration in milliseconds
   */
  static async setSessionTimeout(timeoutMs: number): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_TIMEOUT_KEY, timeoutMs.toString());
    } catch (error) {
      console.error("Failed to set session timeout:", error);
    }
  }

  /**
   * Clear all session data
   * Call this when user logs out
   */
  static async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([LAST_ACTIVITY_KEY, SESSION_TIMEOUT_KEY]);
    } catch (error) {
      console.error("Failed to clear session data:", error);
    }
  }

  /**
   * Get time remaining until session expires
   * Useful for showing warnings like "Session expires in 5 minutes"
   *
   * @returns milliseconds until expiration, or 0 if already expired
   */
  static async getTimeUntilExpiration(): Promise<number> {
    try {
      const lastActivity = await this.getLastActivity();
      if (!lastActivity) {
        return 0;
      }

      const timeout = await this.getSessionTimeout();
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivity;
      const timeRemaining = timeout - timeSinceLastActivity;

      return Math.max(0, timeRemaining);
    } catch (error) {
      console.error("Failed to get time until expiration:", error);
      return 0;
    }
  }

  /**
   * Format time remaining in a human-readable format
   * E.g., "15 minutes" or "2 hours"
   */
  static async getFormattedTimeRemaining(): Promise<string> {
    const timeRemaining = await this.getTimeUntilExpiration();

    if (timeRemaining === 0) {
      return "Session expired";
    }

    const minutes = Math.floor(timeRemaining / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
      return "Less than a minute";
    }
  }
}
