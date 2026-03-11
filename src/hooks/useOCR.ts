import { useState, useCallback } from 'react';
import { extractTextFromImage, OCRResult } from '../services/ocr';
import { retryWithBackoff } from '../utils/helpers';

interface OCRState {
  isProcessing: boolean;
  result: OCRResult | null;
  error: string | null;
}

interface UseOCRReturn extends OCRState {
  processImage: (imageUri: string, imageBase64: string) => Promise<OCRResult>;
  resetState: () => void;
}

/**
 * Hook for managing OCR text extraction with retry logic
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns OCR state and functions
 */
export const useOCR = (maxRetries: number = 3): UseOCRReturn => {
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    result: null,
    error: null,
  });

  const processImage = useCallback(
    async (imageUri: string, imageBase64: string): Promise<OCRResult> => {
      setState({ isProcessing: true, result: null, error: null });

      try {
        console.log('useOCR: Starting OCR processing for:', imageUri);

        // Use retry logic for resilience
        const result = await retryWithBackoff(
          async () => {
            const ocrResult = await extractTextFromImage(imageUri, imageBase64);

            if (!ocrResult.success) {
              throw new Error(ocrResult.error || 'OCR processing failed');
            }

            return ocrResult;
          },
          maxRetries,
          1000
        );

        console.log('useOCR: Processing complete, extracted', result.textBlocks.length, 'blocks');

        setState({ isProcessing: false, result, error: null });
        return result;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to process image';
        console.error('useOCR: Error:', errorMessage);

        const errorResult: OCRResult = {
          success: false,
          fullText: '',
          textBlocks: [],
          language: '',
          error: errorMessage,
        };

        setState({ isProcessing: false, result: null, error: errorMessage });
        throw error;
      }
    },
    [maxRetries]
  );

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    processImage,
    resetState,
  };
};
