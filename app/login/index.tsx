// app/login/index.tsx
/**
 * Login/Signup Screen with Fully Functional Google Sign-In
 *
 * PRODUCTION READY - Properly styled Google button with correct branding
 */

import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, User, ChefHat } from "lucide-react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "@/contexts/AuthContext";
import Svg, { Path } from "react-native-svg";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Google Logo SVG Component
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <Path fill="none" d="M0 0h48v48H0z" />
  </Svg>
);

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("LoginScreen must be used within AuthProvider");
  }

  const {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    sendPasswordReset,
    isGoogleSignInAvailable,
  } = authContext;

  // Animation refs
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateX = useRef(new Animated.Value(0)).current;
  const googleButtonScale = useRef(new Animated.Value(1)).current;

  const router = useRouter();

  // Logo breathing animation
  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, []);

  // Form transition animation
  useEffect(() => {
    const exitDirection = isLogin ? 300 : -300;
    const enterDirection = isLogin ? -300 : 300;

    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateX, {
        toValue: exitDirection,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      formTranslateX.setValue(enterDirection);

      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
      ]).start();
    });
  }, [isLogin]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please login instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      default:
        return `Authentication error: ${errorCode}`;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Required Field", "Please enter your password.");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert("Required Field", "Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        console.log("🔐 Attempting email login...");
        await signInWithEmail(email.trim(), password);
        console.log("✅ Email login successful");
      } else {
        console.log("📝 Attempting signup...");
        await signUpWithEmail(email.trim(), password, name.trim());

        Alert.alert(
          "✅ Account Created!",
          `A verification email has been sent to ${email}.\n\nPlease verify your email before logging in.`,
          [
            {
              text: "OK",
              onPress: () => {
                setIsLogin(true);
                setPassword("");
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Navigate to main app
      console.log("🚀 Navigating to main app...");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("❌ Email auth error:", error);
      const errorMessage = getErrorMessage(error.code || error.message);
      Alert.alert(isLogin ? "Login Failed" : "Sign Up Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign-In
   * Fully functional with proper error handling
   */
  const handleGoogleSignIn = async () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(googleButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(googleButtonScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if Google Sign-In is available
    if (!isGoogleSignInAvailable) {
      Alert.alert(
        "Google Sign-In Not Available",
        "Google Sign-In is not properly configured. Please contact support or use email/password to sign in.",
        [{ text: "OK" }]
      );
      return;
    }

    setGoogleLoading(true);

    try {
      console.log("🔵 Starting Google Sign-In flow...");

      // Call Google Sign-In
      await signInWithGoogle();

      console.log("✅ Google Sign-In successful!");

      // Navigate to main app
      console.log("🚀 Navigating to main app...");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("❌ Google Sign-In error:", error);

      // Friendly error messages
      let title = "Google Sign-In Failed";
      let message = "An unexpected error occurred. Please try again.";

      if (
        error.message?.includes("cancelled") ||
        error.message?.includes("SIGN_IN_CANCELLED")
      ) {
        // User cancelled - don't show error
        console.log("ℹ️ User cancelled Google Sign-In");
        setGoogleLoading(false);
        return;
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("Network")
      ) {
        message =
          "Network error. Please check your internet connection and try again.";
      } else if (error.message?.includes("PLAY_SERVICES_NOT_AVAILABLE")) {
        title = "Google Play Services Required";
        message = "Please update Google Play Services to use Google Sign-In.";
      } else if (error.message?.includes("DEVELOPER_ERROR")) {
        message = "Configuration error. Please contact support.";
      } else if (
        error.message?.includes("in progress") ||
        error.message?.includes("IN_PROGRESS")
      ) {
        message = "A sign-in attempt is already in progress. Please wait.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert(title, message, [{ text: "OK" }]);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleTabSwitch = (loginMode: boolean) => {
    if (loading || googleLoading) return;
    setIsLogin(loginMode);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert("Email Required", "Please enter your email address.");
      return;
    }

    if (!validateEmail(resetEmail.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(resetEmail.trim());

      Alert.alert(
        "✅ Reset Email Sent",
        `A password reset link has been sent to ${resetEmail}.\n\nPlease check your email and follow the instructions.`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowForgotPassword(false);
              setResetEmail("");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Password reset error:", error);
      let errorMessage = "Failed to send reset email. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }

      Alert.alert("Reset Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            minHeight: SCREEN_HEIGHT - 100,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title */}
          <View
            style={{ alignItems: "center", marginTop: 32, marginBottom: 32 }}
          >
            <Animated.View
              style={{
                width: 64,
                height: 64,
                marginBottom: 12,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: logoScaleAnim }],
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "white",
                  shadowColor: "#4CAF50",
                  shadowOpacity: 0.7,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 25,
                  elevation: 8,
                  position: "absolute",
                }}
              />
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  overflow: "hidden",
                  position: "absolute",
                }}
              >
                <ChefHat size={32} color="#4CAF50" strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1A1A1A",
                marginBottom: 8,
              }}
            >
              MyChef
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Your AI-powered cooking companion
            </Text>
          </View>

          {/* Toggle Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 4,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => handleTabSwitch(true)}
              activeOpacity={0.8}
              disabled={loading || googleLoading}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isLogin ? "#4CAF50" : "transparent",
                shadowColor: isLogin ? "#4CAF50" : "transparent",
                shadowOpacity: isLogin ? 0.3 : 0,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: isLogin ? 4 : 0,
                opacity: loading || googleLoading ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isLogin ? "#FFFFFF" : "#6B7280",
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTabSwitch(false)}
              activeOpacity={0.8}
              disabled={loading || googleLoading}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: !isLogin ? "#4CAF50" : "transparent",
                shadowColor: !isLogin ? "#4CAF50" : "transparent",
                shadowOpacity: !isLogin ? 0.3 : 0,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: !isLogin ? 4 : 0,
                opacity: loading || googleLoading ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: !isLogin ? "#FFFFFF" : "#6B7280",
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateX: formTranslateX }],
            }}
          >
            {/* Name Field - Only for Sign Up */}
            {!isLogin && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "400",
                    color: "#1A1A1A",
                    marginBottom: 8,
                  }}
                >
                  Name
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                  }}
                >
                  <User size={20} color="#6B7280" style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    editable={!loading && !googleLoading}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: "#1A1A1A",
                      padding: 0,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#1A1A1A",
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <Mail size={20} color="#6B7280" style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading && !googleLoading}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1A1A1A",
                    padding: 0,
                  }}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#1A1A1A",
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <Lock size={20} color="#6B7280" style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoComplete={isLogin ? "password" : "password-new"}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading && !googleLoading}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1A1A1A",
                    padding: 0,
                  }}
                />
              </View>
              {!isLogin && (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    marginTop: 4,
                    marginLeft: 4,
                  }}
                >
                  Minimum 6 characters
                </Text>
              )}
            </View>

            {/* Forgot Password - Only for Login */}
            {isLogin && (
              <View style={{ alignItems: "flex-end", marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={() => {
                    setResetEmail(email);
                    setShowForgotPassword(true);
                  }}
                  activeOpacity={0.7}
                  disabled={loading || googleLoading}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: loading || googleLoading ? "#9CA3AF" : "#4CAF50",
                      fontWeight: "400",
                    }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor:
                  loading || googleLoading ? "#9CA3AF" : "#4CAF50",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: loading || googleLoading ? "#9CA3AF" : "#4CAF50",
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 8,
                flexDirection: "row",
                marginBottom: 24,
              }}
              onPress={handleSubmit}
              activeOpacity={0.9}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                    }}
                  >
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {isLogin ? "Login" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* OR Divider */}
            {/*<View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "#E5E7EB",
                }}
              />
              <Text
                style={{
                  marginHorizontal: 16,
                  fontSize: 14,
                  color: "#6B7280",
                  fontWeight: "500",
                }}
              >
                OR
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: "#E5E7EB",
                }}
              />
            </View>*/}

            {/* Google Sign-In Button - PRODUCTION READY */}
            {/*<Animated.View
              style={{ transform: [{ scale: googleButtonScale }] }}
            >
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: "#E5E7EB",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                  opacity: loading || googleLoading ? 0.6 : 1,
                }}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#4285F4" />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#5F6368",
                        marginLeft: 12,
                      }}
                    >
                      Signing in...
                    </Text>
                  </>
                ) : (
                  <>
                    <GoogleLogo size={20} />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#3C4043",
                        marginLeft: 12,
                      }}
                    >
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>*/}

            {/* Helper Text for Google Sign-In */}
            {/*{!isGoogleSignInAvailable && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#EF4444",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                ⚠️ Google Sign-In configuration incomplete
              </Text>
            )}*/}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#1A1A1A",
                marginBottom: 8,
              }}
            >
              Reset Password
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "#6B7280",
                marginBottom: 24,
                lineHeight: 22,
              }}
            >
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </Text>

            {/* Email Input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                marginBottom: 24,
              }}
            >
              <Mail size={20} color="#6B7280" />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={resetEmail}
                onChangeText={setResetEmail}
                editable={!loading}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: "#1A1A1A",
                  padding: 0,
                }}
              />
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#6B7280",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: loading ? "#9CA3AF" : "#4CAF50",
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#FFFFFF",
                    }}
                  >
                    Send Link
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
