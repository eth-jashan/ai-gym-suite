import Constants from 'expo-constants';

// API Configuration
// In development, use the local API server
// In production, use the production API URL
const getApiUrl = (): string => {
  const extra = Constants.expoConfig?.extra;

  if (extra?.apiUrl) {
    return extra.apiUrl;
  }

  // Default to local development API
  if (__DEV__) {
    // For Android emulator, use 10.0.2.2 instead of localhost
    // For iOS simulator, localhost works
    // For physical devices, use your computer's local IP
    return 'http://localhost:3001/api/v1';
  }

  // Production API URL - replace with your actual production URL
  return 'https://api.aigymsuite.com/api/v1';
};

export const API_URL = getApiUrl();

// App Configuration
export const APP_CONFIG = {
  appName: 'AI Gym Suite',
  version: '1.0.0',
  supportEmail: 'support@aigymsuite.com',
};

// Feature Flags
export const FEATURES = {
  enableAICoaching: true,
  enableSocialFeatures: false,
  enableWorkoutSharing: false,
};

// Timing Configuration
export const TIMING = {
  defaultRestTime: 60, // seconds
  animationDuration: 300, // ms
  debounceDelay: 300, // ms
};
