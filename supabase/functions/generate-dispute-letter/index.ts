import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillData {
  total_due?: string | number;
  subtotal?: string | number;
  patient_responsibility?: string | number;
  line_items?: Array<{
    cpt_code?: string;
    description?: string;
    total_charge?: string | number;
  }>;
}

interface DetectedError {
  error_type: string;
  severity: string;
  description: string;
  estimated_overcharge: number;
  affected_line_items?: number[];
}

interface InsuranceData {
  company: string;
  memberId: string;
  groupNumber: string;
  planName: string;
}

interface RequestBody {
  billData: BillData;
  errors: DetectedError[];
  patientName: string;
  providerName: string;
  userAddress?: string;
  insuranceData?: InsuranceData | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { billData, errors, patientName, providerName, userAddress, insuranceData } = body;

    if (!billData || !errors || !patientName || !providerName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build error summary for the letter
    const errorSummary = errors
      .map((err) => {
        const overcharge = err.estimated_overcharge?.toFixed(2) || "0.00";
        return `• ${err.error_type.replace(/_/g, " ").toUpperCase()}: ${err.description} (Potential overcharge: $${overcharge})`;
      })
      .join("\n");

    const totalOvercharge = errors
      .reduce((sum, err) => sum + (err.estimated_overcharge || 0), 0)
      .toFixed(2);

    const systemPrompt = `You are a medical billing dispute expert. Write professional dispute letters. Output ONLY the letter itself starting with the date — no introduction, no explanation, no preamble. Start directly with the date line. Include the sender's address (if provided) in the letter header.`;

    const insuranceSection = insuranceData?.company
      ? `\nInsurance Company: ${insuranceData.company}
Member ID: ${insuranceData.memberId || "[Member ID]"}
Group Number: ${insuranceData.groupNumber || "[Group Number]"}
Plan Name: ${insuranceData.planName || "[Plan Name]"}\n`
      : `\nInsurance Company: [Your Insurance Company]
Member ID: [Your Member ID]
Group Number: [Your Group Number]\n`;

    const userPrompt = `Generate a professional dispute letter with these details:

Patient Name: ${patientName}
Patient Address: ${userAddress || "[Patient Address]"}
Provider/Facility: ${providerName}
${insuranceSection}
Bill Total Due: $${billData.total_due || "0.00"}
Patient Responsibility: $${billData.patient_responsibility || "0.00"}

Billing Errors Identified:
${errorSummary}

Total Estimated Overcharge: $${totalOvercharge}

Write the complete dispute letter in professional business letter format. Include today's date and the patient address in the letter header. Reference the patient's insurance company, member ID, and group number in the letter body — use the exact values provided above, never use placeholder brackets if real values are available. Make it clear, specific, and actionable. Output ONLY the letter with no preamble. Do NOT use any markdown formatting — no asterisks, no bold, no bullet symbols, no ## headers. Use plain text only with standard business letter formatting.`;

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate letter", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const letterContent = result.content[0]?.text || "";

    return new Response(
      JSON.stringify({ letter: letterContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
