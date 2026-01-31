import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_Uohdy5M4_5gwVHXF2j4AURNrwBz9Jszax');

// Email configuration
const FROM_EMAIL = 'forsyth@ahscampus.com';
const TO_EMAIL = process.env.NOTIFICATION_EMAIL || 'jgwatson29@gmail.com';

// Store the last known message to avoid duplicate emails
let lastKnownEmailMessage: string | null = null;

export async function sendResendEmail(message: string, weatherData?: Record<string, unknown>) {
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

    // Prepare weather information
    const weatherInfo = weatherData ? {
      temperature: typeof weatherData === 'object' && 'temp_f' in weatherData ? `${weatherData.temp_f}°F` : 'N/A',
      conditions: typeof weatherData === 'object' && 'condition' in weatherData && weatherData.condition && typeof weatherData.condition === 'object' && 'text' in weatherData.condition ? String(weatherData.condition.text) : 'N/A',
      windSpeed: typeof weatherData === 'object' && 'wind_mph' in weatherData ? `${weatherData.wind_mph} mph` : 'N/A',
      humidity: typeof weatherData === 'object' && 'humidity' in weatherData ? `${weatherData.humidity}%` : 'N/A',
    } : null;

    // Create HTML email content
    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">🚨 FCS Status Alert</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #92400e;">Status Update</h2>
      <p style="margin: 0; font-size: 16px; color: #451a03;">${message}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">📅 Timestamp</h3>
      <p style="margin: 0; color: #6b7280;">${new Date().toLocaleString()}</p>
    </div>
    
    ${weatherInfo ? `
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #374151;">🌤️ Weather Conditions</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <strong>Temperature:</strong> ${weatherInfo.temperature}
        </div>
        <div>
          <strong>Conditions:</strong> ${weatherInfo.conditions}
        </div>
        <div>
          <strong>Wind:</strong> ${weatherInfo.windSpeed}
        </div>
        <div>
          <strong>Humidity:</strong> ${weatherInfo.humidity}
        </div>
      </div>
    </div>
    ` : ''}
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is an automated alert from the FCS Status Monitoring System</p>
      <p style="margin: 5px 0 0 0;">Monitoring Forsyth County Schools for Monday, February 2nd</p>
    </div>
  </div>
</div>
    `;

    // Create text email content
    const textContent = `
Forsyth County Schools Status Alert

Status Message: ${message}
Timestamp: ${new Date().toLocaleString()}

${weatherInfo ? `
Weather Information:
- Temperature: ${weatherInfo.temperature}
- Conditions: ${weatherInfo.conditions}
- Wind Speed: ${weatherInfo.windSpeed}
- Humidity: ${weatherInfo.humidity}
` : ''}

This is an automated alert from the FCS Status Monitoring System.
    `;

    // Send email using ReSend with template
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: '🚨 FCS Status Alert',
      template: {
        id: '33f3ca07-d72e-4148-84e0-2b138b7fe4c5',
        variables: {
          message: message,
          timestamp: new Date().toLocaleString(),
          temperature: weatherInfo?.temperature || 'N/A',
          conditions: weatherInfo?.conditions || 'N/A',
          windSpeed: weatherInfo?.windSpeed || 'N/A',
          humidity: weatherInfo?.humidity || 'N/A',
        }
      }
    } as any);

    if (error) {
      console.error('ReSend API error:', error);
      return false;
    }

    lastKnownEmailMessage = message;
    
    console.log('✅ Email sent successfully via ReSend');
    console.log('Response:', data);
    console.log('To:', TO_EMAIL);
    
    return true;
  } catch (error) {
    console.error('Error sending email via ReSend:', error);
    
    // Fallback: Log the email that would be sent
    console.log('📧 FALLBACK - Email that would be sent:');
    console.log(`To: ${TO_EMAIL}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Subject: 🚨 FCS Status Alert`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    if (weatherData && typeof weatherData === 'object' && 'temp_f' in weatherData && 'condition' in weatherData && weatherData.condition && typeof weatherData.condition === 'object' && 'text' in weatherData.condition) {
      console.log(`Weather: ${weatherData.temp_f}°F, ${String(weatherData.condition.text)}`);
    }
    console.log('---');
    
    return false;
  }
}

export function resetLastKnownEmailMessage() {
  lastKnownEmailMessage = null;
}

// Test function to verify ReSend setup
export async function testResendEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: '✅ FCS Status Test - ReSend Integration',
      template: {
        id: '33f3ca07-d72e-4148-84e0-2b138b7fe4c5',
        variables: {
          message: 'Test message from FCS Status Monitor - ReSend email is working! 🎉',
          timestamp: new Date().toLocaleString(),
          temperature: '72°F',
          conditions: 'Sunny',
          windSpeed: '5 mph',
          humidity: '45%',
        }
      }
    } as any);

    if (error) {
      console.error('❌ Test email failed:', error);
      return false;
    }
    
    console.log('✅ Test email sent successfully');
    console.log('Response:', data);
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
}
