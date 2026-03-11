// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

console.log("parse-bill edge function loaded")

// Very basic parse-bill handler: accepts OCR text and returns JSON result.
// In a real implementation this might call an AI service or perform regex parsing.
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

    // call Anthropic Claude to extract structured bill info
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    const prompt = `You are an assistant that extracts JSON data from medical bill text.\n` +
      `Return a JSON object with these properties: patient_name, provider_name, provider_address, service_date, line_items (array of objects with cpt_code, description, quantity, unit_charge, total_charge), subtotal, insurance_adjustments, patient_responsibility, total_due. For every field include a confidence_score between 0 and 1. \n` +
      `Here is the bill text:\n"""\n${ocrText}\n"""\n`;

    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-2',
        prompt,
        max_tokens: 1000,
      }),
    });

    const text = await response.text();
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Claude response', text);
      parsed = { raw: text };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('parse-bill error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/parse-bill' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
