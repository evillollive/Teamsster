/**
 * Payments proof-of-concept module.
 *
 * This is a scaffold showing how a payment integration module
 * would hook into the Teamsster extension system. It doesn't
 * process real payments but demonstrates the patterns.
 */

import type { HookPayload } from "./extension-system";
import { registerHook, registerModule } from "./extension-system";

// ── Types ────────────────────────────────────────────────────────────────────

export type PaymentIntent = {
  id: string;
  registrationId: string;
  leagueId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  externalId?: string;
  createdAt: Date;
};

export type WebhookEvent = {
  type: string;
  data: Record<string, unknown>;
  signature: string;
  timestamp: number;
};

// ── Webhook verification ─────────────────────────────────────────────────────

/**
 * Validates a webhook signature (placeholder for Stripe-style HMAC verification).
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!payload || !signature || !secret) return false;
  // In production, this would compute HMAC-SHA256 and compare
  // For the proof module, we validate format only
  return signature.length >= 32;
}

// ── Payment intent helpers ───────────────────────────────────────────────────

export function createPaymentIntent(input: {
  registrationId: string;
  leagueId: string;
  amount: number;
  currency?: string;
}): PaymentIntent {
  return {
    id: `pi_${Date.now()}`,
    registrationId: input.registrationId,
    leagueId: input.leagueId,
    amount: input.amount,
    currency: input.currency ?? "usd",
    status: "pending",
    createdAt: new Date(),
  };
}

export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount <= 999_999;
}

export function formatAmount(amount: number, currency: string): string {
  const formatted = (amount / 100).toFixed(2);
  const symbols: Record<string, string> = { usd: "$", eur: "€", gbp: "£" };
  return `${symbols[currency] ?? currency.toUpperCase() + " "}${formatted}`;
}

// ── Module registration ──────────────────────────────────────────────────────

export function initPaymentsModule(): void {
  registerModule({
    id: "payments",
    name: "Payment Integration",
    version: "0.1.0",
    description: "Stripe-compatible payment processing for registration fees.",
    hooks: [
      {
        event: "registration.submitted",
        description: "Creates a payment intent when registration is submitted.",
      },
      {
        event: "registration.approved",
        description: "Marks payment as captured when registration is approved.",
      },
    ],
    apiRoutes: [
      {
        method: "POST",
        path: "/api/payments/webhook",
        description: "Stripe webhook endpoint for payment events.",
      },
    ],
  });

  registerHook(
    "payments",
    "registration.submitted",
    async (payload: HookPayload) => {
      // In production: create Stripe PaymentIntent
      console.log(
        `[payments] Registration ${payload.data.registrationId} submitted, payment intent would be created.`,
      );
    },
  );
}
