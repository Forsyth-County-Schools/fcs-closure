// eslint-disable-next-line @typescript-eslint/no-require-imports
const mailjet = require('node-mailjet');

let client: any = null;

// Initialize client only when credentials are available
function initializeMailjetClient() {
  if (!client && process.env.MJ_APIKEY_PUBLIC && process.env.MJ_APIKEY_PRIVATE) {
    client = mailjet.Client(
      process.env.MJ_APIKEY_PUBLIC!,
      process.env.MJ_APIKEY_PRIVATE!
    );
  }
}

// Mailjet configuration from environment variables
const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || 'noreply@fcs-status.com';
const TO_EMAIL = process.env.NOTIFICATION_EMAIL!;

// Store the last known message to avoid duplicate emails
let lastKnownEmailMessage: string | null = null;

export async function sendMailjetEmail(message: string, weatherData?: any) {
  try {
    // Initialize client if not already done
    if (!client) {
      initializeMailjetClient();
    }

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

    // Check if client is properly initialized
    if (!client) {
      console.log(' Mailjet client not initialized - missing credentials');
      return false;
    }

    // Prepare email data using correct Mailjet format
    const request = client.post('send').request({
      FromEmail: FROM_EMAIL,
      FromName: 'FCS Status Monitor',
      Subject: 'FCS Status Alert',
      'Text-part': `
Forsyth County Schools Status Alert

Status Message: ${message}
Timestamp: ${new Date().toLocaleString()}

Weather Information:
- Temperature: ${weatherData ? `${weatherData.temp_f}°F` : 'N/A'}
- Conditions: ${weatherData?.condition?.text || 'N/A'}
- Wind Speed: ${weatherData ? `${weatherData.wind_mph} mph` : 'N/A'}
- Humidity: ${weatherData ? `${weatherData.humidity}%` : 'N/A'}

This is an automated alert from the FCS Status Monitoring System.
      `,
      'Html-part': `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;"> FCS Status Alert</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #92400e;">Status Update</h2>
      <p style="margin: 0; font-size: 16px; color: #451a03;">${message}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;"> Timestamp</h3>
      <p style="margin: 0; color: #6b7280;">${new Date().toLocaleString()}</p>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #374151;"> Weather Conditions</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <strong>Temperature:</strong> ${weatherData ? `${weatherData.temp_f}°F` : 'N/A'}
        </div>
        <div>
          <strong>Conditions:</strong> ${weatherData?.condition?.text || 'N/A'}
        </div>
        <div>
          <strong>Wind:</strong> ${weatherData ? `${weatherData.wind_mph} mph` : 'N/A'}
        </div>
        <div>
          <strong>Humidity:</strong> ${weatherData ? `${weatherData.humidity}%` : 'N/A'}
        </div>
      </div>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is an automated alert from the FCS Status Monitoring System</p>
      <p style="margin: 5px 0 0 0;">Monitoring Forsyth County Schools for Monday, February 2nd</p>
    </div>
  </div>
</div>
      `,
      Recipients: [{ Email: TO_EMAIL }]
    });

    // Send email using Mailjet
    const response = await request;
    
    lastKnownEmailMessage = message;
    
    console.log(' Email sent successfully via Mailjet');
    console.log('Response:', response.body);
    console.log('To:', TO_EMAIL);
    
    return true;
  } catch (error) {
    console.error('Error sending email via Mailjet:', error);
    
    // Fallback: Log the email that would be sent
    console.log('📧 FALLBACK - Email that would be sent:');
    console.log(`To: ${TO_EMAIL}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Subject: FCS Status Alert`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log(`Weather: ${weatherData ? `${weatherData.temp_f}°F, ${weatherData.condition?.text}` : 'N/A'}`);
    console.log('---');
    
    return false;
  }
}

export function resetLastKnownEmailMessage() {
  lastKnownEmailMessage = null;
}

// Test function to verify Mailjet setup
export async function testMailjetEmail() {
  try {
    // Initialize client if not already done
    if (!client) {
      initializeMailjetClient();
    }

    if (!client) {
      console.log('❌ Mailjet client not initialized - cannot test');
      return false;
    }

    const request = client.post('send').request({
      FromEmail: FROM_EMAIL,
      FromName: 'FCS Status Monitor',
      Subject: 'FCS Status Test - Mailjet Integration',
      'Text-part': 'Test message from FCS Status Monitor - Mailjet email is working! 🎉',
      'Html-part': '<h3>Test message from FCS Status Monitor - Mailjet email is working! 🎉</h3>',
      Recipients: [{ Email: TO_EMAIL }]
    });

    const response = await request;
    
    console.log('✅ Test email sent successfully');
    console.log('Response:', response.body);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
}
