import { supabase } from './supabase';

// previously this module defined detailed OCR structures, but the Google
// Vision service is no longer used.  We keep a minimal result shape for
// compatibility with existing screens.
export interface OCRResult {
  success: boolean;
  fullText: string;
  textBlocks: any[]; // placeholder
  language: string;
  error?: string;
}

/**
 * Sends an image to the OCR service (via Supabase Edge Function)
 * @param imageUri - URI of the image to process
 * @param imageBase64 - Base64 encoded image data
 * @returns OCR results with extracted text and bounding boxes
 */
export const extractTextFromImage = async (
  imageUri: string,
  imageBase64: string
): Promise<OCRResult> => {
  // no-op; parsing now happens in parse-bill, so we can return an empty
  // successful result to satisfy callers.
  console.warn('extractTextFromImage called but OCR disabled');
  return {
    success: true,
    fullText: '',
    textBlocks: [],
    language: '',
  };
};

/**
 * Uploads an image to Supabase Storage and processes it with OCR
 * @param imageBase64 - Base64 encoded image data
 * @param fileName - Name for the stored file
 * @param onProgress - Callback for upload progress (0-100)
 * @returns Path to stored image and OCR results
 */
export const uploadAndProcessImage = async (
  imageBase64: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ storagePath: string; ocrResult: OCRResult }> => {
  console.log('OCR: Starting upload and processing for:', fileName);

  try {
    // Convert base64 to blob for upload
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    // Upload to Supabase Storage
    onProgress?.(10);
    const timestamp = Date.now();
    const storagePath = `bill-images/${timestamp}-${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bill-captures')
      .upload(storagePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('OCR: Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    onProgress?.(50);
    console.log('OCR: Image uploaded to:', storagePath);

    // we no longer run OCR; the caller should hit parse-bill directly
    onProgress?.(100);
    return {
      storagePath: uploadData?.path || storagePath,
      ocrResult: { success: true, fullText: '', textBlocks: [], language: '' },
    };
  } catch (error: any) {
    console.error('OCR: Upload and processing failed:', error);
    throw error;
  }
};
