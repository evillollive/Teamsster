import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "./client";
import type { InsuranceRecord, PaymentStatus, WaiverMetadata } from "./schema";
import {
  auditLogs,
  insuranceRecords,
  medicalNotes,
  registrationPayments,
  waiverSignatures,
} from "./schema";

// ── Encryption helpers ───────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypts a string using AES-256-GCM.
 * Returns base64-encoded ciphertext in format: iv:tag:ciphertext
 */
export function encryptField(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

/**
 * Decrypts a string encrypted with encryptField.
 */
export function decryptField(ciphertext: string, key: Buffer): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted field format.");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

/**
 * Derives an encryption key from a secret string using PBKDF2.
 * Uses a fixed salt derived from the secret for deterministic key derivation.
 * In production, consider using a KMS for key management.
 */
export function deriveEncryptionKey(secret: string): Buffer {
  const salt = createHash("sha256")
    .update(`teamsster-key-salt:${secret}`)
    .digest();
  return pbkdf2Sync(secret, salt, 100_000, 32, "sha512");
}

// ── Insurance records ────────────────────────────────────────────────────────

export async function storeInsuranceRecord(input: {
  registrationId: string;
  playerId?: string;
  leagueId: string;
  data: InsuranceRecord;
  encryptionKey: Buffer;
  createdById: string;
}): Promise<string> {
  const encrypted = encryptField(
    JSON.stringify(input.data),
    input.encryptionKey,
  );

  const [row] = await db
    .insert(insuranceRecords)
    .values({
      registrationId: input.registrationId,
      playerId: input.playerId ?? null,
      leagueId: input.leagueId,
      encryptedData: encrypted,
      createdById: input.createdById,
    })
    .returning({ id: insuranceRecords.id });

  await db.insert(auditLogs).values({
    action: "insurance.create",
    actorUserId: input.createdById,
    entityType: "insurance_record",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: {},
  });

  return row.id;
}

export async function getInsuranceRecord(input: {
  registrationId: string;
  encryptionKey: Buffer;
  actorUserId: string;
  leagueId: string;
}): Promise<InsuranceRecord | null> {
  const rows = await db
    .select({
      id: insuranceRecords.id,
      encryptedData: insuranceRecords.encryptedData,
    })
    .from(insuranceRecords)
    .where(eq(insuranceRecords.registrationId, input.registrationId))
    .limit(1);

  if (!rows[0]) return null;

  await db.insert(auditLogs).values({
    action: "insurance.read",
    actorUserId: input.actorUserId,
    entityType: "insurance_record",
    entityId: rows[0].id,
    leagueId: input.leagueId,
    metadata: {},
  });

  return JSON.parse(decryptField(rows[0].encryptedData, input.encryptionKey));
}

// ── Medical notes ────────────────────────────────────────────────────────────

export async function storeMedicalNotes(input: {
  registrationId: string;
  playerId?: string;
  leagueId: string;
  notes: string;
  encryptionKey: Buffer;
  createdById: string;
}): Promise<string> {
  const encrypted = encryptField(input.notes, input.encryptionKey);

  const [row] = await db
    .insert(medicalNotes)
    .values({
      registrationId: input.registrationId,
      playerId: input.playerId ?? null,
      leagueId: input.leagueId,
      encryptedNotes: encrypted,
      createdById: input.createdById,
    })
    .returning({ id: medicalNotes.id });

  await db.insert(auditLogs).values({
    action: "medical.create",
    actorUserId: input.createdById,
    entityType: "medical_note",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: {},
  });

  return row.id;
}

// ── Waiver signatures ────────────────────────────────────────────────────────

export async function signWaiver(input: {
  registrationId: string;
  leagueId: string;
  signerUserId: string;
  waiverText: string;
  metadata: WaiverMetadata;
}): Promise<string> {
  const [row] = await db
    .insert(waiverSignatures)
    .values({
      registrationId: input.registrationId,
      leagueId: input.leagueId,
      signerUserId: input.signerUserId,
      waiverText: input.waiverText,
      metadata: input.metadata,
    })
    .returning({ id: waiverSignatures.id });

  await db.insert(auditLogs).values({
    action: "waiver.sign",
    actorUserId: input.signerUserId,
    entityType: "waiver_signature",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: {
      waiverVersion: input.metadata.waiverVersion,
      ipAddress: input.metadata.ipAddress,
    },
  });

  return row.id;
}

export async function getWaiversByRegistration(registrationId: string) {
  return db
    .select({
      id: waiverSignatures.id,
      registrationId: waiverSignatures.registrationId,
      leagueId: waiverSignatures.leagueId,
      signerUserId: waiverSignatures.signerUserId,
      waiverText: waiverSignatures.waiverText,
      metadata: waiverSignatures.metadata,
      signedAt: waiverSignatures.signedAt,
    })
    .from(waiverSignatures)
    .where(eq(waiverSignatures.registrationId, registrationId));
}

export async function getWaiversByLeague(leagueId: string) {
  return db
    .select({
      id: waiverSignatures.id,
      registrationId: waiverSignatures.registrationId,
      signerUserId: waiverSignatures.signerUserId,
      metadata: waiverSignatures.metadata,
      signedAt: waiverSignatures.signedAt,
    })
    .from(waiverSignatures)
    .where(eq(waiverSignatures.leagueId, leagueId))
    .orderBy(waiverSignatures.signedAt);
}

// ── Payment status ───────────────────────────────────────────────────────────

export async function setPaymentStatus(input: {
  registrationId: string;
  leagueId: string;
  status: PaymentStatus;
  amount?: string;
  notes?: string;
  updatedById: string;
}): Promise<string> {
  const existing = await db
    .select({ id: registrationPayments.id })
    .from(registrationPayments)
    .where(eq(registrationPayments.registrationId, input.registrationId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(registrationPayments)
      .set({
        status: input.status,
        amount: input.amount ?? null,
        notes: input.notes ?? null,
        updatedById: input.updatedById,
        updatedAt: new Date(),
      })
      .where(eq(registrationPayments.id, existing[0].id));

    await db.insert(auditLogs).values({
      action: "payment.update",
      actorUserId: input.updatedById,
      entityType: "registration_payment",
      entityId: existing[0].id,
      leagueId: input.leagueId,
      metadata: { status: input.status },
    });

    return existing[0].id;
  }

  const [row] = await db
    .insert(registrationPayments)
    .values({
      registrationId: input.registrationId,
      leagueId: input.leagueId,
      status: input.status,
      amount: input.amount ?? null,
      notes: input.notes ?? null,
      updatedById: input.updatedById,
    })
    .returning({ id: registrationPayments.id });

  await db.insert(auditLogs).values({
    action: "payment.create",
    actorUserId: input.updatedById,
    entityType: "registration_payment",
    entityId: row.id,
    leagueId: input.leagueId,
    metadata: { status: input.status },
  });

  return row.id;
}

export async function getPaymentStatus(registrationId: string) {
  const rows = await db
    .select({
      id: registrationPayments.id,
      status: registrationPayments.status,
      amount: registrationPayments.amount,
      notes: registrationPayments.notes,
      updatedAt: registrationPayments.updatedAt,
    })
    .from(registrationPayments)
    .where(eq(registrationPayments.registrationId, registrationId))
    .limit(1);

  return rows[0] ?? null;
}
