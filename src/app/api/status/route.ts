import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// Zod schema for API response validation
const SchoolStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  message: z.string().min(1, 'Message is required'),
  confidence: z.number().min(0).max(1).default(0.95),
  source: z.string().optional(),
});

const ApiResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  lastUpdated: z.string(),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  processingTime: z.string(),
  verified: z.boolean(),
  location: z.object({ country: z.string(), state: z.string() }).nullable().optional(),
});

// Rate limiting (in production, use Redis or a database)
const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();

// Geographic validation
function getClientLocation(request: NextRequest): { country: string; state: string } | null {
  const country = request.headers.get('x-vercel-ip-country') || 
                  request.headers.get('cf-ipcountry') || 
                  request.headers.get('x-country');
  const state = request.headers.get('x-vercel-ip-country-region') || 
                request.headers.get('cf-region') || 
                request.headers.get('x-region');
  
  if (!country || !state) return null;
  
  return { country: country.toUpperCase(), state: state.toUpperCase() };
}

function isLocationAllowed(location: { country: string; state: string }): boolean {
  const allowedCountries = (process.env.ALLOWED_COUNTRIES || 'US').split(',');
  const allowedStates = (process.env.ALLOWED_STATES || 'GA').split(',');
  
  return allowedCountries.includes(location.country) && allowedStates.includes(location.state);
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW || '60000');
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30');
  
  const clientData = RATE_LIMIT.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    RATE_LIMIT.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check if geographic restriction is enabled
    const geoRestrictionEnabled = process.env.ENABLE_GEOGRAPHIC_RESTRICTION === 'true';
    let location: { country: string; state: string } | null = null;
    
    // Geographic validation (only if enabled)
    if (geoRestrictionEnabled) {
      location = getClientLocation(request);
      if (!location) {
        return NextResponse.json(
          { error: 'Unable to determine location' },
          { status: 403, headers: SECURITY_HEADERS }
        );
      }
      
      if (!isLocationAllowed(location)) {
        return NextResponse.json(
          { 
            error: 'Access denied. This service is only available in Georgia, USA.',
            location: location
          },
          { status: 403, headers: SECURITY_HEADERS }
        );
      }
    }

    // Rate limiting
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

    // Security validation
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // Fetch with security headers and timeout
    const controller = new AbortController();
    const timeoutMs = parseInt(process.env.FCS_API_TIMEOUT || '15000');
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(process.env.FCS_API_URL!, {
        method: 'GET',
        headers: {
          'User-Agent': process.env.FCS_API_USER_AGENT!,
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
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
    }

    clearTimeout(timeoutId);

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
