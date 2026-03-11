import "@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const ocrText: string | undefined = body.ocrText;

    if (!ocrText) {
      return new Response(JSON.stringify({ error: 'Missing ocrText field' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract structured data from this medical bill and return ONLY a valid JSON object with no explanation. Include these fields: patient_name, provider_name, provider_address, service_date, line_items (array with cpt_code, description, quantity, unit_charge, total_charge), subtotal, insurance_adjustments, patient_responsibility, total_due. Add a confidence_score (0-1) for each field.\n\nBill text:\n${ocrText}`
        }]
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';
    
    let parsed: any = {};
    try {
      const clean = content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('parse-bill error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});