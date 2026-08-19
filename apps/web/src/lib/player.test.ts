import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@teamsster/db", () => ({
  archivePlayer: vi.fn(),
  archivePlayerContact: vi.fn(),
  createPlayer: vi.fn(),
  createPlayerContact: vi.fn(),
  getPlayerContactsByTeamId: vi.fn(),
  getPlayerCountsByTeamIds: vi.fn(),
  getPlayerCountsByTeamIdsAcrossLeagues: vi.fn(),
  getPlayersByTeamId: vi.fn(),
  getTeamCaptains: vi.fn().mockResolvedValue([]),
  getUserIdByAuthUserId: vi.fn(),
  getUserLeagueMembership: vi.fn(),
  getUserTeamMembership: vi.fn(),
  updatePlayer: vi.fn(),
}));

import type { PlayerContactSummary } from "@teamsster/db";
import {
  createPlayerContact,
  getPlayerContactsByTeamId,
  getPlayerCountsByTeamIds,
  getPlayerCountsByTeamIdsAcrossLeagues,
  getUserIdByAuthUserId,
  getUserLeagueMembership,
  getUserTeamMembership,
} from "@teamsster/db";

import {
  applyContactFieldMask,
  createPlayerContactForUser,
  createPlayerContactSchema,
  createPlayerSchema,
  getContactActionPermissions,
  getContactActionPermissionsForTeamAsUser,
  getPlayerContactsForTeamAsUser,
  getPlayerCountsForLeagueTeams,
  getPlayerCountsForTeams,
  updatePlayerSchema,
} from "@/lib/player";

describe("createPlayerSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("accepts a valid player payload", () => {
    const parsed = createPlayerSchema.parse({
      firstName: "  Sam  ",
      eligibilityNotes: " Waiver signed ",
      eligibilityStatus: "ELIGIBLE",
      jerseyNumber: " 17 ",
      lastName: "Rivera",
      leagueId,
      profileNotes: " Left-footed ",
      profilePrimaryPosition: " Midfielder ",
      profilePronouns: " they/them ",
      preferredName: " Sammy ",
      teamId,
      timezone: "America/Chicago",
    });

    expect(parsed.firstName).toBe("Sam");
    expect(parsed.lastName).toBe("Rivera");
    expect(parsed.preferredName).toBe("Sammy");
    expect(parsed.jerseyNumber).toBe("17");
    expect(parsed.eligibilityStatus).toBe("ELIGIBLE");
    expect(parsed.eligibilityNotes).toBe("Waiver signed");
    expect(parsed.profilePronouns).toBe("they/them");
    expect(parsed.profilePrimaryPosition).toBe("Midfielder");
    expect(parsed.profileNotes).toBe("Left-footed");
  });

  it("defaults timezone to UTC when omitted", () => {
    const parsed = createPlayerSchema.parse({
      firstName: "Alex",
      lastName: "Kim",
      leagueId,
      teamId,
    });

    expect(parsed.timezone).toBe("UTC");
  });

  it("rejects empty first or last names", () => {
    expect(() =>
      createPlayerSchema.parse({
        firstName: " ",
        lastName: "Kim",
        leagueId,
        teamId,
      }),
    ).toThrow();

    expect(() =>
      createPlayerSchema.parse({
        firstName: "Alex",
        lastName: " ",
        leagueId,
        teamId,
      }),
    ).toThrow();
  });
});

