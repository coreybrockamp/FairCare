import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Saves an image URI to app document storage
 * @param imageUri - URI of the image to save
 * @param fileName - Name for the saved file
 * @returns Path to saved image
 */
export const saveImageToStorage = async (imageUri: string, fileName: string): Promise<string> => {
  console.log('Storage: Saving image to app storage:', fileName);

  try {
    const appStorageDir = `${FileSystem.documentDirectory}captured-bills`;

    // Create directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(appStorageDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(appStorageDir, { intermediates: true });
      console.log('Storage: Created directory:', appStorageDir);
    }

    const destinationUri = `${appStorageDir}/${fileName}`;

    // Copy image to app storage
    await FileSystem.copyAsync({
      from: imageUri,
      to: destinationUri,
    });

    console.log('Storage: Image saved to:', destinationUri);
    return destinationUri;
  } catch (error: any) {
    console.error('Storage: Failed to save image:', error);
    throw error;
  }
};

/**
 * Reads an image from app storage and converts to base64
 * @param imageUri - URI of the image to read
 * @returns Base64 encoded image data
 */
export const readImageAsBase64 = async (imageUri: string): Promise<string> => {
  console.log('Storage: Reading image as base64:', imageUri);

  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('Storage: Image read as base64, size:', base64.length);
    return base64;
  } catch (error: any) {
    console.error('Storage: Failed to read image:', error);
    throw error;
  }
};

/**
 * Compresses and optimizes an image for upload
 * @param imageUri - URI of the image to compress
 * @param quality - Quality (0-1), default 0.8
 * @returns URI of compressed image
 */
export const compressImage = async (imageUri: string, quality: number = 0.8): Promise<string> => {
  console.log('Storage: Compressing image with quality:', quality);

  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1920, height: 2560 } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    console.log('Storage: Image compressed, uri:', manipulated.uri);
    return manipulated.uri;
  } catch (error: any) {
    console.error('Storage: Failed to compress image:', error);
    // Return original if compression fails
    return imageUri;
  }
};

/**
 * Deletes an image from app storage
 * @param imageUri - URI of the image to delete
 */
export const deleteImageFromStorage = async (imageUri: string): Promise<void> => {
  console.log('Storage: Deleting image:', imageUri);

  try {
    await FileSystem.deleteAsync(imageUri);
    console.log('Storage: Image deleted successfully');
  } catch (error: any) {
    console.error('Storage: Failed to delete image:', error);
  }
};
