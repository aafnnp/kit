function toBinary(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return binary
}

function fromBinary(binary: string): string {
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
}

export function encodeBase64(text: string, urlSafe = false): string {
  const base64 = btoa(toBinary(text))
  return urlSafe ? base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : base64
}

export function decodeBase64(text: string, urlSafe = false): string {
  let value = text.trim().replace(/\s+/g, "")
  if (urlSafe) value = value.replace(/-/g, "+").replace(/_/g, "/")
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error("Invalid Base64 input")
  while (value.length % 4 !== 0) value += "="
  return fromBinary(atob(value))
}