describe("updatePlayerSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const playerId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

  it("accepts valid update fields", () => {
    const parsed = updatePlayerSchema.parse({
      firstName: "Jordan",
      eligibilityStatus: "INELIGIBLE",
      jerseyNumber: "9",
      lastName: "Mills",
      leagueId,
      playerId,
      profilePronouns: "",
      preferredName: "",
      teamId,
      timezone: "Europe/London",
    });

    expect(parsed.playerId).toBe(playerId);
    expect(parsed.preferredName).toBeUndefined();
    expect(parsed.jerseyNumber).toBe("9");
    expect(parsed.eligibilityStatus).toBe("INELIGIBLE");
    expect(parsed.profilePronouns).toBeUndefined();
  });

  it("rejects invalid ids", () => {
    expect(() =>
      updatePlayerSchema.parse({
        firstName: "Jordan",
        lastName: "Mills",
        leagueId: "bad-id",
        playerId,
        teamId,
      }),
    ).toThrow();

    expect(() =>
      updatePlayerSchema.parse({
        firstName: "Jordan",
        lastName: "Mills",
        leagueId,
        playerId: "bad-id",
        teamId,
      }),
    ).toThrow();

    expect(() =>
      updatePlayerSchema.parse({
        firstName: "Jordan",
        lastName: "Mills",
        leagueId,
        playerId,
        teamId: "bad-id",
      }),
    ).toThrow();
  });
});

describe("createPlayerContactSchema", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const playerId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

  it("accepts valid contact payload", () => {
    const parsed = createPlayerContactSchema.parse({
      email: " guardian@example.com ",
      firstName: "  Riley ",
      isPrimary: true,
      lastName: "Jordan",
      leagueId,
      playerId,
      relationshipType: "parent",
      teamId,
    });

    expect(parsed.firstName).toBe("Riley");
    expect(parsed.relationshipType).toBe("parent");
    expect(parsed.email).toBe("guardian@example.com");
    expect(parsed.isPrimary).toBe(true);
    expect(parsed.isEmergencyContact).toBe(false);
  });

  it("requires at least one contact method", () => {
    expect(() =>
      createPlayerContactSchema.parse({
        firstName: "Riley",
        lastName: "Jordan",
        leagueId,
        playerId,
        relationshipType: "parent",
        teamId,
      }),
    ).toThrow("Provide at least one contact method.");
  });

  it("accepts valid phone number formats", () => {
    for (const phone of [
      "555-0100",
      "+1 (555) 010-0100",
      "+44 20 7946 0958",
      "5550100",
    ]) {
      const parsed = createPlayerContactSchema.parse({
        firstName: "Riley",
        lastName: "Jordan",
        leagueId,
        phone,
        playerId,
        relationshipType: "parent",
        teamId,
      });
      expect(parsed.phone).toBe(phone);
    }
  });

  it("rejects invalid phone number characters", () => {
    expect(() =>
      createPlayerContactSchema.parse({
        firstName: "Riley",
        lastName: "Jordan",
        leagueId,
        phone: "555-CALL-ME",
        playerId,
        relationshipType: "parent",
        teamId,
      }),
    ).toThrow();

    expect(() =>
      createPlayerContactSchema.parse({
        firstName: "Riley",
        lastName: "Jordan",
        leagueId,
        phone: "<script>alert(1)</script>",
        playerId,
        relationshipType: "parent",
        teamId,
      }),
    ).toThrow();
  });
});

describe("createPlayerContactForUser", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const playerId = "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
  const mockedCreatePlayerContact = vi.mocked(createPlayerContact);
  const mockedGetUserIdByAuthUserId = vi.mocked(getUserIdByAuthUserId);
  const mockedGetUserLeagueMembership = vi.mocked(getUserLeagueMembership);
  const mockedGetUserTeamMembership = vi.mocked(getUserTeamMembership);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetUserIdByAuthUserId.mockResolvedValue("user-1");
    mockedGetUserLeagueMembership.mockResolvedValue({ roles: ["PLAYER"] });
    mockedGetUserTeamMembership.mockResolvedValue({ roles: ["COACH"] });
  });

  it("forwards structured relationship fields to the database layer", async () => {
    await createPlayerContactForUser("auth-user-1", {
      customRelationship: " Host parent ",
      email: "host@example.com",
      firstName: "Riley",
      isEmergencyContact: true,
      isPrimary: true,
      lastName: "Jordan",
      leagueId,
      phone: undefined,
      playerId,
      relationshipType: "other",
      teamId,
    });

    expect(mockedCreatePlayerContact).toHaveBeenCalledWith({
      customRelationship: "Host parent",
      email: "host@example.com",
      firstName: "Riley",
      isEmergencyContact: true,
      isPrimary: true,
      lastName: "Jordan",
      leagueId,
      phone: undefined,
      playerId,
      relationship: "Host parent",
      relationshipType: "other",
      teamId,
      userId: "user-1",
    });
  });
});

