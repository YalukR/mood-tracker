/** Genera una sal aleatoria en hexadecimal usando Web Crypto (disponible nativamente en el WebView de Capacitor) */
export function generateSaltHex(bytes = 16): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

/** Hashea un valor junto con su sal usando SHA-256 */
export async function hashWithSalt(value: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}