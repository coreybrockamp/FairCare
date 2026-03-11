import { DetectedError, LineItem, ParsedBill } from './types';

const getFieldValue = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'object' && val.value !== undefined) return String(val.value);
  return String(val);
};

const parseAmount = (val: any): number => {
  const str = getFieldValue(val);
  const numStr = str.replace(/[^0-9.]/g, '');
  return parseFloat(numStr) || 0;
};

export function detectDuplicates(bill: ParsedBill): DetectedError[] {
  const errors: DetectedError[] = [];
  const lineItems = bill.line_items || [];

  if (lineItems.length < 2) return errors;

  // Check for exact duplicate CPT codes
  const cptCodeMap = new Map<string, number[]>();
  lineItems.forEach((item, idx) => {
    const cptCode = getFieldValue(item.cpt_code);
    if (cptCode) {
      if (!cptCodeMap.has(cptCode)) {
        cptCodeMap.set(cptCode, []);
      }
      cptCodeMap.get(cptCode)!.push(idx);
    }
  });

  // Find duplicates
  cptCodeMap.forEach((indices, cptCode) => {
    if (indices.length > 1) {
      const items = indices.map((i) => lineItems[i]);
      const firstItem = items[0];
      const description = getFieldValue(firstItem.description);
      const amount = parseAmount(firstItem.total_charge);

      errors.push({
        id: `duplicate_${cptCode}`,
        error_type: 'duplicate',
        severity: 'high',
        confidence: 0.9,
        affected_line_items: indices,
        description: `You were charged multiple times for ${description} (CPT ${cptCode}). This charge appears ${indices.length} times on your bill.`,
        estimated_overcharge: amount * (indices.length - 1),
        suggested_action: `Contact the provider to remove ${indices.length - 1} duplicate charge(s) totaling $${(amount * (indices.length - 1)).toFixed(2)}`,
      });
    }
  });

  return errors;
}
