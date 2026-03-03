// lib/utils/auth.ts
export interface AuthError {
  message: string;
  code?: string;
  isNetworkError?: boolean;
}

export function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('ERR_CONNECTION_TIMED_OUT') ||
    error?.message?.includes('ERR_NETWORK')
  )
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries - 1) break;
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }

  throw lastError;
}

export function getAuthErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (error?.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (error?.message?.includes('Email not confirmed')) {
    return 'Please check your email and confirm your account before logging in.';
  }
  
  if (error?.message?.includes('Too many requests')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.';
}
