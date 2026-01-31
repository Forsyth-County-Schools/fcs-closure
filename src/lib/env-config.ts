// Environment variable validation utilities

export interface EnvConfig {
  // API Keys
  weatherApiKey: string;
  resendApiKey: string;
  vonageApiKey?: string;
  vonageApiSecret?: string;
  
  // Notification settings
  notificationEmail?: string;
  notificationPhone?: string;
  fromEmail?: string;
  fromNumber?: string;
  
  // App settings
  nodeEnv: string;
  maxResponseSize: string;
  
  // URLs
  baseUrl: string;
}

// Required environment variables
const REQUIRED_VARS: (keyof EnvConfig)[] = [
  'weatherApiKey',
  'resendApiKey',
  'nodeEnv'
];

// Optional environment variables with defaults
const OPTIONAL_VARS: Partial<EnvConfig> = {
  maxResponseSize: '1000000',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:3000',
  fromEmail: 'noreply@fcs-status.com'
};

// Validate environment variables
export function validateEnv(): EnvConfig {
  const config: Partial<EnvConfig> = {};
  
  // Check required variables
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName.toUpperCase()];
    if (!value) {
      throw new Error(`Missing required environment variable: ${varName.toUpperCase()}`);
    }
    (config as Record<string, string>)[varName] = value;
  }
  
  // Add optional variables with defaults
  for (const [key, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    const envValue = process.env[key.toUpperCase()];
    (config as Record<string, string>)[key] = envValue || defaultValue;
  }
  
  // Add other optional variables
  const optionalEnvVars: (keyof EnvConfig)[] = [
    'vonageApiKey', 'vonageApiSecret',
    'notificationEmail', 'notificationPhone', 'fromNumber'
  ];
  
  for (const varName of optionalEnvVars) {
    const envValue = process.env[varName.toUpperCase()];
    if (envValue) {
      (config as Record<string, string>)[varName] = envValue;
    }
  }
  
  // Type assertion since we've validated all required fields
  return config as EnvConfig;
}

// Get validated environment config (throws if invalid)
let _envConfig: EnvConfig | null = null;
export function getEnvConfig(): EnvConfig {
  if (!_envConfig) {
    _envConfig = validateEnv();
  }
  return _envConfig;
}

// Check if a feature is enabled based on environment variables
export function isFeatureEnabled(feature: 'sms' | 'email' | 'notifications'): boolean {
  const config = getEnvConfig();
  
  switch (feature) {
    case 'sms':
      return !!(config.vonageApiKey && config.vonageApiSecret && config.notificationPhone);
    case 'email':
      return !!(config.resendApiKey && config.notificationEmail);
    case 'notifications':
      return true; // Browser notifications are always available
    default:
      return false;
  }
}

// Get feature status for UI display
export function getFeatureStatus() {
  return {
    sms: isFeatureEnabled('sms'),
    email: isFeatureEnabled('email'),
    notifications: isFeatureEnabled('notifications')
  };
}

// Validate environment on import
try {
  getEnvConfig();
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Environment variable validation failed:', error);
  // Don't throw in production to allow the app to start with limited functionality
  if (process.env.NODE_ENV === 'development') {
    throw error;
  }
}
