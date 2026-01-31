// Vercel Blob Storage Service for FCS Monitoring

import { put } from '@vercel/blob';

// Store status history screenshots
export async function storeStatusScreenshot(
  imageData: ArrayBuffer | string, 
  timestamp: number
): Promise<{ url: string; filename: string }> {
  try {
    const filename = `status-screenshot-${timestamp}.png`;
    const { url } = await put(filename, imageData, { 
      access: 'public' 
    });
    
    console.log('✅ Status screenshot stored:', url);
    return { url, filename };
  } catch (error) {
    console.error('❌ Failed to store screenshot:', error);
    throw error;
  }
}

// Store alert logs (SMS, Email, Desktop notifications)
export async function storeAlertLog(
  alerts: Array<{
    type: 'sms' | 'email' | 'desktop';
    message: string;
    timestamp: Date;
    success: boolean;
    weatherData?: Record<string, unknown>;
  }>,
  date: string
): Promise<{ url: string; filename: string }> {
  try {
    const filename = `alert-log-${date}.json`;
    const logData = JSON.stringify(alerts, null, 2);
    
    const { url } = await put(filename, logData, { 
      access: 'public' 
    });
    
    console.log('✅ Alert log stored:', url);
    return { url, filename };
  } catch (error) {
    console.error('❌ Failed to store alert log:', error);
    throw error;
  }
}

// Store weather data for historical analysis
export async function storeWeatherData(
  weatherData: Record<string, unknown>,
  timestamp: number
): Promise<{ url: string; filename: string }> {
  try {
    const filename = `weather-data-${timestamp}.json`;
    const dataWithTimestamp = {
      ...weatherData,
      timestamp: new Date(timestamp).toISOString(),
      location: 'Forsyth County, GA (30041)'
    };
    
    const { url } = await put(filename, JSON.stringify(dataWithTimestamp, null, 2), { 
      access: 'public' 
    });
    
    console.log('✅ Weather data stored:', url);
    return { url, filename };
  } catch (error) {
    console.error('❌ Failed to store weather data:', error);
    throw error;
  }
}

// Store system status reports
export async function storeStatusReport(
  report: {
    schoolStatus: Record<string, unknown>;
    weatherData: Record<string, unknown>;
    alertsSent: Record<string, unknown>[];
    systemHealth: Record<string, unknown>;
    timestamp: number;
  }
): Promise<{ url: string; filename: string }> {
  try {
    const filename = `status-report-${report.timestamp}.json`;
    const reportData = JSON.stringify(report, null, 2);
    
    const { url } = await put(filename, reportData, { 
      access: 'public' 
    });
    
    console.log('✅ Status report stored:', url);
    return { url, filename };
  } catch (error) {
    console.error('❌ Failed to store status report:', error);
    throw error;
  }
}

// Store user notification preferences
export async function storeUserPreferences(
  userId: string,
  preferences: {
    smsEnabled: boolean;
    emailEnabled: boolean;
    desktopEnabled: boolean;
    phoneNumber?: string;
    email?: string;
  }
): Promise<{ url: string; filename: string }> {
  try {
    const filename = `user-${userId}-preferences.json`;
    const preferencesData = JSON.stringify({
      ...preferences,
      updatedAt: new Date().toISOString()
    }, null, 2);
    
    const { url } = await put(filename, preferencesData, { 
      access: 'public' // User preferences stored publicly
    });
    
    console.log('✅ User preferences stored:', url);
    return { url, filename };
  } catch (error) {
    console.error('❌ Failed to store user preferences:', error);
    throw error;
  }
}

// Get stored file URL (for retrieval)
export function getBlobUrl(filename: string): string {
  return `https://blob.vercel-storage.app/${filename}`;
}

// List all stored files (you'd need to implement this with your own tracking)
export function getStoredFiles(): string[] {
  // This would require maintaining a database of stored files
  // For now, return empty array
  return [];
}
