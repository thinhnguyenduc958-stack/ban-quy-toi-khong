/**
 * Utility to normalize any error (string, Error, object, nested API response)
 * into a clean, human-readable message.
 * 
 * GUARANTEE: Never returns '[object Object]' or undefined under any circumstances.
 */

function cleanRawMessage(msg: string, defaultFallback: string): string {
  const trimmed = msg.trim();
  if (trimmed === '[object Object]' || trimmed === '') {
    return defaultFallback;
  }
  if (trimmed.includes('A server error has occurred') || trimmed.includes('FUNCTION_INVOCATION')) {
    return 'Máy chủ đang gặp sự cố kết nối hoặc đang khởi động lại. Vui lòng thử lại sau giây lát!';
  }
  if (trimmed.includes('Failed to fetch') || trimmed.includes('NetworkError')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng Internet!';
  }
  return trimmed;
}

export function getErrorMessage(error: unknown, defaultFallback = 'Đã xảy ra lỗi đăng nhập.'): string {
  if (!error) return defaultFallback;

  // 1. Primitive string
  if (typeof error === 'string') {
    return cleanRawMessage(error, defaultFallback);
  }

  // 2. Error instance
  if (error instanceof Error) {
    const msg = error.message;
    if (typeof msg === 'string' && msg.trim() !== '') {
      return cleanRawMessage(msg, defaultFallback);
    }
  }

  // 3. Object / JSON response / Supabase error
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, any>;

    // Priority 1: obj.message
    if (typeof obj.message === 'string' && obj.message.trim() !== '') {
      return cleanRawMessage(obj.message, defaultFallback);
    }

    // Priority 2: obj.error
    if (typeof obj.error === 'string' && obj.error.trim() !== '') {
      return cleanRawMessage(obj.error, defaultFallback);
    }

    // Priority 3: obj.details
    if (typeof obj.details === 'string' && obj.details.trim() !== '') {
      return cleanRawMessage(obj.details, defaultFallback);
    }

    // Priority 4: obj.msg or obj.description
    if (typeof obj.msg === 'string' && obj.msg.trim() !== '') {
      return cleanRawMessage(obj.msg, defaultFallback);
    }
    if (typeof obj.description === 'string' && obj.description.trim() !== '') {
      return cleanRawMessage(obj.description, defaultFallback);
    }

    // Nested error object
    if (obj.error && typeof obj.error === 'object') {
      const nested = getErrorMessage(obj.error, '');
      if (nested && nested !== '[object Object]') return cleanRawMessage(nested, defaultFallback);
    }

    // Nested details object
    if (obj.details && typeof obj.details === 'object') {
      const nested = getErrorMessage(obj.details, '');
      if (nested && nested !== '[object Object]') return cleanRawMessage(nested, defaultFallback);
    }

    // Nested data object
    if (obj.data && typeof obj.data === 'object') {
      const nested = getErrorMessage(obj.data, '');
      if (nested && nested !== '[object Object]') return cleanRawMessage(nested, defaultFallback);
    }

    return defaultFallback;
  }

  return defaultFallback;
}
