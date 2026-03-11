// File type constants
export const SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'];
export const SUPPORTED_DOC_TYPES = ['pdf'];
export const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOC_TYPES];

// Storage paths
export const STORAGE_PATHS = {
  CAPTURED_BILLS: 'captured-bills',
  UPLOADED_BILLS: 'uploaded-bills',
  OCR_RESULTS: 'ocr-results',
};

// API endpoints
export const API_ENDPOINTS = {
  OCR_EXTRACT: 'ocr-extract',
};

// Supabase buckets
export const SUPABASE_BUCKETS = {
  BILL_CAPTURES: 'bill-captures',
  DOCUMENTS: 'documents',
};

// Image compression
export const IMAGE_COMPRESSION = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 2560,
  QUALITY: 0.8,
  FORMAT: 'jpeg',
};

// OCR configuration
export const OCR_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  TIMEOUT: 60000, // 60 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// UI configuration
export const UI_CONFIG = {
  SCREEN_WIDTH: 390, // iPhone 14 width
  DOCUMENT_ASPECT_RATIO: 0.6, // 8.5x11 document
  TAB_BAR_HEIGHT: 60,
  TOUCH_TARGET_MIN: 44, // Apple HIG minimum
};
