import "dotenv/config"; // Ensures .env is loaded

export default {
  expo: {
    name: "mychef",
    slug: "mychef",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mychef",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mychef2.app",
      googleServicesFile: "GoogleService-Info.plist",
    },
    android: {
      package: "com.mychef2.app",
      googleServicesFile: "google-services.json",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#70AD47",
          sounds: [],
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          // Now you can use the variable from your .env file
          iosUrlScheme: process.env.IOS_URL_SCHEME,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "be666447-482c-4c66-9752-c5ddda05e865",
      },
    },
  },
};
