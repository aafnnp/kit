import { createHash } from "crypto"

export const algorithms = ["md5", "sha1", "sha256", "sha384", "sha512"] as const
export type HashAlgorithm = (typeof algorithms)[number]

export const algorithmLabels: Record<HashAlgorithm, string> = {
  md5: "MD5",
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
}

export type HashEncoding = "hex" | "base64"

export function hashText(text: string, algorithm: HashAlgorithm, encoding: HashEncoding = "hex"): string {
  return createHash(algorithm).update(text).digest(encoding)
}

const KNOWN: Record<HashAlgorithm, { input: string; hex: string }> = {
  md5: { input: "abc", hex: "900150983cd24fb0d6963f7d28e17f72" },
  sha1: { input: "abc", hex: "a9993e364706816aba3e25717850c26c9cd0d89d" },
  sha256: { input: "abc", hex: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" },
  sha384: {
    input: "abc",
    hex: "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
  },
  sha512: {
    input: "abc",
    hex:
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
  },
}

/** A quick self-check shown in the UI: the digest of "abc" per algorithm. */
export function selfCheck(algorithm: HashAlgorithm): boolean {
  const known = KNOWN[algorithm]
  return hashText(known.input, algorithm) === known.hex
}