describe("applyContactFieldMask", () => {
  const baseContact: PlayerContactSummary = {
    id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    playerId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    firstName: "Riley",
    lastName: "Jordan",
    relationship: "Parent",
    relationshipType: "parent",
    customRelationship: null,
    isEmergencyContact: false,
    email: "riley@example.com",
    phone: "555-0100",
    isPrimary: true,
    createdAt: new Date("2024-01-01"),
  };

  it("preserves email and phone for COACH-level team role", () => {
    const result = applyContactFieldMask(baseContact, {
      teamRoles: "COACH",
    });

    expect(result.email).toBe("riley@example.com");
    expect(result.phone).toBe("555-0100");
  });

  it("preserves email and phone for BOARD_MEMBER-level org role", () => {
    const result = applyContactFieldMask(baseContact, {
      orgRoles: "BOARD_MEMBER",
    });

    expect(result.email).toBe("riley@example.com");
    expect(result.phone).toBe("555-0100");
  });

  it("masks email and phone for PLAYER role", () => {
    const result = applyContactFieldMask(baseContact, {
      orgRoles: "PLAYER",
      teamRoles: "PLAYER",
    });

    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });

  it("masks email and phone when no roles are provided", () => {
    const result = applyContactFieldMask(baseContact, {});

    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });

  it("preserves non-contact fields regardless of role", () => {
    const result = applyContactFieldMask(baseContact, {});

    expect(result.firstName).toBe("Riley");
    expect(result.lastName).toBe("Jordan");
    expect(result.relationship).toBe("Parent");
    expect(result.isPrimary).toBe(true);
  });

  it("does not expose email or phone when team role is PARENT", () => {
    const result = applyContactFieldMask(baseContact, {
      teamRoles: "PARENT",
    });

    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
  });
});

describe("getPlayerCountsForTeams", () => {
  it("forwards team ids to the aggregate count query", async () => {
    const mockedGetPlayerCountsByTeamIds = vi.mocked(getPlayerCountsByTeamIds);
    mockedGetPlayerCountsByTeamIds.mockResolvedValue({
      "team-1": 2,
      "team-2": 0,
    });

    const result = await getPlayerCountsForTeams("league-1", [
      "team-1",
      "team-2",
    ]);

    expect(mockedGetPlayerCountsByTeamIds).toHaveBeenCalledWith("league-1", [
      "team-1",
      "team-2",
    ]);
    expect(result).toEqual({ "team-1": 2, "team-2": 0 });
  });

  it("forwards league and team ids to the cross-league count query", async () => {
    const mockedGetPlayerCountsByTeamIdsAcrossLeagues = vi.mocked(
      getPlayerCountsByTeamIdsAcrossLeagues,
    );
    mockedGetPlayerCountsByTeamIdsAcrossLeagues.mockResolvedValue({
      "team-1": 2,
      "team-2": 4,
    });

    const result = await getPlayerCountsForLeagueTeams(
      ["league-1", "league-2"],
      ["team-1", "team-2"],
    );

    expect(mockedGetPlayerCountsByTeamIdsAcrossLeagues).toHaveBeenCalledWith(
      ["league-1", "league-2"],
      ["team-1", "team-2"],
    );
    expect(result).toEqual({ "team-1": 2, "team-2": 4 });
  });
});

