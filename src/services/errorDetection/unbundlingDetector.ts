import { DetectedError, ParsedBill } from './types';

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

// CCI (Correct Coding Initiative) edit pairs - codes that should be bundled when billed together
// Format: [primary_code, secondary_code, should_bundle]
const CCI_PAIRS = [
  ['99213', '90834', true], // Office visit + therapy on same day
  ['99214', '90834', true], // Office visit + therapy on same day
  ['99215', '90834', true], // Office visit + therapy on same day
  ['70450', '70553', true], // CT brain w/o contrast + CT head
  ['71020', '71045', true], // Chest X-ray PA + Chest X-ray lateral
  ['80053', '80054', true], // Comprehensive metabolic panel + lipid panel
  ['81000', '81001', true], // Urinalysis + microscopy
  ['92004', '92012', true], // Comprehensive eye exam + intermediate
  ['99217', '99218', true], // Observation discharge + admission
  ['27447', '27450', true], // Total knee replacement with/without patella
  ['19307', '19316', true], // Breast conservation + axillary node dissection
  ['43235', '43236', true], // Upper endoscopy + biopsy
  ['45398', '45399', true], // Colonoscopy + biopsy
  ['60200', '60210', true], // Thyroidectomy partial + total
  ['76700', '76705', true], // Ultrasound abdomen + pelvis
  ['93000', '93040', true], // EKG + interpretation
  ['99233', '99234', true], // Hospital visit + consultation
  ['24430', '24435', true], // Shoulder surgery variations
  ['99291', '99292', true], // Critical care + subsequent critical care
  ['36000', '36410', true], // Venipuncture + IV line placement
];

export function detectUnbundling(bill: ParsedBill): DetectedError[] {
  const errors: DetectedError[] = [];
  const lineItems = bill.line_items || [];

  const cptCodes = lineItems.map((item) => getFieldValue(item.cpt_code));

  // Check for CCI pairs
  CCI_PAIRS.forEach((pair) => {
    const [primary, secondary] = pair;
    const primaryIdx = cptCodes.findIndex((code) => code === primary);
    const secondaryIdx = cptCodes.findIndex((code) => code === secondary);

    if (primaryIdx !== -1 && secondaryIdx !== -1) {
      const primaryItem = lineItems[primaryIdx];
      const secondaryItem = lineItems[secondaryIdx];
      const primaryCharge = parseAmount(primaryItem.total_charge);
      const secondaryCharge = parseAmount(secondaryItem.total_charge);

      errors.push({
        id: `unbundling_${primary}_${secondary}`,
        error_type: 'unbundling',
        severity: 'high',
        confidence: 0.85,
        affected_line_items: [primaryIdx, secondaryIdx],
        description: `Your bill includes both CPT ${primary} and CPT ${secondary}, which are often unbundled (billed separately when they should be combined). When billed together, one should typically be reduced or bundled. Combined charge: $${(primaryCharge + secondaryCharge).toFixed(2)}.`,
        estimated_overcharge: secondaryCharge * 0.5, // Estimate 50% of secondary charge as overcharge
        suggested_action: `Request a corrected bill with proper bundling applied. One of these charges may be reduced or removed per insurance guidelines.`,
      });
    }
  });

  return errors;
}
