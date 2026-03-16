import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS, getClientIdentifier, checkRateLimit, validateRequest, createSecureResponse, createErrorResponse } from '@/lib/security';

const FCS_WEATHER_URL = 'https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure';

export async function GET(request: NextRequest) {
  try {
    console.log('🏫 FCS Weather API: Fetching status from Forsyth County Schools');
    
    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }

    // Rate limiting
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId, 'status')) {
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429,
        { 'Retry-After': '60' }
      );
    }
    
    const response = await fetch(FCS_WEATHER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`❌ FCS Weather API: HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const status = extractCurrentStatus(html);
    
    console.log('✅ FCS Weather API: Status extracted successfully');
    
    return createSecureResponse({
      success: true,
      status,
      lastUpdated: new Date().toISOString(),
      source: FCS_WEATHER_URL
    });

  } catch (error) {
    console.error('💥 FCS Weather API: Error fetching weather status:', error);
    return createErrorResponse(
      'Failed to fetch Forsyth County Schools weather status',
      500,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

function extractCurrentStatus(html: string): string {
  // Strip scripts, styles, and all HTML tags to get plain text
  const text = html
    .replace(/<script[\s\S]*?<\/script[^>]*>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

  // Dynamically search for sentences containing delay or closure keywords
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];

  const delayKeywords = /\b(delay|delayed|2-hour delay|two-hour delay|late start)\b/i;
  const closureKeywords = /\b(closed|closure|cancelled|cancellation|cancel)\b/i;

  const delayMatch = sentences.find((s) => delayKeywords.test(s));
  if (delayMatch) return delayMatch.trim();

  const closureMatch = sentences.find((s) => closureKeywords.test(s));
  if (closureMatch) return closureMatch.trim();

  return 'No schedule changes detected';
}
