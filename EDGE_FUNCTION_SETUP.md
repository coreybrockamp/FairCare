/**
 * Supabase Edge Function: OCR Text Extraction
 * 
 * This file documents the Edge Function that should be created in your Supabase project.
 * Location: supabase/functions/ocr-extract/index.ts
 * 
 * This function acts as a secure proxy to the Google Cloud Vision API, ensuring API keys
 * are never exposed to the client application.
 * 
 * Prerequisites:
 * 1. Set up Google Cloud Vision API in your GCP project
 * 2. Create a service account with Vision API permissions
 * 3. Download the service account key JSON
 * 4. Add GOOGLE_APPLICATION_CREDENTIALS to Supabase secrets
 * 
 * Setup Instructions:
 * 
 * 1. Create the Edge Function:
 *    supabase functions new ocr-extract
 * 
 * 2. Use this code as the implementation (supabase/functions/ocr-extract/index.ts):
 * 
 * import "jsr:@supabase/functions-js/cors";
 * import { serve } from "jsr:@supabase/functions-js";
 * import * as vision from "npm:@google-cloud/vision@4.0.0";
 * 
 * interface OCRRequest {
 *   imageBase64: string;
 *   imageUri?: string;
 * }
 * 
 * interface TextBlock {
 *   text: string;
 *   confidence: number;
 *   boundingBox: {
 *     top: number;
 *     left: number;
 *     width: number;
 *     height: number;
 *   };
 * }
 * 
 * interface OCRResponse {
 *   fullText: string;
 *   textBlocks: TextBlock[];
 *   language: string;
 *   error?: string;
 * }
 * 
 * serve(async (req) => {
 *   if (req.method === "OPTIONS") {
 *     return new Response("ok", { headers: corsHeaders });
 *   }
 * 
 *   try {
 *     const { imageBase64 } = await req.json() as OCRRequest;
 * 
 *     if (!imageBase64) {
 *       return new Response(
 *         JSON.stringify({ error: "imageBase64 is required" }),
 *         { status: 400, headers: corsHeaders }
 *       );
 *     }
 * 
 *     console.log("[OCR] Processing image for text extraction");
 * 
 *     // Initialize Vision API client
 *     const client = new vision.ImageAnnotatorClient({
 *       credentials: JSON.parse(Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS") || "{}"),
 *     });
 * 
 *     // Prepare the request
 *     const imageContent = Buffer.from(imageBase64, "base64");
 * 
 *     // Call Google Cloud Vision API
 *     const [result] = await client.documentTextDetection({
 *       image: { content: imageContent },
 *     });
 * 
 *     const fullTextAnnotation = result.fullTextAnnotation;
 *     const fullText = fullTextAnnotation?.text || "";
 *     const language = result.textAnnotations?.[0]?.locale || "unknown";
 * 
 *     // Parse text blocks
 *     const textBlocks: TextBlock[] = (result.textAnnotations || [])
 *       .slice(1) // Skip the first element which is the full text
 *       .map((annotation) => {
 *         const vertices = annotation.boundingPoly?.vertices || [];
 *         const top = Math.min(...vertices.map((v) => v.y || 0));
 *         const left = Math.min(...vertices.map((v) => v.x || 0));
 *         const bottom = Math.max(...vertices.map((v) => v.y || 0));
 *         const right = Math.max(...vertices.map((v) => v.x || 0));
 * 
 *         return {
 *           text: annotation.description || "",
 *           confidence: annotation.confidence || 0,
 *           boundingBox: {
 *             top,
 *             left,
 *             width: right - left,
 *             height: bottom - top,
 *           },
 *         };
 *       });
 * 
 *     console.log(`[OCR] Extraction complete: ${textBlocks.length} blocks found`);
 * 
 *     return new Response(
 *       JSON.stringify({
 *         fullText,
 *         textBlocks,
 *         language,
 *       } as OCRResponse),
 *       {
 *         headers: { ...corsHeaders, "Content-Type": "application/json" },
 *         status: 200,
 *       }
 *     );
 *   } catch (error) {
 *     console.error("[OCR] Error:", error);
 *     return new Response(
 *       JSON.stringify({
 *         error: error instanceof Error ? error.message : "Unknown error",
 *         fullText: "",
 *         textBlocks: [],
 *         language: "unknown",
 *       } as OCRResponse),
 *       {
 *         headers: { ...corsHeaders, "Content-Type": "application/json" },
 *         status: 500,
 *       }
 *     );
 *   }
 * });
 * 
 * 3. Set environment variables in Supabase:
 *    supabase secrets set GOOGLE_APPLICATION_CREDENTIALS=$(cat path/to/service-account-key.json)
 * 
 * 4. Deploy the function:
 *    supabase functions deploy ocr-extract
 * 
 * 5. Update the OCR service configuration:
 *    - Set the Edge Function URL in supabase.ts or as an environment variable
 *    - The OCR service will automatically use it for requests
 * 
 * API Provider Swapping:
 * To swap from Google Cloud Vision to another provider (e.g., AWS Textract, Azure Vision):
 * 1. Create a new Edge Function with a similar interface
 * 2. Update the supabase.functions.invoke() call in src/services/ocr.ts
 * 3. The rest of the app code remains unchanged
 * 
 * Supported Alternative Providers:
 * - AWS Textract
 * - Microsoft Azure Computer Vision
 * - OpenAI Vision API
 * - Tesseract (local OCR)
 */

export const EDGE_FUNCTION_SETUP = `
This documentation file explains how to set up the OCR Edge Function.
See comments above for detailed instructions.
`;
