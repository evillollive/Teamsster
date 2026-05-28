import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.teamsster.app",
  appName: "Teamsster",
  webDir: "apps/web/out",
  server: {
    // In development, proxy to the Next.js dev server
    url: process.env.CAPACITOR_DEV_URL ?? undefined,
    cleartext: process.env.NODE_ENV !== "production",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0284c7",
      showSpinner: false,
    },
  },
  ios: {
    scheme: "Teamsster",
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#ffffff",
  },
};

export default config;
