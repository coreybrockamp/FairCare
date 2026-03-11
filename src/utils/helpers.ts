/**
 * Common utility functions used across the app
 */

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Extracts file extension from filename
 * @param fileName - Name of the file
 * @returns File extension (lowercase, without dot)
 */
export const getFileExtension = (fileName: string): string => {
  const match = fileName.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
};

/**
 * Determines if a file is an image
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file (optional)
 * @returns True if file is an image
 */
export const isImageFile = (fileName: string, mimeType?: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'gif', 'bmp'];
  const ext = getFileExtension(fileName);
  
  if (mimeType?.startsWith('image/')) return true;
  return imageExtensions.includes(ext);
};

/**
 * Determines if a file is a PDF
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file (optional)
 * @returns True if file is a PDF
 */
export const isPdfFile = (fileName: string, mimeType?: string): boolean => {
  const ext = getFileExtension(fileName);
  return ext === 'pdf' || mimeType === 'application/pdf';
};

/**
 * Gets an appropriate icon name for a file type
 * @param mimeType - MIME type of the file
 * @param fileName - Name of the file
 * @returns Material icon name
 */
export const getFileIconName = (mimeType?: string, fileName?: string): string => {
  if (isPdfFile(fileName || '', mimeType)) {
    return 'picture-as-pdf';
  }
  if (isImageFile(fileName || '', mimeType)) {
    return 'image';
  }
  return 'description';
};

/**
 * Validates if a file is supported
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @returns Object with isValid and error message
 */
export const validateFile = (
  fileName: string,
  mimeType?: string
): { isValid: boolean; error?: string } => {
  if (!fileName) {
    return { isValid: false, error: 'File name is required' };
  }

  if (isImageFile(fileName, mimeType) || isPdfFile(fileName, mimeType)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'File type not supported. Please use JPG, PNG, HEIC, or PDF.',
  };
};

/**
 * Formats a date to a readable string
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Debounces a function
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Retries a promise-based function with exponential backoff
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param delay - Initial delay in milliseconds
 * @returns Promise with result or throws last error
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError || new Error('Operation failed after all retry attempts');
};

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};
