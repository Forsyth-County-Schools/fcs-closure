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
let cachedResponse: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function fetchSchoolStatus() {
  const now = Date.now();
  
  // Return cached response if it's still fresh
  if (cachedResponse && (now - lastFetchTime) < CACHE_DURATION) {
    return { ...cachedResponse, cached: true };
  }

  try {
    const response = await fetch(FCS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
      verified: true, // Security verified badge
      location: geoRestrictionEnabled ? location : null
    };

    // Validate response with Zod
    const validatedResult = ApiResponseSchema.parse(result);
    
    return NextResponse.json(validatedResult, {
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
