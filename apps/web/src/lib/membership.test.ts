import { describe, expect, it } from "vitest";

import {
  assignLeagueRoleSchema,
  assignTeamRoleSchema,
  inviteLeagueMemberSchema,
  inviteTeamMemberSchema,
  removeLeagueRoleSchema,
  removeTeamRoleSchema,
  revokeLeagueInvitationSchema,
  revokeTeamInvitationSchema,
} from "@/lib/membership";

describe("membership schemas", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const invitationId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

  it("validates league role assignment input", () => {
    const parsed = assignLeagueRoleSchema.parse({
      email: "  Coach@Example.com ",
      leagueId,
      role: "COACH",
    });

    expect(parsed.email).toBe("Coach@Example.com");
    expect(parsed.role).toBe("COACH");
  });

  it("rejects invalid league assignment email", () => {
    expect(() =>
      assignLeagueRoleSchema.parse({
        email: "not-an-email",
        leagueId,
        role: "COACH",
      }),
    ).toThrow();
  });

  it("validates team role assignment input", () => {
    const parsed = assignTeamRoleSchema.parse({
      email: "manager@example.com",
      leagueId,
      role: "HEAD_COACH",
      teamId,
    });

    expect(parsed.teamId).toBe(teamId);
    expect(parsed.role).toBe("HEAD_COACH");
  });

  it("rejects invalid roles for invitation workflows", () => {
    expect(() =>
      inviteLeagueMemberSchema.parse({
        email: "invitee@example.com",
        leagueId,
        role: "NOT_A_ROLE",
      }),
    ).toThrow();
  });

  it("accepts league and team invitation payloads", () => {
    const leagueInvite = inviteLeagueMemberSchema.parse({
      email: "invitee@example.com",
      leagueId,
      role: "BOARD_MEMBER",
    });
    const teamInvite = inviteTeamMemberSchema.parse({
      email: "assistant@example.com",
      leagueId,
      role: "COACH",
      teamId,
    });

    expect(leagueInvite.role).toBe("BOARD_MEMBER");
    expect(teamInvite.teamId).toBe(teamId);
  });

  it("validates invitation revocation payloads", () => {
    const leagueRevoke = revokeLeagueInvitationSchema.parse({
      invitationId,
      leagueId,
    });
    const teamRevoke = revokeTeamInvitationSchema.parse({
      invitationId,
      leagueId,
      teamId,
    });

    expect(leagueRevoke.invitationId).toBe(invitationId);
    expect(teamRevoke.teamId).toBe(teamId);
  });

  it("validates league role removal input", () => {
    const userId = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";
    const parsed = removeLeagueRoleSchema.parse({
      leagueId,
      role: "COACH",
      userId,
    });

    expect(parsed.userId).toBe(userId);
    expect(parsed.role).toBe("COACH");
    expect(parsed.leagueId).toBe(leagueId);
  });

  it("validates team role removal input", () => {
    const userId = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";
    const parsed = removeTeamRoleSchema.parse({
      leagueId,
      role: "HEAD_COACH",
      teamId,
      userId,
    });

    expect(parsed.userId).toBe(userId);
    expect(parsed.role).toBe("HEAD_COACH");
    expect(parsed.teamId).toBe(teamId);
  });

  it("rejects invalid role for removal", () => {
    const userId = "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";
    expect(() =>
      removeLeagueRoleSchema.parse({ leagueId, role: "INVALID", userId }),
    ).toThrow();
  });
});
