// Test Mailjet email system
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Mailjet = require('node-mailjet');

// You'll need to provide your Mailjet credentials
const MJ_APIKEY_PUBLIC = 'your_mailjet_api_key_public_here';
const MJ_APIKEY_PRIVATE = 'your_mailjet_api_key_private_here';
const FROM_EMAIL = 'noreply@fcs-status.com';
const TO_EMAIL = '17708916033@txt.att.net';

if (MJ_APIKEY_PUBLIC === 'your_mailjet_api_key_public_here' || MJ_APIKEY_PRIVATE === 'your_mailjet_api_key_private_here') {
  console.log('❌ Please update this script with your actual Mailjet credentials:');
  console.log('1. Get API Key and Secret from Mailjet dashboard');
  console.log('2. Update the MJ_APIKEY_PUBLIC and MJ_APIKEY_PRIVATE variables');
  console.log('3. Run this test again');
  process.exit(1);
}

const mailjet = Mailjet.connect(MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE);

async function testMailjetEmail() {
  console.log('🚀 Testing Mailjet Email System');
  console.log('=================================');
  
  try {
    console.log('📧 Sending test email...');
    const request = mailjet.post('send').request({
      FromEmail: FROM_EMAIL,
      FromName: 'FCS Status Monitor',
      Subject: 'FCS Status Test - Mailjet Integration',
      'Text-part': 'Test message from FCS Status Monitor - Mailjet email is working! 🎉',
      'Html-part': `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">🚨 FCS Status Test</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #166534;">✅ Test Successful</h2>
      <p style="margin: 0; font-size: 16px; color: #14532d;">Mailjet email integration is working perfectly!</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">📧 Email Features</h3>
      <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
        <li>HTML email templates</li>
        <li>Weather data integration</li>
        <li>Professional styling</li>
        <li>Smart duplicate prevention</li>
      </ul>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is a test from the FCS Status Monitoring System</p>
      <p style="margin: 5px 0 0 0;">Ready to monitor Forsyth County Schools! 🎯</p>
    </div>
  </div>
</div>
      `,
      Recipients: [{ Email: TO_EMAIL }]
    });

    const response = await request;
    
    console.log('✅ Test email sent successfully!');
    console.log('Response:', response.body);
    console.log('To:', TO_EMAIL);
    console.log('From:', FROM_EMAIL);
    
    return true;
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.data);
    }
    return false;
  }
}

testMailjetEmail();
