import "@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const imageBase64 = body.imageBase64;

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Missing imageBase64' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are a medical insurance EOB (Explanation of Benefits) expert. Extract structured data from EOB documents accurately.

CRITICAL RULES:
- Return ONLY valid JSON, no explanation, no markdown, no backticks
- Extract EVERY line item — do not skip any services
- All monetary values should be strings with no $ sign (e.g. "150.00")
- If a field is not found, use null
- Add confidence_score (0-1) for each field based on how clearly it appears on the document

Return this exact JSON structure:
{
  "insurance_company": {"value": "...", "confidence_score": 0.95},
  "member_name": {"value": "...", "confidence_score": 0.95},
  "claim_date": {"value": "...", "confidence_score": 0.9},
  "line_items": [
    {
      "description": "Office Visit",
      "billed_amount": {"value": "250.00", "confidence_score": 0.95},
      "allowed_amount": {"value": "180.00", "confidence_score": 0.9},
      "insurance_paid": {"value": "144.00", "confidence_score": 0.9},
      "patient_responsibility": {"value": "36.00", "confidence_score": 0.9}
    }
  ],
  "total_billed": {"value": "...", "confidence_score": 0.9},
  "total_allowed": {"value": "...", "confidence_score": 0.9},
  "total_insurance_paid": {"value": "...", "confidence_score": 0.9},
  "total_patient_responsibility": {"value": "...", "confidence_score": 0.95}
}`;

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
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: "Extract all data from this EOB document. Remember: include ALL line items and return ONLY valid JSON." }
          ]
        }]
      }),
    });

    const data = await resp.json();
    const text = data.content?.[0]?.text || "{}";

    let parsed = {};
    try {
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
