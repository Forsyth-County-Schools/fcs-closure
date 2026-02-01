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

const MIN_ALERT_TEXT_LENGTH = 100;

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function getRelevantSchoolDay(now: Date): Date {
  const day = now.getDay();
  if (day === 6) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return startOfDay(d);
  }
  if (day === 0) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return startOfDay(d);
  }
  return startOfDay(now);
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

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

function classifyAnnouncement(text: string): { status: string; confidence: number } {
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
      return { status: k.status, confidence: k.confidence };
    }
  }

  return { status: 'Alert', confidence: 0.7 };
}

function parseDateFromAnnouncement(text: string, reference: Date): Date | null {
  const ref = startOfDay(reference);

  const monthPattern = new RegExp(
    String.raw`\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)?\s*,?\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b`,
    'gi'
  );

  const numericPattern = /(\b\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;

  const candidates: Date[] = [];

  for (const match of text.matchAll(monthPattern)) {
    const monthName = String(match[1] || '').toLowerCase();
    const monthIndex = MONTHS[monthName];
    const day = Number(match[2]);
    const yearRaw = match[3];
    const year = yearRaw ? Number(yearRaw) : ref.getFullYear();

    if (!Number.isFinite(monthIndex) || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    const d = new Date(year, monthIndex, day);
    if (d.getMonth() !== monthIndex || d.getDate() !== day) continue;

    if (!yearRaw && d.getTime() < ref.getTime()) {
      d.setFullYear(d.getFullYear() + 1);
    }

    candidates.push(startOfDay(d));
  }

  for (const match of text.matchAll(numericPattern)) {
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) continue;
    const d = new Date(year, month - 1, day);
    if (d.getMonth() !== month - 1 || d.getDate() !== day) continue;
    candidates.push(startOfDay(d));
  }

  const futureOrToday = candidates
    .filter((d) => d.getTime() >= ref.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  return futureOrToday[0] || null;
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
    const nowLocal = new Date();
    const relevantSchoolDay = getRelevantSchoolDay(nowLocal);

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

    const announcementText = stripHtmlToText(rawHtml).trim();
    const hasAlert = announcementText.length >= MIN_ALERT_TEXT_LENGTH;
    const classification = hasAlert ? classifyAnnouncement(announcementText) : { status: 'Open', confidence: 0.9 };
    const targetDate = (hasAlert ? parseDateFromAnnouncement(announcementText, nowLocal) : null) || relevantSchoolDay;
    const targetIsToday = isWeekday(nowLocal) && startOfDay(nowLocal).getTime() === startOfDay(targetDate).getTime();
    const targetIsRelevantSchoolDay = startOfDay(relevantSchoolDay).getTime() === startOfDay(targetDate).getTime();
    const prefix = targetIsToday ? 'Today' : (nowLocal.getDay() === 0 || nowLocal.getDay() === 6) && targetIsRelevantSchoolDay ? 'Next school day' : 'Upcoming';
    const summary = hasAlert ? classification.status : 'Open / Normal schedule';
    const shortAnnouncement = hasAlert ? shortenAnnouncement(announcementText) : '';
    const message = hasAlert
      ? `${prefix} (${formatLongDate(targetDate)}): ${summary}\n${shortAnnouncement}`
      : `${prefix} (${formatLongDate(targetDate)}): ${summary}`;

    const result = {
      isOpen: !hasAlert,
      status: hasAlert ? classification.status : 'Open',
      message,
      announcement: hasAlert ? announcementText : '',
      targetDate: targetDate.toISOString().slice(0, 10),
      lastUpdated: new Date().toLocaleString(),
      confidence: classification.confidence,
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
