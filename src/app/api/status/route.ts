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
const CACHE_DURATION = 0;

function stripHtmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const withNewlines = withoutScripts
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d|tr|td|th)>/gi, '\n');

  const noTags = withNewlines.replace(/<[^>]*>/g, ' ');

  const decoded = noTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  const normalized = decoded
    .replace(/\r\n/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.join('\n');
}

function detectAlert(text: string): { isAlert: boolean; status: string; confidence: number } {
  const lower = text.toLowerCase();
  const keywords: Array<{ re: RegExp; status: string; confidence: number }> = [
    { re: /online\s+learning\s+day/i, status: 'Online Learning Day', confidence: 0.99 },
    { re: /virtual\s+learning/i, status: 'Online Learning Day', confidence: 0.95 },
    { re: /remote\s+learning/i, status: 'Online Learning Day', confidence: 0.95 },
    { re: /(all\s+)?school\s+activities[\s\S]{0,40}(canceled|cancelled)/i, status: 'Closed', confidence: 0.98 },
    { re: /(canceled|cancelled)/i, status: 'Closed', confidence: 0.93 },
    { re: /(closed|closure)/i, status: 'Closed', confidence: 0.92 },
    { re: /(delayed|delay|late\s+start)/i, status: 'Delayed', confidence: 0.9 },
    { re: /(early\s+dismissal)/i, status: 'Early Dismissal', confidence: 0.9 },
    { re: /(inclement\s+weather|winter\s+weather|icy\s+road|ice\s+conditions|hazardous\s+conditions)/i, status: 'Weather Alert', confidence: 0.88 },
  ];

  for (const k of keywords) {
    if (k.re.test(lower)) {
      return { isAlert: true, status: k.status, confidence: k.confidence };
    }
  }

  if (text.length >= 200) {
    return { isAlert: true, status: 'Alert', confidence: 0.75 };
  }

  return { isAlert: false, status: 'Open', confidence: 0.9 };
}

function shortenAnnouncement(text: string, maxLen: number = 240): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length <= maxLen) return cleaned;

  const slice = cleaned.slice(0, maxLen);
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  const cutoff = lastStop >= Math.floor(maxLen * 0.6) ? lastStop + 1 : maxLen;
  return `${cleaned.slice(0, cutoff).trim()}…`;
}

export async function GET() {
  const startTime = Date.now();
  const now = Date.now();
  
  // Return cached response if it's still fresh
  if (cachedResponse && (now - lastFetchTime) < CACHE_DURATION) {
    return NextResponse.json({ ...cachedResponse, cached: true }, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }

  try {
    const cacheBustedUrl = `${FCS_URL}${FCS_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const response = await safeFetch(cacheBustedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawHtml = await response.text();

    if (rawHtml.length > 1000000) {
      throw new Error('Response too large');
    }

    const announcementText = stripHtmlToText(rawHtml);
    const { isAlert, status, confidence } = detectAlert(announcementText);
    const shortAnnouncement = isAlert ? shortenAnnouncement(announcementText) : '';

    const result = {
      isOpen: !isAlert,
      status: isAlert ? status : 'Open',
      message: isAlert ? shortAnnouncement : 'No changes detected for Monday, February 2nd',
      announcement: isAlert ? announcementText : '',
      lastUpdated: new Date().toLocaleString(),
      confidence,
      source: 'Forsyth County Schools',
      processingTime: `${Date.now() - startTime}ms`,
      verified: true,
    };

    // Cache the result
    cachedResponse = result;
    lastFetchTime = Date.now();
    return NextResponse.json(result, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
        isOpen: false,
        status: 'Status Unavailable',
        message: errorResponse.message,
        announcement: '',
        error: errorResponse.message,
        processingTime: `${processingTime}ms`,
        timestamp: errorResponse.timestamp,
        verified: false
      },
      {
        status: errorResponse.status || 503,
        headers: {
          ...SECURITY_HEADERS,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}
