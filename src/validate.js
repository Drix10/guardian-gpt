import { z } from "zod";

// One schema for every way a payment reaches Guardian (web API, MCP, scripts).
const text = (max) => z.string().trim().max(max);

export const situationSchema = z.object({
  onCall: z.boolean().optional(),
  callType: z.enum(["whatsapp_video", "whatsapp_audio", "phone"]).nullish(),
  callerInContacts: z.boolean().optional(),
  callMinutes: z.number().finite().min(0).max(1440).optional(),
  screenShareApp: text(60).nullish(),
  usualMaxAmount: z.number().finite().positive().max(1e10).optional(),
  payeeInContacts: z.boolean().optional(),
  payeeVerifiedMerchant: z.boolean().optional(),
  payeeAccountAgeDays: z.number().finite().min(0).max(36500).nullish(),
  payeeReports: z.number().int().min(0).max(100000).nullish(),
}).strict();

export const paymentSchema = z.object({
  amount: z.number("Enter the amount in rupees.").finite("Enter the amount in rupees.").positive("Enter an amount above ₹0.").max(1e10, "That amount is too large."),
  payeeName: text(200).optional(),
  payeeId: text(200).optional(),
  firstTime: z.boolean().optional(),
  note: text(300).optional(),
  actor: text(200).optional(),
}).strict();

const MAX_IMAGE_CHARS = 6_000_000; // ~4.5 MB of base64 per screenshot

export const checkSchema = z.object({
  payment: paymentSchema,
  context: text(20000).optional().default(""),
  // Only formats the Decisions API accepts, inline as base64.
  images: z.array(z.string().regex(/^data:image\/(png|jpe?g|webp);base64,/).max(MAX_IMAGE_CHARS)).max(4).optional().default([]),
  language: z.enum(["en", "hi"]).optional().default("en"),
  situation: situationSchema.nullish(),
});

export const decisionSchema = z.object({
  decision: z.enum(["approve", "block"]),
  by: text(80).optional(),
});

// Messages written for people are shown as-is; anything else gets its field name for context.
const FRIENDLY_PATHS = new Set(["payment.amount", "amount", "payment"]);
export function formatIssues(error) {
  return [...new Set(error.issues.map((i) => {
    const path = i.path.join(".");
    return FRIENDLY_PATHS.has(path) || !path ? (path === "payment" ? "Enter the payment details." : i.message) : `${path}: ${i.message}`;
  }))].join(" ");
}
