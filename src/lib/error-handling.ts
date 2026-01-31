// Standardized error handling utilities

export interface ApiError {
  message: string;
  status?: number;
  timestamp: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

// Standard error response creator
export function createErrorResponse(
  message: string, 
  status: number = 500, 
  details?: unknown
): ApiError {
  return {
    message,
    status,
    timestamp: new Date().toISOString(),
    details
  };
}

// Standard success response creator
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

// Standard error logging
export function logError(context: string, error: unknown, details?: unknown): void {
  const errorInfo = {
    context,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    details
  };
  
  console.error(`[${context}] Error:`, errorInfo);
}

// Standard fetch wrapper with timeout and error handling
export async function safeFetch(
  url: string, 
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    
    throw error;
  }
}

// Type guard for API responses
export function isValidApiResponse(obj: unknown): obj is ApiResponse {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as ApiResponse;
  return (
    typeof response.success === 'boolean' &&
    typeof response.timestamp === 'string' &&
    (response.data !== undefined || response.error !== undefined)
  );
}
