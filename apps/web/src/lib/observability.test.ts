import { describe, expect, it, type SpyInstance, vi } from "vitest";

import {
  captureBoundaryError,
  captureServerError,
} from "./observability";

describe("captureBoundaryError", () => {
  it("logs the error with boundary tag and digest", () => {
    const spy: SpyInstance = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const err = new Error("test boundary error");

    captureBoundaryError(err, "abc123");

    expect(spy).toHaveBeenCalledWith(
      "[teamsster-error-boundary]",
      "abc123",
      err,
    );
    spy.mockRestore();
  });

  it("logs without digest when omitted", () => {
    const spy: SpyInstance = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const err = new Error("no digest");

    captureBoundaryError(err);

    expect(spy).toHaveBeenCalledWith(
      "[teamsster-error-boundary]",
      undefined,
      err,
    );
    spy.mockRestore();
  });
});

describe("captureServerError", () => {
  it("logs the error with server tag and context", () => {
    const spy: SpyInstance = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const err = new Error("server error");
    const ctx = { route: "/api/test", userId: "u1" };

    captureServerError(err, ctx);

    expect(spy).toHaveBeenCalledWith(
      "[teamsster-server-error]",
      ctx,
      err,
    );
    spy.mockRestore();
  });

  it("logs without context when omitted", () => {
    const spy: SpyInstance = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const err = "string error";

    captureServerError(err);

    expect(spy).toHaveBeenCalledWith(
      "[teamsster-server-error]",
      undefined,
      err,
    );
    spy.mockRestore();
  });
});
