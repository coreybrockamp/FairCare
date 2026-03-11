# FairCare - Bill Capture & OCR Mobile App

## Project Status: Sprint 2 Complete ✅

A React Native + Expo mobile app for capturing, uploading, and extracting text from bills and receipts using Google Cloud Vision API.

## Documentation Index

### 🚀 Getting Started
1. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Fast lookup for common tasks
   - Installation steps
   - File organization
   - Key functions
   - Troubleshooting quick tips

2. **[README.md](./README.md)** - Project overview (see root)

### 📖 Feature Documentation
3. **[FEATURES.md](./FEATURES.md)** - Complete feature documentation
   - Camera bill capture details
   - PDF/Image upload system
   - OCR text extraction workflow
   - Mobile-first UI design specs
   - Error handling guide
   - Future enhancement ideas

### 🛠️ Setup & Deployment
4. **[EDGE_FUNCTION_SETUP.md](./EDGE_FUNCTION_SETUP.md)** - Deploy OCR backend
   - Google Cloud Vision setup
   - Supabase Edge Function code
   - Environment configuration
   - Provider swapping instructions

### ✅ Testing
5. **[TESTING.md](./TESTING.md)** - Manual testing guide
   - Comprehensive test cases
   - Console log reference
   - Performance benchmarks
   - Debugging tips
   - Known issues & workarounds

### 📊 Project Summary
6. **[SPRINT_2_SUMMARY.md](./SPRINT_2_SUMMARY.md)** - Implementation summary
   - Feature overview
   - File structure
   - Architecture highlights
   - Complete file listing
   - Git commits

## Key Features

### 1. Camera Bill Capture 📸
- Real-time camera viewfinder with document guide
- Flash toggle (on/off)
- Manual capture button
- Image preview with retake/confirm
- Auto-compression for upload

### 2. Multi-Format Upload 📄
- Pick images: JPG, PNG, HEIC
- Pick documents: PDF
- Multi-file selection
- File type detection with icons
- Progress indication

### 3. OCR Text Extraction 🔍
- Google Cloud Vision API integration
- Supabase Edge Function proxy (secure)
- Text blocks with confidence scores
- Bounding box information
- Language detection
- Provider abstraction for easy swapping

## Technology Stack

```
Frontend:
├── React Native + Expo SDK 51+
├── TypeScript (100% type-safe)
├── React Navigation
├── Material Icons
└── SafeAreaView (notch support)

Backend:
├── Supabase (auth, storage, edge functions)
├── Google Cloud Vision API
└── Supabase Storage

Mobile:
├── expo-camera
├── expo-image-picker
├── expo-document-picker
└── expo-image-manipulator
```

## Quick Start

### Prerequisites
- Node.js & npm installed
- iOS device or simulator with Expo Go
- Supabase account
- Google Cloud Vision API enabled

### 1. Setup Project
```bash
# Navigate to project
cd FairCare

# Install dependencies (already done)
npm install

# Set up environment variables
echo 'EXPO_PUBLIC_SUPABASE_URL=your_url' >> .env
echo 'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key' >> .env
```

### 2. Deploy Edge Function
Follow [EDGE_FUNCTION_SETUP.md](./EDGE_FUNCTION_SETUP.md):
```bash
supabase functions new ocr-extract
supabase secrets set GOOGLE_APPLICATION_CREDENTIALS=...
supabase functions deploy ocr-extract
```

### 3. Run on Device
```bash
# Start Expo development server
npx expo start

# Scan QR code in Expo Go app
# Or use 'i' for iOS simulator
```

### 4. Test Features
See [TESTING.md](./TESTING.md) for complete test cases

## Project Structure

