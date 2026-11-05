/**
 * Utility to normalize any error (string, Error, object, nested API response)
 * into a clean, human-readable message.
 * 
 * GUARANTEE: Never returns '[object Object]' or undefined under any circumstances.
 */
export function getErrorMessage(error: unknown, defaultFallback = 'Đã xảy ra lỗi đăng nhập.'): string {
  if (!error) return defaultFallback;

  // 1. Primitive string
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed === '[object Object]' || trimmed === '') {
      return defaultFallback;
    }
    return trimmed;
  }

  // 2. Error instance
  if (error instanceof Error) {
    const msg = error.message;
    if (typeof msg === 'string' && msg.trim() !== '[object Object]' && msg.trim() !== '') {
      return msg.trim();
    }
  }

  // 3. Object / JSON response / Supabase error
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, any>;

    // Priority 1: obj.message
    if (typeof obj.message === 'string' && obj.message.trim() !== '[object Object]' && obj.message.trim() !== '') {
      return obj.message.trim();
    }

    // Priority 2: obj.error
    if (typeof obj.error === 'string' && obj.error.trim() !== '[object Object]' && obj.error.trim() !== '') {
      return obj.error.trim();
    }

    // Priority 3: obj.details
    if (typeof obj.details === 'string' && obj.details.trim() !== '[object Object]' && obj.details.trim() !== '') {
      return obj.details.trim();
    }

    // Priority 4: obj.msg or obj.description
    if (typeof obj.msg === 'string' && obj.msg.trim() !== '[object Object]' && obj.msg.trim() !== '') {
      return obj.msg.trim();
    }
    if (typeof obj.description === 'string' && obj.description.trim() !== '[object Object]' && obj.description.trim() !== '') {
      return obj.description.trim();
    }

    // Nested error object
    if (obj.error && typeof obj.error === 'object') {
      const nested = getErrorMessage(obj.error, '');
      if (nested && nested !== '[object Object]') return nested;
    }

    // Nested details object
    if (obj.details && typeof obj.details === 'object') {
      const nested = getErrorMessage(obj.details, '');
      if (nested && nested !== '[object Object]') return nested;
    }

    // Nested data object
    if (obj.data && typeof obj.data === 'object') {
      const nested = getErrorMessage(obj.data, '');
      if (nested && nested !== '[object Object]') return nested;
    }

    return defaultFallback;
  }

  return defaultFallback;
}
