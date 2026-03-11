# FairCare Quick Reference

## Installation & Setup

### 1. Install Dependencies (Already Done)
```bash
npx expo install expo-camera expo-image-manipulator expo-document-picker expo-image-picker
```

### 2. Set Up Supabase Edge Function
Follow `EDGE_FUNCTION_SETUP.md` to:
- Create `ocr-extract` Edge Function
- Set Google Cloud Vision credentials
- Deploy the function

### 3. Configure iOS Permissions
Update `app.json`:
```json
"plugins": [
  ["expo-camera", { "cameraPermission": "Allow FairCare to access your camera" }],
  ["expo-image-picker", { "photosPermission": "Allow FairCare to select images" }]
]
```

### 4. Create Supabase Storage Bucket
In Supabase Console:
- Create bucket: `bill-captures`
- Set appropriate access level

## File Organization

**Camera Flow:**
- `Camera.tsx` → Capture image
- `Preview.tsx` → Review & confirm
- `Processing.tsx` → Extract text with OCR
- `Results.tsx` → Display results

**Upload Flow:**
- `UploadBill.tsx` → Select file
- Auto-routes to Processing → Results

**Services:**
- `ocr.ts` - OCR API calls
- `storage.ts` - Local file I/O
- `supabase.ts` - Supabase client (existing)

**Utilities:**
- `helpers.ts` - Shared utility functions
- `config.ts` - App constants

**Hooks:**
- `useAuth.ts` - Authentication (existing)
- `useImageUpload.ts` - Upload management
- `useOCR.ts` - OCR processing

## Key Functions

### OCR Service
```typescript
import { extractTextFromImage, uploadAndProcessImage } from '@/services/ocr'

// Extract text from image
const result = await extractTextFromImage(imageUri, imageBase64)

// Upload and process in one call
const { storagePath, ocrResult } = await uploadAndProcessImage(
  imageBase64,
  'bill-123.jpg',
  (progress) => console.log(progress) // 0-100
)
```

### Storage Service
```typescript
import { 
  saveImageToStorage,
  readImageAsBase64,
  compressImage
} from '@/services/storage'

// Save captured image
const path = await saveImageToStorage(uri, 'bill-1.jpg')

// Convert to base64 for API
const base64 = await readImageAsBase64(path)

// Compress for upload
const compressed = await compressImage(uri, 0.8)
```

### Custom Hooks
```typescript
import { useImageUpload } from '@/hooks/useImageUpload'
import { useOCR } from '@/hooks/useOCR'

// Upload hook
const { isUploading, progress, error, uploadImage } = useImageUpload()
await uploadImage(imageUri)

// OCR hook
const { isProcessing, result, error, processImage } = useOCR()
await processImage(imageUri, base64)
```

### Helper Functions
```typescript
import { formatFileSize, getFileIconName, validateFile } from '@/utils/helpers'

const size = formatFileSize(1024000) // "1000 KB"
const icon = getFileIconName('application/pdf') // "picture-as-pdf"
const valid = validateFile('invoice.pdf') // { isValid: true }
```

## Navigation Routes

### Main App Tabs
- `Home` - Dashboard
- `Scan` - Bill capture/upload (has sub-tabs)
- `Bills` - Bill history
- `Profile` - User settings

### Scan Sub-Screens
- `Camera` - Capture photo
- `Preview` - Review photo
- `Processing` - Extract text (auto-transitions)
- `Results` - Show extracted text

## Console Logs to Watch For

**Success Flow:**
```
Camera: Capturing image...
Storage: Saving image to app storage: bill-1234.jpg
Storage: Image read as base64, size: 125432
OCR: Starting text extraction
Supabase signUp response: { data: {...}, error: null }
Processing: OCR complete, success: true
```

**Error Cases:**
```
Camera: Capture failed: <error message>
Storage: Failed to save image: <error message>
OCR: Edge Function error: <error message>
Processing: Retry failed: <error message>
```

## Testing Checklist

- [ ] Camera captures image correctly
- [ ] Image previews properly
- [ ] OCR processing works (if Edge Function deployed)
- [ ] File upload works
- [ ] Results screen displays text
- [ ] Retake returns to camera
- [ ] Error messages show on failures

## Troubleshooting

**"Camera permission denied"**
→ User must grant in Settings > Privacy > Camera

**"Edge Function not found"**
→ Verify deployed: `supabase functions list`

**"No text extracted"**
→ Try clearer image, better lighting, different file

**"Network error"**
→ Check internet connection, Supabase credentials

## File Sizes & Performance

| Item | Target |
|------|--------|
| Captured image | < 2 MB (auto-compressed) |
| OCR processing | 2-5 seconds |
| File upload | 1-10 seconds |
| UI responsiveness | < 100ms |

## API Rate Limits

Google Cloud Vision (Free Tier):
- 1,000 requests/month free
- $1.50 per 1,000 additional requests
- Monitor in GCP Console

## Mobile Design Specs

**iPhone Target:**
- 390px width (iPhone 14)
- Portrait orientation only
- 44px min touch targets
- SafeAreaView for notches
- Document ratio: 0.6 (bill format)

**Colors:**
- Primary: #007bff (blue)
- Background: #f5f5f5 (light gray)
- Border: #e0e0e0
- Text: #000 / #333 / #666 / #999

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
# Note: Google Cloud creds stored in Supabase secrets, not client
```

## Documentation Files

- `FEATURES.md` - Detailed feature docs
- `EDGE_FUNCTION_SETUP.md` - Deployment guide
- `TESTING.md` - Test cases & debugging
- `SPRINT_2_SUMMARY.md` - Implementation summary
- `README.md` - General project info

## Next Steps

1. Deploy Edge Function (see EDGE_FUNCTION_SETUP.md)
2. Test manually (see TESTING.md)
3. Monitor OCR accuracy
4. Plan enhancements (auto-capture, batch processing, etc.)

## Support

- Check console logs first (search for error prefix)
- Review test cases in TESTING.md
- Check troubleshooting in FEATURES.md
- Review implementation in source files
