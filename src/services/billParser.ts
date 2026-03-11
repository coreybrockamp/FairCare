import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';

// NOTE: this is a naive reversible "encryption" using XOR with a SHA256-derived keystream.
// In a real app you'd use a proper crypto library and protect the key securely.
const ENCRYPTION_SECRET = process.env.EXPO_APP_ENCRYPTION_SECRET || 'default_secret';

async function deriveKey(): Promise<Uint8Array> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, ENCRYPTION_SECRET);
  // convert hex string to bytes
  const bytes = new Uint8Array(digest.match(/.{2}/g)!.map((h: string) => parseInt(h, 16)));
  return bytes;
}

function xorEncrypt(text: string, key: Uint8Array): string {
  const input = new TextEncoder().encode(text);
  const output = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] ^ key[i % key.length];
  }
  // base64 encode
  return Buffer.from(output).toString('base64');
}

function xorDecrypt(data: string, key: Uint8Array): string {
  const input = Buffer.from(data, 'base64');
  const output = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] ^ key[i % key.length];
  }
  return new TextDecoder().decode(output);
}

export async function parseBill(ocrText: string) {
  // call the edge function
  // use Supabase Functions SDK to invoke
  const { data, error } = await supabase.functions.invoke('parse-bill', {
    body: JSON.stringify({ ocrText }),
  });
  if (error) throw error;
  return data;
}

export async function parseEob(ocrText: string) {
  const { data, error } = await supabase.functions.invoke('parse-eob', {
    body: JSON.stringify({ ocrText }),
  });
  if (error) throw error;
  return data;
}

export async function createBill(rawOcr: string, imageUri: string) {
  const { data, error } = await supabase.from('bills').insert({
    raw_ocr_text: rawOcr,
    images: imageUri,
    status: 'uploaded',
  });
  if (error) throw error;
  return data?.[0];
}

export async function saveParsedEob(billId: string, parsedData: any) {
  const { data, error } = await supabase
    .from('eobs')
    .insert({ bill_id: billId, parsed_data: parsedData });
  if (error) throw error;
  return data;
}

export async function saveParsedBill(billId: string, parsedData: any) {
  const key = await deriveKey();
  const toStore = { ...parsedData };
  if (toStore.patient_name) {
    toStore.patient_name = xorEncrypt(toStore.patient_name, key);
    toStore.patient_name_enc = true;
  }
  if (toStore.provider_name) {
    toStore.provider_name = xorEncrypt(toStore.provider_name, key);
    toStore.provider_name_enc = true;
  }

  const { data, error } = await supabase
    .from('bills')
    .update({
      parsed_data: toStore,
    })
    .eq('id', billId);
  if (error) throw error;
  return data;
}

export async function decryptField(encrypted: string) {
  const key = await deriveKey();
  return xorDecrypt(encrypted, key);
}
