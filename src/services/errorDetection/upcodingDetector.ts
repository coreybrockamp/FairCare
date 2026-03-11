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

// E&M code pricing (typical Medicare rates)
const EM_CODES: { [key: string]: { description: string; typicalPrice: number } } = {
  '99211': { description: 'Established patient, minimal', typicalPrice: 50 },
  '99212': { description: 'Established patient, low', typicalPrice: 85 },
  '99213': { description: 'Established patient, moderate', typicalPrice: 150 },
  '99214': { description: 'Established patient, high', typicalPrice: 200 },
  '99215': { description: 'Established patient, highest', typicalPrice: 300 },
};

export function detectUpcoding(bill: ParsedBill): DetectedError[] {
  const errors: DetectedError[] = [];
  const lineItems = bill.line_items || [];

  const cptCodes = lineItems
    .map((item) => getFieldValue(item.cpt_code))
    .filter((code) => code && code in EM_CODES);

  // Check if highest complexity code (99215) is used
  const has99215 = cptCodes.some((code) => code === '99215');

  if (has99215) {
    const item99215 = lineItems.find((item) => getFieldValue(item.cpt_code) === '99215');
    if (item99215) {
      const chargedAmount = parseAmount(item99215.total_charge);
      const typicalAmount = EM_CODES['99215'].typicalPrice;
      const typicalLowerCode = EM_CODES['99213'].typicalPrice;
      const estimatedOvercharge = chargedAmount - typicalLowerCode;

      errors.push({
        id: 'upcoding_99215',
        error_type: 'upcoding',
        severity: 'medium',
        confidence: 0.75,
        affected_line_items: [lineItems.indexOf(item99215)],
        description: `Your office visit was billed at the highest complexity level (99215, ~$${typicalAmount}). A typical established patient visit is coded as 99213 (~$${typicalLowerCode}). Potential overcharge: $${estimatedOvercharge.toFixed(2)}.`,
        estimated_overcharge: Math.max(0, estimatedOvercharge),
        suggested_action: `Ask the provider why the highest complexity code was used. Request adjustment to 99213 if your visit was routine.`,
      });
    }
  }

  return errors;
}
