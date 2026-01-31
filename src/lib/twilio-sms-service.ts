import { Twilio } from 'twilio';

// Twilio configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
const toNumber = process.env.NOTIFICATION_PHONE!;

const twilioClient = new Twilio(accountSid, authToken);

// Store the last known message to avoid duplicate texts
let lastKnownMessage: string | null = null;

export async function sendTwilioSMS(message: string) {
  try {
    // Only send if the message is different from the last one
    if (message === lastKnownMessage) {
      console.log('Message unchanged, skipping SMS');
      return false;
    }

    // Skip the default "no changes" message
    if (message === 'No changes detected for Monday, February 2nd') {
      console.log('Default message, skipping SMS');
      return false;
    }

    const text = `FCS Alert: ${message}`;
    
    // Send SMS using Twilio
    const smsMessage = await twilioClient.messages.create({
      body: text,
      from: fromNumber,
      to: toNumber
    });
    
    lastKnownMessage = message;
    
    console.log('✅ SMS sent successfully via Twilio');
    console.log('Message SID:', smsMessage.sid);
    console.log('To:', toNumber);
    console.log('Message:', text);
    
    return true;
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    
    // Fallback: Log the message that would be sent
    console.log('📱 FALLBACK - Message that would be sent:');
    console.log(`To: ${toNumber}`);
    console.log(`From: ${fromNumber}`);
    console.log(`Message: FCS Alert: ${message}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log('---');
    
    return false;
  }
}

export function resetLastKnownMessage() {
  lastKnownMessage = null;
}
