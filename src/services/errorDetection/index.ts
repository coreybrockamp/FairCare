import { DetectedError, ParsedBill } from './types';
import { detectDuplicates } from './duplicateDetector';
import { detectUpcoding } from './upcodingDetector';
import { detectUnbundling } from './unbundlingDetector';

export function runErrorDetection(bill: ParsedBill): DetectedError[] {
  const errors: DetectedError[] = [];

  // Run all detectors
  const duplicates = detectDuplicates(bill);
  const upcoding = detectUpcoding(bill);
  const unbundling = detectUnbundling(bill);

  // Combine results
  errors.push(...duplicates, ...upcoding, ...unbundling);

  // Sort by severity (high → medium → low) and confidence (high to low)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  errors.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.confidence - a.confidence;
  });

  return errors;
}

export { DetectedError, ParsedBill } from './types';
