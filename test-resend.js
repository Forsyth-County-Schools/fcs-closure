// Test ReSend email system
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_Uohdy5M4_5gwVHXF2j4AURNrwBz9Jszax');

const FROM_EMAIL = 'forsyth@ahscampus.com';
const TO_EMAIL = 'jgwatson29@gmail.com';

async function testResendEmail() {
  console.log('🚀 Testing ReSend Email System');
  console.log('================================');
  
  try {
    console.log('📧 Sending test email...');
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: '✅ FCS Status Test - ReSend Integration',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">🚨 FCS Status Test</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #166534;">✅ Test Successful</h2>
      <p style="margin: 0; font-size: 16px; color: #14532d;">ReSend email integration is working perfectly!</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">📧 Email Features</h3>
      <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
        <li>HTML email templates</li>
        <li>Weather data integration</li>
        <li>Professional styling</li>
        <li>Smart duplicate prevention</li>
        <li>Modern ReSend API</li>
      </ul>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is a test from the FCS Status Monitoring System</p>
      <p style="margin: 5px 0 0 0;">Ready to monitor Forsyth County Schools! 🎯</p>
    </div>
  </div>
</div>
      `,
      text: `
FCS Status Test - ReSend Integration

✅ Test Successful
ReSend email integration is working perfectly!

📧 Email Features:
- HTML email templates
- Weather data integration
- Professional styling
- Smart duplicate prevention
- Modern ReSend API

This is a test from the FCS Status Monitoring System
Ready to monitor Forsyth County Schools! 🎯
      `,
    });

    if (error) {
      console.error('❌ Test email failed:', error);
      return false;
    }
    
    console.log('✅ Test email sent successfully!');
    console.log('Response:', data);
    console.log('To:', TO_EMAIL);
    console.log('From:', FROM_EMAIL);
    
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    return false;
  }
}

testResendEmail();
