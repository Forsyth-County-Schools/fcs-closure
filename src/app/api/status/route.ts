import { NextResponse } from 'next/server';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

const FCS_URL = 'https://www.forsyth.k12.ga.us/fs/pages/0/page-pops';

// Cache the response for 5 minutes
let cachedResponse: Record<string, unknown> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Simple HTML sanitization function
function sanitizeHtml(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET() {
  const startTime = Date.now();
  const now = Date.now();
  
  // Return cached response if it's still fresh
  if (cachedResponse && (now - lastFetchTime) < CACHE_DURATION) {
    return NextResponse.json({ ...cachedResponse, cached: true }, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'public, max-age=300',
      }
    });
  }

  try {
    const response = await fetch(FCS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const lowerData = data.toLowerCase();
    
    // Security validation of response
    const maxSize = parseInt(process.env.MAX_RESPONSE_SIZE || '1000000');
    if (data.length > maxSize) {
      throw new Error('Response too large');
    }
    
    // Look for "School" specifically and various status indicators
    const hasSchoolKeyword = lowerData.includes('school');
    
    let status = 'School is scheduled as normal';
    let message = 'No changes detected for Monday, February 2nd, 2026';
    let confidence = 0.95;
    
    if (hasSchoolKeyword) {
      // Extract the Monday-specific section
      const mondaySection = data.match(/monday, february 2[^:]*:([^<]*)/i);
      const mondayText = mondaySection ? mondaySection[1].toLowerCase() : '';
      
      // Check for cancellations specifically in Monday section
      if (mondayText.includes('cancelled') || mondayText.includes('cancel') || mondayText.includes('closed')) {
        status = 'School Cancelled';
        message = 'Monday, February 2nd, 2026 will be cancelled';
        confidence = 0.98;
      }
      // Check for delays specifically in Monday section
      else if (mondayText.includes('delayed') || mondayText.includes('delay')) {
        status = 'School Delayed';
        message = 'School will have a delayed opening on Monday, February 2nd, 2026';
        confidence = 0.96;
      }
      // Check for early dismissal specifically in Monday section
      else if (mondayText.includes('early dismissal') || mondayText.includes('dismissed early')) {
        status = 'Early Dismissal';
        message = 'School will have early dismissal on Monday, February 2nd, 2026';
        confidence = 0.96;
      }
      // Look for decision-making language about Monday
      else if (mondayText.includes('decision') || mondayText.includes('share a decision') || mondayText.includes('will share')) {
        status = 'Decision Pending';
        message = 'Decision about Monday, February 2nd, 2026 will be made by 5:00 PM Sunday';
        confidence = 0.92;
      }
      // If Monday is mentioned but no specific status
      else if (lowerData.includes('monday, february 2') || lowerData.includes('monday')) {
        status = 'School Status Update';
        message = 'Update available for Monday, February 2nd, 2026 - monitoring weather conditions';
        confidence = 0.88;
      }
    }
    
    // Try to extract a more specific status if possible
    if (hasSchoolKeyword) {
      // Look for patterns like "School will be" or "School is" specifically about Monday
      const mondaySchoolMatch = data.match(/monday[^:]*:.*?school\s+(will\s+be|is)\s+([^.]+)/i);
      if (mondaySchoolMatch) {
        const extractedStatus = mondaySchoolMatch[2].trim();
        status = 'School Status Update';
        message = `Monday, February 2nd, 2026: ${extractedStatus}`;
        confidence = 0.94;
      }
    }
    
    // Sanitize message to prevent XSS
    const sanitizedMessage = sanitizeHtml(message);
    
    const processingTime = Date.now() - startTime;
    
    const result = {
      status: sanitizeHtml(status),
      message: sanitizedMessage,
      lastUpdated: new Date().toLocaleString(),
      confidence,
      source: 'Forsyth County Schools API',
      processingTime: `${processingTime}ms`,
      verified: true,
    };

    // Cache the result
    cachedResponse = result;
    lastFetchTime = now;
    
    return NextResponse.json(result, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'public, max-age=300',
      }
    });
    
  } catch (error) {
    console.error('Error fetching school status:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable. Please try again later.',
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        verified: false
      },
      { 
        status: 503,
        headers: SECURITY_HEADERS
      }
    );
  }
}
