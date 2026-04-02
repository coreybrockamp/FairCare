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

  // Find duplicates — only flag when CPT code AND charge amount match (within 10%)
  cptCodeMap.forEach((indices, cptCode) => {
    if (indices.length > 1) {
      const amounts = indices.map((i) => parseAmount(lineItems[i].total_charge));

      // Group indices by similar charge amount (within 10% of each other)
      const chargeGroups: number[][] = [];
      const assigned = new Set<number>();

      for (let i = 0; i < indices.length; i++) {
        if (assigned.has(i)) continue;
        const group = [indices[i]];
        assigned.add(i);

        for (let j = i + 1; j < indices.length; j++) {
          if (assigned.has(j)) continue;
          const avg = (amounts[i] + amounts[j]) / 2;
          const diff = Math.abs(amounts[i] - amounts[j]);
          if (avg === 0 || diff / avg <= 0.1) {
            group.push(indices[j]);
            assigned.add(j);
          }
        }

        chargeGroups.push(group);
      }

      // Only flag groups with 2+ items (same CPT and similar charge)
      for (const group of chargeGroups) {
        if (group.length < 2) continue;

        const firstItem = lineItems[group[0]];
        const description = getFieldValue(firstItem.description);
        const amount = parseAmount(firstItem.total_charge);

        errors.push({
          id: `duplicate_${cptCode}_${group[0]}`,
          error_type: 'duplicate',
          severity: 'high',
          confidence: 0.9,
          affected_line_items: group,
          description: `You were charged multiple times for ${description} (CPT ${cptCode}) at the same amount. This charge appears ${group.length} times on your bill.`,
          estimated_overcharge: amount * (group.length - 1),
          suggested_action: `Contact the provider to remove ${group.length - 1} duplicate charge(s) totaling $${(amount * (group.length - 1)).toFixed(2)}`,
        });
      }
    }
  });

  return errors;
}
