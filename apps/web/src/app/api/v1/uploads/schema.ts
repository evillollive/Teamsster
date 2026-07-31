import { z } from "zod";

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
] as const;

/**
 * Validates upload metadata recorded after a direct-to-storage client upload.
 * Guards against oversized paths, unexpected MIME types, non-numeric sizes,
 * and partially specified entity references.
 */
export const uploadMetaSchema = z
  .object({
    url: z.string().url(),
    pathname: z.string().min(1).max(1024),
    contentType: z.enum(ALLOWED_UPLOAD_CONTENT_TYPES).optional(),
    sizeBytes: z
      .string()
      .regex(/^\d+$/, "sizeBytes must be a non-negative integer")
      .optional(),
    purpose: z.enum(["profile-photo", "team-logo", "league-logo", "general"]),
    entityType: z.string().max(64).optional(),
    entityId: z.string().uuid().optional(),
  })
  .refine((data) => !(data.entityType && !data.entityId), {
    message: "entityId is required when entityType is provided",
    path: ["entityId"],
  })
  .refine((data) => !(data.entityId && !data.entityType), {
    message: "entityType is required when entityId is provided",
    path: ["entityType"],
  });

export type UploadMeta = z.infer<typeof uploadMetaSchema>;