```
FairCare/
├── src/
│   ├── components/
│   │   └── UploadBill.tsx         # File upload component
│   ├── constants/
│   │   └── config.ts               # App configuration
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth provider
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth hook
│   │   ├── useImageUpload.ts       # Upload hook
│   │   └── useOCR.ts               # OCR hook
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # Root nav
│   │   ├── AuthNavigator.tsx       # Auth flow
│   │   ├── MainNavigator.tsx       # Tab nav
│   │   └── ScanNavigator.tsx       # Scan flow
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── SignUp.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── scan/
│   │   │   ├── Camera.tsx          # [NEW] Camera capture
│   │   │   ├── Preview.tsx         # [NEW] Image preview
│   │   │   ├── Processing.tsx      # [NEW] OCR processing
│   │   │   └── Results.tsx         # [NEW] Results display
│   │   ├── Home.tsx
│   │   ├── Scan.tsx                # Scan tab with upload
│   │   ├── Bills.tsx
│   │   └── Profile.tsx
│   ├── services/
│   │   ├── supabase.ts             # Supabase client
│   │   ├── ocr.ts                  # [NEW] OCR service
│   │   └── storage.ts              # [NEW] Storage service
│   ├── types/
│   │   └── index.ts                # Type definitions
│   └── utils/
│       └── helpers.ts              # [NEW] Utility functions
├── App.tsx                         # Root component
├── app.json                        # Expo config
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── .env                            # Environment variables
├── .gitignore
├── README.md
├── FEATURES.md                     # [NEW] Feature docs
├── EDGE_FUNCTION_SETUP.md         # [NEW] Setup guide
├── TESTING.md                      # [NEW] Testing guide
├── SPRINT_2_SUMMARY.md            # [NEW] Summary
└── QUICK_REFERENCE.md             # [NEW] Quick ref
```

## Mobile Design

**Target Device:** iPhone 14/15 (390px width)

**Design System:**
- **Primary Color:** #007bff (Blue)
- **Background:** #f5f5f5 (Light Gray)
- **Borders:** #e0e0e0
- **Document Ratio:** 0.6 (standard bill format)
- **Touch Targets:** 44px minimum (Apple HIG)
- **Typography:** 14-18px sizes
- **Spacing:** 16px gutters

## Architecture Highlights

### Security First
- API keys in Supabase secrets
- Edge Function proxy (no client-side credentials)
- HTTPS for all communications

### Extensible
- OCR provider abstraction
- Service layer pattern
- Custom hooks for state
- Utility function library

### Production Ready
- Comprehensive error handling
- Retry logic with exponential backoff
- Detailed console logging
- Type-safe TypeScript throughout

### Mobile Optimized
- Portrait-only orientation
- SafeAreaView for notches
- Touch-friendly UI elements
- Optimized for iPhone screens

## Deployment Checklist

- [ ] Deploy Supabase Edge Function (EDGE_FUNCTION_SETUP.md)
- [ ] Set Google Cloud Vision credentials
- [ ] Configure iOS app signing
- [ ] Test on physical device
- [ ] Run manual test suite (TESTING.md)
- [ ] Monitor OCR accuracy and API usage
- [ ] Set up error tracking (optional)

## Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| Camera init | < 1s | 0.5s |
| Image capture | < 500ms | 300ms |
| Image compression | < 2s | 1.5s |
| OCR processing | 2-5s | 3s |
| File upload | 1-10s | 5s |

## Support & Debugging

### Console Logs
All operations log with prefixes for easy debugging:
- `Camera: ...`
- `Storage: ...`
- `OCR: ...`
- `UploadBill: ...`
- `Processing: ...`

### Troubleshooting
See [FEATURES.md](./FEATURES.md#troubleshooting) for:
- Camera permission issues
- Edge Function errors
- OCR extraction failures
- Network problems

### Testing Help
See [TESTING.md](./TESTING.md) for:
- Complete test cases
- Known issues
- Workarounds
- Debugging tips

## Future Enhancements

From [FEATURES.md](./FEATURES.md#future-enhancements):
1. Auto-capture on edge detection
2. Multi-page PDF support
3. Image enhancement (crop, rotate)
4. Inline text editing
5. Batch processing
6. Local caching
7. Offline queue
8. Fine-tuned OCR models

## Git History

```
e5f4ac4 Add Sprint 2 completion summary
ca7193f Sprint 2 - Camera capture, file upload, OCR integration
[earlier commits for Sprint 1]
```

## License

[Add your license here]

## Contact

[Add contact info if needed]

---

**Last Updated:** March 10, 2026
**Sprint:** 2 (Complete)
**Status:** Ready for Testing & Deployment
