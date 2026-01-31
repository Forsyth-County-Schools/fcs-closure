import { NextRequest, NextResponse } from 'next/server';
import { sendEmailAlert } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { message, weatherData } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await sendEmailAlert(message, weatherData);
    
    if (result) {
      return NextResponse.json(
        { success: true, message: 'Email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
