import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount React trees between tests so render-based specs don't leak DOM
// into one another (vitest is not configured with globals, so testing-library's
// automatic cleanup is not otherwise registered).
afterEach(() => {
  cleanup();
});
