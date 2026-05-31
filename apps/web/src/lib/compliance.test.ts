import { decryptField, deriveEncryptionKey, encryptField } from "@teamsster/db";
import { describe, expect, it } from "vitest";

describe("field encryption", () => {
  const key = deriveEncryptionKey("test-secret-key-for-unit-tests-32");

  it("encrypts and decrypts a string roundtrip", () => {
    const plaintext = "John Doe, Policy #12345";
    const encrypted = encryptField(plaintext, key);
    const decrypted = decryptField(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext each time (random IV)", () => {
    const plaintext = "Same data";
    const a = encryptField(plaintext, key);
    const b = encryptField(plaintext, key);
    expect(a).not.toBe(b);
  });

  it("ciphertext has expected format (iv:tag:data)", () => {
    const encrypted = encryptField("test", key);
    const parts = encrypted.split(":");
    expect(parts.length).toBe(3);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptField("sensitive", key);
    const tampered = `${encrypted.slice(0, -4)}XXXX`;
    expect(() => decryptField(tampered, key)).toThrow();
  });

  it("throws on wrong key", () => {
    const otherKey = deriveEncryptionKey("different-secret-entirely-12345");
    const encrypted = encryptField("data", key);
    expect(() => decryptField(encrypted, otherKey)).toThrow();
  });

  it("throws on malformed input", () => {
    expect(() => decryptField("not-valid", key)).toThrow(
      "Invalid encrypted field format",
    );
  });

  it("handles unicode content", () => {
    const plaintext = "Données médicales: allergie à l'arachide 🥜";
    const encrypted = encryptField(plaintext, key);
    expect(decryptField(encrypted, key)).toBe(plaintext);
  });
});

describe("deriveEncryptionKey", () => {
  it("returns a 32-byte buffer", () => {
    const key = deriveEncryptionKey("any-secret");
    expect(key.length).toBe(32);
    expect(Buffer.isBuffer(key)).toBe(true);
  });

  it("pads short secrets", () => {
    const key = deriveEncryptionKey("x");
    expect(key.length).toBe(32);
  });

  it("truncates long secrets", () => {
    const key = deriveEncryptionKey("A".repeat(100));
    expect(key.length).toBe(32);
  });
});
