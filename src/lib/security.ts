import { NextRequest, NextResponse } from 'next/server';

// Security headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self' https://schoolcancelled.today; script-src 'self' https://schoolcancelled.today https://www.googletagmanager.com 'unsafe-inline'; style-src 'self' https://schoolcancelled.today 'unsafe-inline'; connect-src 'self' https://schoolcancelled.today https://www.google-analytics.com https://analytics.google.com; img-src 'self' https://schoolcancelled.today data: https://www.google-analytics.com; font-src 'self' https://schoolcancelled.today;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Rate limiting (in production, use Redis or a database)
const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = {
  default: 300,
  weather: 150, // Weather API calls are more expensive but increased for customers
  upload: 50,  // Uploads should be limited but reasonable for customers
  status: 500  // Status checks can be very frequent for school monitoring
};

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

export function checkRateLimit(clientId: string, endpoint: string = 'default'): boolean {
  const now = Date.now();
  const maxRequests = RATE_LIMIT_MAX_REQUESTS[endpoint as keyof typeof RATE_LIMIT_MAX_REQUESTS] || RATE_LIMIT_MAX_REQUESTS.default;
  
  const clientData = RATE_LIMIT.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    RATE_LIMIT.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= maxRequests) {
    return false;
  }
  
  clientData.count++;
  return true;
}

export function validateRequest(request: NextRequest): { valid: boolean; error?: string } {
  // Check for suspicious headers
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, error: 'Invalid User-Agent' };
  }

  // Check for common attack patterns
  const url = request.url.toLowerCase();
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /javascript:/i,  // JavaScript protocol
    /data:/i,  // Data protocol
    /vbscript:/i,  // VBScript protocol
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return { valid: false, error: 'Suspicious request pattern detected' };
    }
  }

  return { valid: true };
}

export function sanitizeResponse(data: any): any {
  // Remove sensitive information from responses
  if (typeof data === 'string') {
    return data.replace(/password|secret|key|token/gi, '[REDACTED]');
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('key') || 
          key.toLowerCase().includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeResponse(value);
      }
    }
    return sanitized;
  }
  
  return data;
}

export function createSecureResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(sanitizeResponse(data), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...headers,
    },
  });
}

export function createErrorResponse(message: string, status: number = 400, additionalData?: any) {
  return createSecureResponse({
    error: message,
    timestamp: new Date().toISOString(),
    ...additionalData
  }, status);
}
