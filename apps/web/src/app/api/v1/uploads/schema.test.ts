import { describe, expect, it } from "vitest";

import { uploadMetaSchema } from "@/app/api/v1/uploads/schema";

const base = {
  url: "https://blob.example.com/u/photo.png",
  pathname: "u/photo.png",
  purpose: "profile-photo" as const,
};

describe("uploadMetaSchema", () => {
  it("accepts a minimal valid payload", () => {
    expect(uploadMetaSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a non-numeric sizeBytes", () => {
    const result = uploadMetaSchema.safeParse({
      ...base,
      sizeBytes: "not-a-number",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a numeric string sizeBytes", () => {
    expect(
      uploadMetaSchema.safeParse({ ...base, sizeBytes: "2048" }).success,
    ).toBe(true);
  });

  it("rejects an unexpected content type", () => {
    const result = uploadMetaSchema.safeParse({
      ...base,
      contentType: "application/x-msdownload",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an overly long pathname", () => {
    const result = uploadMetaSchema.safeParse({
      ...base,
      pathname: "a".repeat(1025),
    });
    expect(result.success).toBe(false);
  });

  it("requires entityId when entityType is provided", () => {
    const result = uploadMetaSchema.safeParse({
      ...base,
      entityType: "team",
    });
    expect(result.success).toBe(false);
  });

  it("requires entityType when entityId is provided", () => {
    const result = uploadMetaSchema.safeParse({
      ...base,
      entityId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fully specified entity reference", () => {
    const result = uploadMetaSchema.safeParse({
      ...base,
      entityType: "team",
      entityId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(true);
  });
});
