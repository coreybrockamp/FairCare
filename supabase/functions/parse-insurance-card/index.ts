// deno-lint-ignore-file
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

    const systemPrompt = `You are an expert at reading health insurance cards. Extract structured data from insurance card images accurately.

CRITICAL RULES:
- Return ONLY valid JSON, no explanation, no markdown, no backticks
- Extract all visible fields from the card
- If a field is not found or not visible, use null for the value
- Add confidence_score (0-1) for each field based on how clearly it appears on the card
- plan_type should be one of: HMO, PPO, EPO, POS, HDHP, or null if unclear

Return this exact JSON structure:
{
  "insurance_company": {"value": "...", "confidence_score": 0.95},
  "member_id": {"value": "...", "confidence_score": 0.95},
  "group_number": {"value": "...", "confidence_score": 0.9},
  "plan_name": {"value": "...", "confidence_score": 0.9},
  "plan_type": {"value": "PPO", "confidence_score": 0.85},
  "effective_date": {"value": "01/01/2025", "confidence_score": 0.9}
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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: "Extract all data from this insurance card. Return ONLY valid JSON." }
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
    } catch (e) {
      // If JSON has syntax errors, ask Claude to fix it
      try {
        const fixResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 2000,
            messages: [{ role: "user", content: "Fix this JSON so it is valid. Return ONLY the fixed JSON with no explanation or backticks:\n" + text }]
          })
        });
        const fixData = await fixResp.json();
        const fixedText = fixData.content?.[0]?.text || "{}";
        parsed = JSON.parse(fixedText.replace(/```json|```/g, "").trim());
      } catch (e2) {
        parsed = { raw: text };
      }
    }

    return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
