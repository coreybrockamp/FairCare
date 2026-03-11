import { useState, useCallback } from 'react';
import { uploadAndProcessImage } from '../services/ocr';
import { readImageAsBase64 } from '../services/storage';
import { OCRResult } from '../services/ocr';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UseImageUploadReturn extends UploadState {
  uploadImage: (imageUri: string) => Promise<{ storagePath: string; ocrResult: OCRResult }>;
  resetState: () => void;
}

/**
 * Hook for uploading and processing images with OCR
 * @param onProgress - Callback for progress updates
 * @returns Upload state and functions
 */
export const useImageUpload = (onProgress?: (progress: number) => void): UseImageUploadReturn => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadImage = useCallback(
    async (imageUri: string) => {
      setState({ isUploading: true, progress: 0, error: null });

      try {
        console.log('useImageUpload: Starting image upload:', imageUri);

        // Read image as base64
        const base64 = await readImageAsBase64(imageUri);

        // Upload and process
        const fileName = imageUri.split('/').pop() || `image-${Date.now()}.jpg`;

        const result = await uploadAndProcessImage(base64, fileName, (progress) => {
          setState((prev) => ({ ...prev, progress }));
          onProgress?.(progress);
        });

        console.log('useImageUpload: Upload and processing complete');

        setState({ isUploading: false, progress: 100, error: null });
        return result;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to upload image';
        console.error('useImageUpload: Error:', errorMessage);

        setState({
          isUploading: false,
          progress: 0,
          error: errorMessage,
        });

        throw error;
      }
    },
    [onProgress]
  );

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    uploadImage,
    resetState,
  };
};
