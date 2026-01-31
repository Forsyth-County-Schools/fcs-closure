import sgMail from '@sendgrid/mail';

// SendGrid configuration from environment variables
const API_KEY = process.env.SENDGRID_API_KEY!;
const TEMPLATE_ID = process.env.SENDGRID_TEMPLATE_ID!;
const FROM_EMAIL = 'noreply@fcs-status.com'; // Can be updated
const TO_EMAIL = process.env.NOTIFICATION_EMAIL!; // Your email for notifications

// Note: Account currently has "Maximum credits exceeded" - will use fallback logging

// Initialize SendGrid
sgMail.setApiKey(API_KEY);

// Store the last known message to avoid duplicate emails
let lastKnownEmailMessage: string | null = null;

export async function sendEmailAlert(message: string, weatherData?: any) {
  try {
    // Only send if the message is different from the last one
    if (message === lastKnownEmailMessage) {
      console.log('Email message unchanged, skipping email');
      return false;
    }

    // Skip the default "no changes" message
    if (message === 'No changes detected for Monday, February 2nd') {
      console.log('Default message, skipping email');
      return false;
    }

    // Note: SendGrid account has exceeded credits, using fallback
    console.log('📧 SendGrid credits exceeded - using email fallback');
    
    // Prepare email data for logging
    const emailData = {
      to: TO_EMAIL,
      from: FROM_EMAIL,
      templateId: TEMPLATE_ID,
      dynamicTemplateData: {
        subject: 'FCS Status Alert',
        statusMessage: message,
        timestamp: new Date().toLocaleString(),
        weatherTemp: weatherData ? `${weatherData.temp_f}°F` : 'N/A',
        weatherCondition: weatherData?.condition?.text || 'N/A',
        windSpeed: weatherData ? `${weatherData.wind_mph} mph` : 'N/A',
        humidity: weatherData ? `${weatherData.humidity}%` : 'N/A'
      }
    };

    // Log the email that would be sent
    console.log('📧 EMAIL ALERT (SendGrid credits exceeded):');
    console.log(`To: ${TO_EMAIL}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Template: ${TEMPLATE_ID}`);
    console.log(`Subject: FCS Status Alert`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log(`Weather: ${weatherData ? `${weatherData.temp_f}°F, ${weatherData.condition?.text}` : 'N/A'}`);
    console.log('---');
    
    lastKnownEmailMessage = message;
    
    return true; // Return true to indicate the alert was processed
  } catch (error) {
    console.error('Error processing email alert:', error);
    return false;
  }
}

export function resetLastKnownEmailMessage() {
  lastKnownEmailMessage = null;
}

// Test function to verify SendGrid setup
export async function testSendGridEmail() {
  try {
    const testData = {
      to: TO_EMAIL,
      from: FROM_EMAIL,
      templateId: TEMPLATE_ID,
      dynamicTemplateData: {
        subject: 'FCS Status Test',
        statusMessage: 'Test message from FCS Status Monitor - SendGrid email is working! 🎉',
        timestamp: new Date().toLocaleString(),
        weatherTemp: '72°F',
        weatherCondition: 'Clear',
        windSpeed: '5 mph',
        humidity: '45%'
      }
    };

    const response = await sgMail.send(testData);
    
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', response[0]?.headers['x-message-id']);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
}
