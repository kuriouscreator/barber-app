/**
 * Expo app configuration
 * Uses app.config.js instead of app.json to properly load environment variables
 */

module.exports = {
  expo: {
    name: 'barber-app',
    slug: 'barber-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'barbercuts',
    experiments: {
      typedRoutes: false,
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourco.barbercuts',
      associatedDomains: ['applinks:yourdomain.com'],
      infoPlist: {
        NSCalendarsUsageDescription: 'This app needs access to your calendar to add appointment reminders.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.yourco.barbercuts',
      permissions: [
        'READ_CALENDAR',
        'WRITE_CALENDAR',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'barbercuts',
              host: 'auth',
              pathPrefix: '/callback',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      // Properly load environment variables (not as strings!)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      // Also expose for EAS Build
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
    plugins: ['expo-web-browser'],
  },
};
