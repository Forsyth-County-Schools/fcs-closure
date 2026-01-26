import { NextRequest, NextResponse } from 'next/server';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// Rate limiting (in production, use Redis or a database)
const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute (increased from 30)

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = RATE_LIMIT.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    RATE_LIMIT.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting (relaxed for public access)
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            'Retry-After': '60'
          }
        }
      );
    }

    // Fetch with security headers and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('https://www.forsyth.k12.ga.us/fs/pages/0/page-pops', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const lowerData = data.toLowerCase();
    
    // Security validation of response
    if (data.length > 1000000) { // 1MB limit
      throw new Error('Response too large');
    }
    
    // Look for "School" specifically and various status indicators
    const hasSchoolKeyword = lowerData.includes('school');
    
    let status = 'School is scheduled as normal';
    let message = 'No changes detected for Tuesday, January 27th';
    let confidence = 0.95;
    
    if (hasSchoolKeyword) {
      // Extract the Tuesday-specific section
      const tuesdaySection = data.match(/tuesday, january 27[^:]*:([^<]*)/i);
      const tuesdayText = tuesdaySection ? tuesdaySection[1].toLowerCase() : '';
      
      // Check for cancellations specifically in Tuesday section
      if (tuesdayText.includes('cancelled') || tuesdayText.includes('cancel') || tuesdayText.includes('closed')) {
        status = 'School Cancelled';
        message = 'Tuesday, January 27th will be cancelled';
        confidence = 0.98;
      }
      // Check for delays specifically in Tuesday section
      else if (tuesdayText.includes('delayed') || tuesdayText.includes('delay')) {
        status = 'School Delayed';
        message = 'School will have a delayed opening on Tuesday, January 27th';
        confidence = 0.96;
      }
      // Check for early dismissal specifically in Tuesday section
      else if (tuesdayText.includes('early dismissal') || tuesdayText.includes('dismissed early')) {
        status = 'Early Dismissal';
        message = 'School will have early dismissal on Tuesday, January 27th';
        confidence = 0.96;
      }
      // Look for decision-making language about Tuesday
      else if (tuesdayText.includes('decision') || tuesdayText.includes('share a decision') || tuesdayText.includes('will share')) {
        status = 'Decision Pending';
        message = 'Decision about Tuesday, January 27th will be made by 5:00 PM Monday';
        confidence = 0.92;
      }
      // If Tuesday is mentioned but no specific status
      else if (lowerData.includes('tuesday, january 27') || lowerData.includes('tuesday')) {
        status = 'School Status Update';
        message = 'Update available for Tuesday, January 27th - monitoring weather conditions';
        confidence = 0.88;
      }
    }
    
    // Try to extract a more specific status if possible
    if (hasSchoolKeyword) {
      // Look for patterns like "School will be" or "School is" specifically about Tuesday
      const tuesdaySchoolMatch = data.match(/tuesday[^:]*:.*?school\s+(will\s+be|is)\s+([^.]+)/i);
      if (tuesdaySchoolMatch) {
        const extractedStatus = tuesdaySchoolMatch[2].trim();
        if (extractedStatus.length > 0 && extractedStatus.length < 100) {
          message = `Tuesday, January 27th: ${extractedStatus}`;
          confidence = 0.94;
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    const result = {
      status,
      message,
      lastUpdated: new Date().toLocaleString(),
      confidence,
      source: 'Forsyth County Schools API',
      processingTime: `${processingTime}ms`,
      rawData: data.substring(0, 500) // First 500 chars for debugging
    };

    return NextResponse.json(result, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Error fetching school status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch school status';
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: SECURITY_HEADERS
      }
    );
  }
}