describe("getPlayerContactsForTeamAsUser", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const contacts: PlayerContactSummary[] = [
    {
      id: "c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      playerId: "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      firstName: "Riley",
      lastName: "Jordan",
      relationship: "Parent",
      relationshipType: "parent",
      customRelationship: null,
      isEmergencyContact: false,
      email: "riley@example.com",
      phone: "555-0100",
      isPrimary: true,
      createdAt: new Date("2024-01-01"),
    },
  ];

  const mockedGetPlayerContactsByTeamId = vi.mocked(getPlayerContactsByTeamId);
  const mockedGetUserIdByAuthUserId = vi.mocked(getUserIdByAuthUserId);
  const mockedGetUserLeagueMembership = vi.mocked(getUserLeagueMembership);
  const mockedGetUserTeamMembership = vi.mocked(getUserTeamMembership);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPlayerContactsByTeamId.mockResolvedValue(contacts);
  });

  it("masks contact details for unauthenticated requests", async () => {
    const result = await getPlayerContactsForTeamAsUser(null, leagueId, teamId);

    expect(result[0]?.email).toBeNull();
    expect(result[0]?.phone).toBeNull();
  });

  it("preserves contact details for coach-level team members", async () => {
    mockedGetUserIdByAuthUserId.mockResolvedValue("user-1");
    mockedGetUserLeagueMembership.mockResolvedValue({ roles: ["PLAYER"] });
    mockedGetUserTeamMembership.mockResolvedValue({ roles: ["COACH"] });

    const result = await getPlayerContactsForTeamAsUser(
      "auth-user-1",
      leagueId,
      teamId,
    );

    expect(result[0]?.email).toBe("riley@example.com");
    expect(result[0]?.phone).toBe("555-0100");
  });

  it("masks contact details when memberships are below permission thresholds", async () => {
    mockedGetUserIdByAuthUserId.mockResolvedValue("user-1");
    mockedGetUserLeagueMembership.mockResolvedValue({ roles: ["PLAYER"] });
    mockedGetUserTeamMembership.mockResolvedValue({ roles: ["PARENT"] });

    const result = await getPlayerContactsForTeamAsUser(
      "auth-user-1",
      leagueId,
      teamId,
    );

    expect(result[0]?.email).toBeNull();
    expect(result[0]?.phone).toBeNull();
  });
});

describe("getContactActionPermissions", () => {
  it("grants call/email/sms to coach-level team members", () => {
    const permissions = getContactActionPermissions({ teamRoles: ["COACH"] });

    expect(permissions.canCall).toBe(true);
    expect(permissions.canEmail).toBe(true);
    expect(permissions.canSms).toBe(true);
    expect(permissions.canExport).toBe(false);
  });

  it("grants export for head coach and above", () => {
    const permissions = getContactActionPermissions({
      teamRoles: ["HEAD_COACH"],
    });

    expect(permissions.canExport).toBe(true);
  });
});

describe("getContactActionPermissionsForTeamAsUser", () => {
  const leagueId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const teamId = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  const mockedGetUserIdByAuthUserId = vi.mocked(getUserIdByAuthUserId);
  const mockedGetUserLeagueMembership = vi.mocked(getUserLeagueMembership);
  const mockedGetUserTeamMembership = vi.mocked(getUserTeamMembership);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no permissions for unauthenticated user", async () => {
    const result = await getContactActionPermissionsForTeamAsUser(
      null,
      leagueId,
      teamId,
    );

    expect(result).toEqual({
      canCall: false,
      canEmail: false,
      canExport: false,
      canSms: false,
    });
  });

  it("returns action permissions based on memberships", async () => {
    mockedGetUserIdByAuthUserId.mockResolvedValue("user-1");
    mockedGetUserLeagueMembership.mockResolvedValue({ roles: ["PLAYER"] });
    mockedGetUserTeamMembership.mockResolvedValue({ roles: ["HEAD_COACH"] });

    const result = await getContactActionPermissionsForTeamAsUser(
      "auth-user-1",
      leagueId,
      teamId,
    );

    expect(result.canCall).toBe(true);
    expect(result.canEmail).toBe(true);
    expect(result.canSms).toBe(true);
    expect(result.canExport).toBe(true);
  });
});
