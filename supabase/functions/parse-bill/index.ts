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
    const msgContent = imageBase64
      ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } }, { type: 'text', text: 'Extract data from this medical bill and return ONLY valid JSON with: patient_name, provider_name, provider_address, service_date, line_items (array with cpt_code, description, quantity, unit_charge, total_charge), subtotal, insurance_adjustments, patient_responsibility, total_due. Add confidence_score per field.' }]
      : 'Extract bill data and return ONLY valid JSON: ' + ocrText;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 2000, messages: [{ role: 'user', content: msgContent }] }),
    });
    const data = await resp.json();
    const text = data.content?.[0]?.text || '{}';
    let parsed = {};
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch(e) { parsed = { raw: text }; }
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
