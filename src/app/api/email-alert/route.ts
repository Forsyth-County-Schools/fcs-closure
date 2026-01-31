import { NextRequest, NextResponse } from 'next/server';
import { sendMailjetEmail } from '@/lib/mailjet-service';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self';",
};

export async function POST(request: NextRequest) {
  try {
    const { message, weatherData } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await sendMailjetEmail(message, weatherData);
    
    if (result) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email sent successfully',
          timestamp: new Date().toISOString()
        },
        { headers: SECURITY_HEADERS }
      );
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          timestamp: new Date().toISOString()
        },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
