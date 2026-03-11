# FairCare Testing Guide

## Manual Testing Checklist

### 1. Camera Bill Capture

**Setup**
- [ ] App is running on iOS device or simulator
- [ ] Device has camera access enabled in Settings
- [ ] Good lighting in testing environment

**Test Cases**

#### T1.1 - Camera Permission Request
- [ ] Tap "Scan" tab
- [ ] If first launch, permission dialog appears
- [ ] User taps "Allow" → camera initializes
- [ ] Document guide overlay visible with white border

#### T1.2 - Camera Controls
- [ ] Flash button visible in top-right
- [ ] Flash icon is gray (off)
- [ ] Tapping flash toggles to yellow (on)
- [ ] Tapping again toggles back to gray (off)
- [ ] Cancel button (X) in top-left closes camera

#### T1.3 - Image Capture
- [ ] Position document within guide rectangle
- [ ] Tap large capture button at bottom
- [ ] Loading indicator appears briefly
- [ ] Image preview screen opens with captured image
- [ ] Image is in portrait orientation

#### T1.4 - Preview Actions
- [ ] "Retake" button returns to camera
- [ ] "Confirm" button saves image and proceeds
- [ ] Confirming shows "Processing Bill" screen
- [ ] Processing screen shows loading spinner

### 2. Image Upload

**Setup**
- Required: Image files on device (JPG, PNG, HEIC)
- Required: PDF file on device

**Test Cases**

#### T2.1 - Pick Photo from Camera Roll
- [ ] See "Pick Photo" button in UI
- [ ] Tapping button opens camera roll picker
- [ ] User can select an image
- [ ] Selected image appears in file list
- [ ] File name and size display correctly

#### T2.2 - Pick Document
- [ ] See "Pick File" button in UI
- [ ] Tapping button opens document picker
- [ ] User can select a PDF
- [ ] PDF appears in file list with PDF icon
- [ ] File name and size display correctly

#### T2.3 - File Management
- [ ] Multiple files can be selected
- [ ] Each file shows appropriate icon (image/PDF)
- [ ] File size formatted correctly (KB, MB, GB)
- [ ] Tapping X button removes file from list
- [ ] File list updates immediately

#### T2.4 - Unsupported Files
- [ ] Try selecting unsupported file (e.g., .doc)
- [ ] If selected, error alert appears
- [ ] File is not added to list
- [ ] User can try again with correct file

### 3. OCR Processing

**Setup**
- Required: Supabase Edge Function deployed
- Required: Google Cloud Vision API configured
- Required: Valid API credentials

**Test Cases**

#### T3.1 - Processing Screen
- [ ] After confirming capture, processing screen appears
- [ ] Title shows "Processing Bill"
- [ ] Loading spinner is visible
- [ ] Subtitle shows "Extracting text from image..."
- [ ] Screen is non-interactive (user can't go back)

#### T3.2 - Successful OCR
- [ ] Processing completes (usually 2-5 seconds)
- [ ] Results screen appears automatically
- [ ] Extracted text is visible
- [ ] Text blocks are listed with confidence scores
- [ ] Image can be toggled with "Show/Hide Captured Image"

#### T3.3 - OCR Failure Handling
- [ ] Try with blank/invalid image
- [ ] Processing fails with error message
- [ ] "Retry" button appears on processing screen
- [ ] Tapping retry retries the operation
- [ ] "Cancel" button returns to camera

#### T3.4 - Results Screen
- [ ] Full extracted text displayed at top
- [ ] Text blocks listed below with confidence %
- [ ] Image preview available (toggle-able)
- [ ] File info section shows:
  - File name
  - Language detected
  - Number of text blocks
- [ ] Edit button available (shows "Coming soon" alert)
- [ ] "Retake" button returns to camera
- [ ] "Accept" button shows success alert

### 4. Network & Offline

**Test Cases**

#### T4.1 - Network Unavailable
- [ ] Enable Airplane Mode
- [ ] Try to process image
- [ ] Error displayed after timeout
- [ ] Can retry when network is available

#### T4.2 - Slow Network
- [ ] Throttle network to slow 3G
- [ ] Process image
- [ ] Progress indicator updates
- [ ] Processing completes successfully

### 5. Edge Cases

**Test Cases**

#### T5.1 - Large File
- [ ] Try uploading 10MB+ file
- [ ] File is compressed automatically
- [ ] Processing completes normally

#### T5.2 - Low Storage
- [ ] Device has <50MB free storage
- [ ] Try to capture image
- [ ] Graceful error or compression applied

#### T5.3 - Multiple Rapid Taps
- [ ] Rapidly tap capture button
- [ ] Only one image captured
- [ ] No duplicate submissions

## Automated Testing Commands

### Build and Type Check
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Build the app
npm run build  # if available
```

### Lint
```bash
# Check for code style issues
npm run lint  # if configured
```

## Console Log Inspection

Open browser/simulator console and look for logs:

### Camera
```
Camera: Capturing image...
Camera: Image captured, processing...
```

### Storage
```
Storage: Saving image to app storage: bill-1710086400000.jpg
Storage: Image saved to: file:///.../captured-bills/bill-1710086400000.jpg
Storage: Reading image as base64: ...
Storage: Image read as base64, size: 125432
```

### OCR
```
OCR: Starting text extraction from image: ...
OCR: Successfully extracted text, blocks: 45
Processing: Starting OCR extraction...
Processing: OCR complete, success: true
```

### Upload
```
UploadBill: Image selected: photo-123.jpg
UploadBill: Document selected: invoice.pdf
```

## Test Environment Setup

### Simulator/Emulator
```bash
# For iOS Simulator
npx expo start --ios

# For Android Emulator  
npx expo start --android
```

### Test Image Resources

**Create a test image**
1. Use a real bill/invoice photo
2. Or create a text image with white background and black text
3. Or download sample invoices online

**Create a test PDF**
1. Use a blank PDF
2. Or export a document as PDF

## Performance Benchmarks

Expected performance on modern iPhone:

| Operation | Expected Time |
|-----------|----------------|
| Camera initialization | < 1 second |
| Image capture | < 500ms |
| Image compression | < 2 seconds |
| OCR processing | 2-5 seconds |
| File upload | 1-10 seconds (depends on file size) |

## Known Issues & Workarounds

### Issue: Camera Permission Not Persisting
**Workaround**: Uninstall and reinstall app, grant permissions

### Issue: Image Sideways in Preview
**Solution**: Image should be in portrait mode. Retake with correct orientation.

### Issue: OCR Returns Empty Text
**Solution**: Ensure image is clear, well-lit, and contains readable text

### Issue: Edge Function Returns 401
**Solution**: Check Supabase credentials and Edge Function deployment

## Debugging Tips

1. **Enable Console Logs**: Check terminal where `npm run web` was started
2. **Network Tab**: Inspect API requests to Edge Functions
3. **Storage Tab**: Verify images are saved to Supabase
4. **React Native Debugger**: For complex state issues
5. **Expo Logs**: Run `expo logs` for real device debugging

## Reporting Issues

Include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Console logs/errors
5. Device model and iOS version
6. File size and type if applicable
