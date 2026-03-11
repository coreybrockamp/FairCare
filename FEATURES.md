# FairCare - Bill Capture & OCR Features

## Overview

This document describes the three major features implemented in Sprint 2 of FairCare:

1. **Camera Bill Capture** - Real-time document capture with a guide overlay
2. **PDF/Image Upload** - Multi-format file selection and upload
3. **OCR Text Extraction** - Google Cloud Vision API integration via Supabase Edge Functions

## 1. Camera Bill Capture

### Location
- **Main Screen**: `src/screens/scan/Camera.tsx`
- **Preview Screen**: `src/screens/scan/Preview.tsx`

### Features
- ✅ Real-time camera viewfinder with document guide rectangle overlay
- ✅ Portrait orientation for iPhone (mobile-first)
- ✅ Flash toggle button (on/off) with visual indicator
- ✅ Large, touch-friendly capture button (70x70px)
- ✅ Manual shutter button (no auto-capture yet, suitable for MVP)
- ✅ Image preview with retake/confirm options
- ✅ Automatic image compression before upload
- ✅ Permission handling with user-friendly UI

### User Flow
1. User taps "Scan" tab → navigates to Camera screen
2. Camera initializes with document guide overlay
3. User frames document and taps capture button
4. Image is shown in Preview screen
5. User can retake or confirm the capture

### Technical Details
- Uses `expo-camera` with `CameraView` component
- Uses `expo-image-manipulator` for image compression
- Images saved to app document storage via `storage.ts`
- Permissions handled gracefully with fallback UI
- Base64 encoding for OCR processing

## 2. PDF/Image Upload

### Location
- **Component**: `src/components/UploadBill.tsx`
- **Storage Service**: `src/services/storage.ts`

### Features
- ✅ Pick images from camera roll (JPG, PNG, HEIC)
- ✅ Pick PDFs from device storage
- ✅ Multi-file selection (display multiple selected files)
- ✅ File type icons (PDF, Image, Unknown)
- ✅ File name and size display
- ✅ File removal from selection
- ✅ Upload progress indicator
- ✅ Error handling with user feedback

### Supported Formats
- **Images**: JPG, PNG, HEIC, WebP
- **Documents**: PDF

### Technical Details
- Uses `expo-image-picker` for image selection
- Uses `expo-document-picker` for PDF/file selection
- File metadata tracked: name, size, type, MIME type
- Base64 conversion for API submission
- Progress callbacks for UI updates

## 3. OCR Text Extraction

### Location
- **OCR Service**: `src/services/ocr.ts`
- **Processing Screen**: `src/screens/scan/Processing.tsx`
- **Results Screen**: `src/screens/scan/Results.tsx`
- **Edge Function Setup**: `EDGE_FUNCTION_SETUP.md`

### Features
- ✅ Google Cloud Vision API integration
- ✅ Secure API proxy via Supabase Edge Functions
- ✅ Text block extraction with bounding boxes
- ✅ Confidence scores for each text block
- ✅ Language detection
- ✅ Structured OCR results
- ✅ Error handling and retry logic
- ✅ Provider abstraction for easy swapping

### Supported Providers (via Edge Functions)
- **Current**: Google Cloud Vision API
- **Future**: AWS Textract, Azure Computer Vision, OpenAI Vision, Tesseract

### OCR Result Structure
```typescript
interface OCRResult {
  success: boolean;
  fullText: string;           // Complete extracted text
  textBlocks: TextBlock[];    // Individual text blocks
  language: string;           // Detected language
  error?: string;            // Error message if failed
}

interface TextBlock {
  text: string;
  confidence: number;         // 0-1 confidence score
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}
```

### Processing Flow
1. **Camera Capture** → Image saved to app storage
2. **Preview Confirmation** → Image converted to base64
3. **Processing** → Supabase Edge Function called
4. **Results** → OCR text and blocks displayed to user

## Setup Instructions

### 1. Supabase Edge Function Setup

Follow the detailed instructions in `EDGE_FUNCTION_SETUP.md`:

```bash
# Create the function
supabase functions new ocr-extract

# Set Google Cloud credentials
supabase secrets set GOOGLE_APPLICATION_CREDENTIALS=$(cat service-account-key.json)

# Deploy
supabase functions deploy ocr-extract
```

### 2. Environment Variables

Ensure your `.env` file contains:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. iOS Permissions

Update `app.json` for iOS permissions:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow FairCare to access your camera to scan bills."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow FairCare to select images from your photo library."
        }
      ]
    ]
  }
}
```

### 4. Supabase Storage Bucket

Create a bucket for bill images:
```bash
# Create 'bill-captures' bucket in Supabase
# Set public access if needed
```

## Mobile-First UI Design

All screens are designed for iPhone dimensions:
- **Document Guide**: 340px wide (fits iPhone X-15)
- **Aspect Ratio**: Document format (0.6 ratio)
- **Button Sizes**: 70px capture button (touch-friendly)
- **Control Buttons**: 44px circular buttons (Apple HIG)
- **Spacing**: 16px gutters (standard mobile margin)
- **Typography**: 14-18px sizes for readability

### iPhone Compatibility
- iPhone 14/15 Pro Max: 430 × 932px
- iPhone 14/15 Pro: 393 × 852px
- iPhone 14/15: 390 × 844px
- iPhone SE: 375 × 667px

## Console Logging

All features include comprehensive logging for debugging:
- Camera: `Camera: ...`
- Storage: `Storage: ...`
- OCR: `OCR: ...`
- Upload: `UploadBill: ...`
- Processing: `Processing: ...`

Check console logs to debug issues.

## Error Handling

### Camera Permission Denied
Shows UI prompt to grant camera access.

### Storage Write Failed
Alerts user and logs error details.

### OCR Processing Failed
Shows error message with retry option on Processing screen.

### Network Errors
Caught by Supabase SDK and logged to console.

## Future Enhancements

1. **Auto-Capture**: Detect document edges and auto-capture when aligned
2. **Multi-Page PDFs**: Display page thumbnails and page selection
3. **Image Enhancement**: Crop, rotate, adjust brightness/contrast
4. **Offline Support**: Queue OCR jobs when offline
5. **Text Editing**: Edit extracted text inline before saving
6. **Batch Processing**: Queue multiple bill uploads
7. **Caching**: Cache OCR results locally
8. **Custom Models**: Fine-tune OCR for invoice/bill specific fields

## Troubleshooting

### "Camera permission denied"
- User needs to grant camera access in iOS Settings
- App will show UI button to request permission

### "Edge Function error"
- Verify Edge Function is deployed: `supabase functions list`
- Check environment variables are set: `supabase secrets list`
- Review Edge Function logs: `supabase functions logs ocr-extract`

### "No text extracted"
- Ensure image is clear and well-lit
- Document should be properly aligned
- Try different PDF/image files
- Check Google Cloud Vision API quota

### "Upload timeout"
- Check network connectivity
- Verify Supabase Storage bucket exists
- Check file size (compress if needed)

## API Rate Limits

Google Cloud Vision API includes:
- **Free Tier**: 1,000 requests/month
- **Paid**: ~$1.50 per 1,000 additional requests

Monitor usage in GCP Console to avoid unexpected charges.

## Security

- API keys stored securely in Supabase secrets
- Edge Function acts as API proxy (keys never exposed to client)
- All communications via HTTPS
- Images can be encrypted in transit and at rest
