import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

import { NavLink } from "@/components/nav-link";

describe("NavLink", () => {
  beforeEach(() => {
    usePathname.mockReset();
  });

  it('marks an exactly matched link as aria-current="page"', () => {
    usePathname.mockReturnValue("/league");
    const { getByRole } = render(<NavLink href="/league">Leagues</NavLink>);

    expect(getByRole("link")).toHaveAttribute("aria-current", "page");
  });

  it("marks a nested route as current for its parent nav item", () => {
    usePathname.mockReturnValue("/league/abc123");
    const { getByRole } = render(<NavLink href="/league">Leagues</NavLink>);

    expect(getByRole("link")).toHaveAttribute("aria-current", "page");
  });

  it("does not mark unrelated links as current", () => {
    usePathname.mockReturnValue("/events");
    const { getByRole } = render(<NavLink href="/league">Leagues</NavLink>);

    expect(getByRole("link")).not.toHaveAttribute("aria-current");
  });

  it("only marks Home current on the exact root path", () => {
    usePathname.mockReturnValue("/events");
    const { getByRole } = render(<NavLink href="/">Home</NavLink>);

    expect(getByRole("link")).not.toHaveAttribute("aria-current");
  });

  it("applies activeClassName only when active", () => {
    usePathname.mockReturnValue("/events");
    const { getByRole } = render(
      <NavLink href="/events" className="base" activeClassName="active">
        Events
      </NavLink>,
    );

    const link = getByRole("link");
    expect(link.className).toContain("base");
    expect(link.className).toContain("active");
  });
});
