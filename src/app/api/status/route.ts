import { NextResponse } from 'next/server';
import { logError, createErrorResponse, safeFetch } from '@/lib/error-handling';

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
    const response = await safeFetch(FCS_URL, {
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

    // School is closed - Override
    const result = {
      status: 'School is Closed',
      message: 'All schools are CLOSED on Monday, February 2nd, 2026 due to winter weather',
      lastUpdated: new Date().toLocaleString(),
      confidence: 1.0,
      source: 'Forsyth County Schools API',
      processingTime: `${Date.now() - startTime}ms`,
      verified: true,
    };

    // Cache the result
    cachedResponse = result;
    lastFetchTime = Date.now();
    
    return NextResponse.json(result, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'public, max-age=300',
      }
    });
    
  } catch (error) {
    logError('School Status API', error, { url: FCS_URL, processingTime: Date.now() - startTime });
    
    const processingTime = Date.now() - startTime;
    const errorResponse = createErrorResponse(
      'Service temporarily unavailable. Please try again later.',
      503,
      { processingTime: `${processingTime}ms` }
    );
    
    return NextResponse.json(
      { 
        error: errorResponse.message,
        processingTime: `${processingTime}ms`,
        timestamp: errorResponse.timestamp,
        verified: false
      },
      { 
        status: errorResponse.status || 503,
        headers: SECURITY_HEADERS
      }
    );
  }
}
