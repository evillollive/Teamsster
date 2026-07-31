import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "@/components/form-field";

describe("FormField", () => {
  it("does not set aria-describedby when there is no description or error", () => {
    const { getByRole } = render(
      <FormField htmlFor="name" label="Name">
        <input id="name" />
      </FormField>,
    );

    expect(getByRole("textbox")).not.toHaveAttribute("aria-describedby");
    expect(getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("wires the description to the control via aria-describedby", () => {
    const { getByRole } = render(
      <FormField htmlFor="tz" label="Timezone" description="e.g. UTC">
        <input id="tz" />
      </FormField>,
    );

    const input = getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "tz-description");
  });

  it("marks the control invalid and links the error message on error", () => {
    const { getByRole } = render(
      <FormField htmlFor="email" label="Email" error="Required">
        <input id="email" />
      </FormField>,
    );

    const input = getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("email-error");
    expect(getByRole("alert")).toHaveTextContent("Required");
  });

  it("references both description and error when both are present", () => {
    const { getByRole } = render(
      <FormField
        htmlFor="pw"
        label="Password"
        description="8+ characters"
        error="Too short"
      >
        <input id="pw" />
      </FormField>,
    );

    expect(getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "pw-description pw-error",
    );
  });

  it("preserves an aria-describedby already set on the control", () => {
    const { getByRole } = render(
      <FormField htmlFor="notes" label="Notes" description="Optional">
        <input id="notes" aria-describedby="external-hint" />
      </FormField>,
    );

    expect(getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "external-hint notes-description",
    );
  });
});
