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
  return btoa(String.fromCharCode(...output));
}

function xorDecrypt(data: string, key: Uint8Array): string {
  const input = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const output = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] ^ key[i % key.length];
  }
  return new TextDecoder().decode(output);
}

export async function parseBill(input: { ocrText?: string; imageBase64?: string }) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL + '/functions/v1/parse-bill';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key, 'apikey': key },
    body: JSON.stringify(input),
  });
  const text = await response.text();
  if (response.status !== 200) throw new Error('parse-bill failed: ' + text);
  return JSON.parse(text);
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
  }).select();
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
  // Store names as plain text for now - encryption to be re-implemented with proper key management
  if (toStore.patient_name) {
    toStore.patient_name = typeof toStore.patient_name === 'object' ? (toStore.patient_name.value || '') : toStore.patient_name;
  }
  if (toStore.provider_name) {
    toStore.provider_name = typeof toStore.provider_name === 'object' ? (toStore.provider_name.value || '') : toStore.provider_name;
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
  if (!encrypted || typeof encrypted !== 'string') return encrypted;
  // If it looks like plain text (not base64), return as-is
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  if (!base64Regex.test(encrypted) || encrypted.length < 8) return encrypted;
  try {
    const key = await deriveKey();
    const decrypted = xorDecrypt(encrypted, key);
    // If decrypted result is garbled (non-printable chars), return original
    if (/[^ -~]/.test(decrypted)) return encrypted;
    return decrypted;
  } catch(e) {
    return encrypted;
  }
}
