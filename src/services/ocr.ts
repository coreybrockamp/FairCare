import { supabase } from './supabase';

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface OCRResult {
  success: boolean;
  fullText: string;
  textBlocks: TextBlock[];
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
  console.log('OCR: Starting text extraction from image:', imageUri);

  try {
    // Call the Supabase Edge Function that proxies to Google Cloud Vision
    const { data, error } = await supabase.functions.invoke('ocr-extract', {
      body: {
        imageBase64,
        imageUri,
      },
    });

    if (error) {
      console.error('OCR: Edge Function error:', error);
      return {
        success: false,
        fullText: '',
        textBlocks: [],
        language: '',
        error: error.message || 'Failed to process image',
      };
    }

    console.log('OCR: Successfully extracted text, blocks:', data?.textBlocks?.length || 0);

    return {
      success: true,
      fullText: data.fullText || '',
      textBlocks: data.textBlocks || [],
      language: data.language || 'unknown',
    };
  } catch (error: any) {
    console.error('OCR: Exception during text extraction:', error);
    return {
      success: false,
      fullText: '',
      textBlocks: [],
      language: '',
      error: error.message || 'Unknown error during OCR',
    };
  }
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

    // Process with OCR
    const ocrResult = await extractTextFromImage(storagePath, imageBase64);
    onProgress?.(100);

    return {
      storagePath: uploadData?.path || storagePath,
      ocrResult,
    };
  } catch (error: any) {
    console.error('OCR: Upload and processing failed:', error);
    throw error;
  }
};
