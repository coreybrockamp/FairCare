import "@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const ocrText = body.ocrText;
    const imageBase64 = body.imageBase64;

    if (!ocrText && !imageBase64) {
      return new Response(JSON.stringify({ error: 'Missing ocrText or imageBase64' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are a medical billing expert. Extract structured data from medical bills accurately.

CRITICAL RULES:
- Return ONLY valid JSON, no explanation, no markdown, no backticks
- If the bill has multiple invoices or sections, combine ALL line items into one list
- CPT codes are 5-digit numeric codes (e.g. 87102, 88312). If no CPT codes are printed, use the description as cpt_code
- Extract EVERY line item — do not skip any charges
- total_due should be the TOTAL AMOUNT DUE on the entire bill, not just one section
- patient_responsibility is what the patient owes after insurance adjustments
- insurance_adjustments is the total amount insurance paid or adjusted
- If the bill says "FINAL NOTICE" or "COLLECTION AGENCY", set collection_warning to true
- For each line item: cpt_code (5-digit code or short description), description (full plain English description), quantity, unit_charge (charge per unit), total_charge (total for that line)
- Add confidence_score (0-1) for each field based on how clearly it appears on the bill

Return this exact JSON structure:
{
  "patient_name": {"value": "...", "confidence_score": 0.95},
  "provider_name": {"value": "...", "confidence_score": 0.95},
  "provider_address": {"value": "...", "confidence_score": 0.9},
  "service_date": {"value": "...", "confidence_score": 0.9},
  "line_items": [
    {
      "cpt_code": "87102",
      "description": "Fungus Culture, Skin Hair Nail",
      "quantity": 1,
      "unit_charge": "35.30",
      "total_charge": "35.30"
    }
  ],
  "subtotal": {"value": "...", "confidence_score": 0.9},
  "insurance_adjustments": {"value": "...", "confidence_score": 0.9},
  "patient_responsibility": {"value": "...", "confidence_score": 0.9},
  "total_due": {"value": "...", "confidence_score": 0.95},
  "collection_warning": false,
  "multiple_invoices": false
}`;

    const userPrompt = `Extract all data from this medical bill. Remember: include ALL line items from ALL sections/invoices, and return ONLY valid JSON.`;

    const msgContent = imageBase64
      ? [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text", text: userPrompt }
        ]
      : userPrompt + "\n\nBill text:\n" + ocrText;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: msgContent }]
      }),
    });

    const data = await resp.json();
    const text = data.content?.[0]?.text || "{}";

    let parsed = {};
    try {
      // Clean the text and try to parse
      const cleaned = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch(e) {
      // If JSON has syntax errors, ask Claude to fix it
      try {
        const fixResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 4000,
            messages: [{ role: "user", content: "Fix this JSON so it is valid. Return ONLY the fixed JSON with no explanation or backticks:\n" + text }]
          })
        });
        const fixData = await fixResp.json();
        const fixedText = fixData.content?.[0]?.text || "{}";
        parsed = JSON.parse(fixedText.replace(/```json|```/g, "").trim());
      } catch(e2) {
        parsed = { raw: text };
      }
    }

    return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
