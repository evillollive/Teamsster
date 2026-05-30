import { auth } from "@teamsster/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLeagueDetail } from "@/lib/league";
import {
  archivePlayerContactForUser,
  archivePlayerForUser,
  createPlayerContactForUser,
  createPlayerForUser,
  getContactActionPermissionsForTeamAsUser,
  getPlayerContactsForTeamAsUser,
  getPlayersForTeam,
  updatePlayerForUser,
} from "@/lib/player";
import {
  formatRelationshipLabel,
  RELATIONSHIP_TYPE_LABELS,
} from "@/lib/relationship";
import { getTeamDetail } from "@/lib/team";

function buildContactExportHref(
  contacts: Array<{
    firstName: string;
    lastName: string;
    relationship: string | null;
    relationshipType: keyof typeof RELATIONSHIP_TYPE_LABELS | null;
    customRelationship: string | null;
    email: string | null;
    phone: string | null;
    isPrimary: boolean;
  }>,
) {
  const normalizeCsvValue = (value: string) =>
    value.replaceAll(/\r?\n/g, " ").replaceAll('"', '""');
  const header = "First name,Last name,Relationship,Email,Phone,Primary";
  const rows = contacts.map((contact) =>
    [
      contact.firstName,
      contact.lastName,
      formatRelationshipLabel(contact),
      contact.email ?? "",
      contact.phone ?? "",
      contact.isPrimary ? "Yes" : "No",
    ]
      .map((value) => `"${normalizeCsvValue(value)}"`)
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function toSafeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

const defaultContactExportFilenamePart = "player";

function buildContactExportFilename(firstName: string, lastName: string) {
  const safeFirstName =
    toSafeFilename(firstName) || defaultContactExportFilenamePart;
  const safeLastName =
    toSafeFilename(lastName) || defaultContactExportFilenamePart;
  return `contacts-${safeFirstName}-${safeLastName}.csv`;
}

export default async function TeamRosterPage({
  params,
}: {
  params: Promise<{ leagueId: string; teamId: string }>;
}) {
  const { leagueId, teamId } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  let league: Awaited<ReturnType<typeof getLeagueDetail>> = null;
  let team: Awaited<ReturnType<typeof getTeamDetail>> = null;
  let players: Awaited<ReturnType<typeof getPlayersForTeam>> = [];

  if (session?.user) {
    [league, team, players] = await Promise.all([
      getLeagueDetail(session.user.id, leagueId),
      getTeamDetail(session.user.id, teamId),
      getPlayersForTeam(leagueId, teamId),
    ]);
  }

  if (!league || !team || team.leagueId !== leagueId) {
    notFound();
  }
  const activeTeam = team;

  const [contacts, contactActionPermissions] = await Promise.all([
    getPlayerContactsForTeamAsUser(session?.user?.id, leagueId, teamId),
    getContactActionPermissionsForTeamAsUser(
      session?.user?.id,
      leagueId,
      teamId,
    ),
  ]);
  const contactsByPlayerId = contacts.reduce<
    Record<
      string,
      Array<{
        id: string;
        firstName: string;
        lastName: string;
        relationship: string | null;
        relationshipType: keyof typeof RELATIONSHIP_TYPE_LABELS | null;
        customRelationship: string | null;
        isEmergencyContact: boolean;
        email: string | null;
        phone: string | null;
        isPrimary: boolean;
      }>
    >
  >((map, contact) => {
    map[contact.playerId] ??= [];
    map[contact.playerId].push(contact);
    return map;
  }, {});

  async function createPlayerAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to create players.");
    }

    await createPlayerForUser(currentSession.user.id, {
      eligibilityNotes:
        (formData.get("eligibilityNotes") as string | null) ?? undefined,
      eligibilityStatus:
        (formData.get("eligibilityStatus") as
          | "PENDING"
          | "ELIGIBLE"
          | "INELIGIBLE"
          | null) ?? "PENDING",
      firstName: (formData.get("firstName") as string | null) ?? "",
      jerseyNumber:
        (formData.get("jerseyNumber") as string | null) ?? undefined,
      lastName: (formData.get("lastName") as string | null) ?? "",
      leagueId,
      profileNotes:
        (formData.get("profileNotes") as string | null) ?? undefined,
      profilePrimaryPosition:
        (formData.get("profilePrimaryPosition") as string | null) ?? undefined,
      profilePronouns:
        (formData.get("profilePronouns") as string | null) ?? undefined,
      preferredName:
        (formData.get("preferredName") as string | null) ?? undefined,
      teamId,
      timezone:
        (formData.get("timezone") as string | null)?.trim() ||
        activeTeam.timezone,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  async function updatePlayerAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to update players.");
    }

    await updatePlayerForUser(currentSession.user.id, {
      eligibilityNotes:
        (formData.get("eligibilityNotes") as string | null) ?? undefined,
      eligibilityStatus:
        (formData.get("eligibilityStatus") as
          | "PENDING"
          | "ELIGIBLE"
          | "INELIGIBLE"
          | null) ?? "PENDING",
      firstName: (formData.get("firstName") as string | null) ?? "",
      jerseyNumber:
        (formData.get("jerseyNumber") as string | null) ?? undefined,
      lastName: (formData.get("lastName") as string | null) ?? "",
      leagueId,
      playerId: (formData.get("playerId") as string | null) ?? "",
      profileNotes:
        (formData.get("profileNotes") as string | null) ?? undefined,
      profilePrimaryPosition:
        (formData.get("profilePrimaryPosition") as string | null) ?? undefined,
      profilePronouns:
        (formData.get("profilePronouns") as string | null) ?? undefined,
      preferredName:
        (formData.get("preferredName") as string | null) ?? undefined,
      teamId,
      timezone:
        (formData.get("timezone") as string | null)?.trim() ||
        activeTeam.timezone,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  async function archivePlayerAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive players.");
    }

    const playerId = (formData.get("playerId") as string | null) ?? "";
    await archivePlayerForUser(
      currentSession.user.id,
      playerId,
      leagueId,
      teamId,
    );

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  async function createPlayerContactAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to create contacts.");
    }

    await createPlayerContactForUser(currentSession.user.id, {
      customRelationship:
        (formData.get("customRelationship") as string | null) ?? undefined,
      email: (formData.get("email") as string | null) ?? undefined,
      firstName: (formData.get("firstName") as string | null) ?? "",
      isEmergencyContact: Boolean(formData.get("isEmergencyContact")),
      isPrimary: Boolean(formData.get("isPrimary")),
      lastName: (formData.get("lastName") as string | null) ?? "",
      leagueId,
      phone: (formData.get("phone") as string | null) ?? undefined,
      playerId: (formData.get("playerId") as string | null) ?? "",
      relationshipType:
        ((formData.get("relationshipType") as string | null) ?? "parent") as
          keyof typeof RELATIONSHIP_TYPE_LABELS,
      teamId,
    });

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  async function archivePlayerContactAction(formData: FormData) {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      throw new Error("You must be signed in to archive contacts.");
    }

    const playerId = (formData.get("playerId") as string | null) ?? "";
    const contactId = (formData.get("contactId") as string | null) ?? "";

    await archivePlayerContactForUser(
      currentSession.user.id,
      contactId,
      playerId,
      leagueId,
      teamId,
    );

    revalidatePath(`/league/${leagueId}/team/${teamId}`);
    revalidatePath(`/league/${leagueId}/team/${teamId}/roster`);
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          <Link className="hover:underline" href={`/league/${leagueId}`}>
            {league.name}
          </Link>
          {" · "}
          <Link
            className="hover:underline"
            href={`/league/${leagueId}/team/${teamId}`}
          >
            {activeTeam.name}
          </Link>
          {" · Roster"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Manage roster</h1>
        <p className="text-sm text-slate-600">
          Create, update, and archive players for this team. Archiving is a soft
          delete and keeps historical records intact.
        </p>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Add player</h2>
        <form action={createPlayerAction} className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="player-first-name" label="First name">
            <Input
              autoComplete="given-name"
              id="player-first-name"
              maxLength={120}
              name="firstName"
              required
            />
          </FormField>
          <FormField htmlFor="player-last-name" label="Last name">
            <Input
              autoComplete="family-name"
              id="player-last-name"
              maxLength={120}
              name="lastName"
              required
            />
          </FormField>
          <FormField htmlFor="player-preferred-name" label="Preferred name">
            <Input
              id="player-preferred-name"
              maxLength={120}
              name="preferredName"
              placeholder="Optional nickname"
            />
          </FormField>
          <FormField htmlFor="player-jersey-number" label="Jersey number">
            <Input
              id="player-jersey-number"
              maxLength={20}
              name="jerseyNumber"
              placeholder="Optional"
            />
          </FormField>
          <FormField htmlFor="player-eligibility-status" label="Eligibility">
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
              defaultValue="PENDING"
              id="player-eligibility-status"
              name="eligibilityStatus"
            >
              <option value="PENDING">Pending review</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="INELIGIBLE">Ineligible</option>
            </select>
          </FormField>
          <FormField htmlFor="player-profile-pronouns" label="Pronouns">
            <Input
              id="player-profile-pronouns"
              maxLength={80}
              name="profilePronouns"
              placeholder="Optional"
            />
          </FormField>
          <FormField htmlFor="player-profile-position" label="Primary position">
            <Input
              id="player-profile-position"
              maxLength={120}
              name="profilePrimaryPosition"
              placeholder="Optional"
            />
          </FormField>
          <FormField
            className="sm:col-span-2"
            htmlFor="player-eligibility-notes"
            label="Eligibility notes"
          >
            <Input
              id="player-eligibility-notes"
              maxLength={500}
              name="eligibilityNotes"
              placeholder="Optional registration or waiver notes"
            />
          </FormField>
          <FormField
            className="sm:col-span-2"
            htmlFor="player-profile-notes"
            label="Profile notes"
          >
            <Input
              id="player-profile-notes"
              maxLength={500}
              name="profileNotes"
              placeholder="Optional player profile details"
            />
          </FormField>
          <FormField
            className="sm:col-span-2"
            htmlFor="player-timezone"
            label="Timezone"
          >
            <Input
              defaultValue={activeTeam.timezone}
              id="player-timezone"
              maxLength={100}
              name="timezone"
              placeholder={activeTeam.timezone}
            />
          </FormField>
          <div className="sm:col-span-2">
            <Button disabled={!session?.user} type="submit">
              Add player
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-4">
        <h2 className="text-lg font-semibold">Active players</h2>

        {players.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active players yet. Add the first player above.
          </p>
        ) : (
          <ul className="grid gap-4">
            {players.map((player) => (
              <li
                className="rounded-2xl border border-slate-200 p-4"
                key={player.id}
              >
                <div className="grid gap-3">
                  <form
                    action={updatePlayerAction}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <input name="playerId" type="hidden" value={player.id} />
                    <FormField
                      htmlFor={`player-first-name-${player.id}`}
                      label="First name"
                    >
                      <Input
                        defaultValue={player.firstName}
                        id={`player-first-name-${player.id}`}
                        maxLength={120}
                        name="firstName"
                        required
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-last-name-${player.id}`}
                      label="Last name"
                    >
                      <Input
                        defaultValue={player.lastName}
                        id={`player-last-name-${player.id}`}
                        maxLength={120}
                        name="lastName"
                        required
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-preferred-name-${player.id}`}
                      label="Preferred name"
                    >
                      <Input
                        defaultValue={player.preferredName ?? ""}
                        id={`player-preferred-name-${player.id}`}
                        maxLength={120}
                        name="preferredName"
                        placeholder="Optional nickname"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-jersey-number-${player.id}`}
                      label="Jersey number"
                    >
                      <Input
                        defaultValue={player.jerseyNumber ?? ""}
                        id={`player-jersey-number-${player.id}`}
                        maxLength={20}
                        name="jerseyNumber"
                        placeholder="Optional"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-eligibility-status-${player.id}`}
                      label="Eligibility"
                    >
                      <select
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200"
                        defaultValue={player.eligibilityStatus}
                        id={`player-eligibility-status-${player.id}`}
                        name="eligibilityStatus"
                      >
                        <option value="PENDING">Pending review</option>
                        <option value="ELIGIBLE">Eligible</option>
                        <option value="INELIGIBLE">Ineligible</option>
                      </select>
                    </FormField>
                    <FormField
                      htmlFor={`player-profile-pronouns-${player.id}`}
                      label="Pronouns"
                    >
                      <Input
                        defaultValue={player.profileMetadata.pronouns ?? ""}
                        id={`player-profile-pronouns-${player.id}`}
                        maxLength={80}
                        name="profilePronouns"
                        placeholder="Optional"
                      />
                    </FormField>
                    <FormField
                      htmlFor={`player-profile-position-${player.id}`}
                      label="Primary position"
                    >
                      <Input
                        defaultValue={
                          player.profileMetadata.primaryPosition ?? ""
                        }
                        id={`player-profile-position-${player.id}`}
                        maxLength={120}
                        name="profilePrimaryPosition"
                        placeholder="Optional"
                      />
                    </FormField>
                    <FormField
                      className="sm:col-span-2"
                      htmlFor={`player-eligibility-notes-${player.id}`}
                      label="Eligibility notes"
                    >
                      <Input
                        defaultValue={player.eligibilityNotes ?? ""}
                        id={`player-eligibility-notes-${player.id}`}
                        maxLength={500}
                        name="eligibilityNotes"
                        placeholder="Optional registration or waiver notes"
                      />
                    </FormField>
                    <FormField
                      className="sm:col-span-2"
                      htmlFor={`player-profile-notes-${player.id}`}
                      label="Profile notes"
                    >
                      <Input
                        defaultValue={player.profileMetadata.notes ?? ""}
                        id={`player-profile-notes-${player.id}`}
                        maxLength={500}
                        name="profileNotes"
                        placeholder="Optional player profile details"
                      />
                    </FormField>
                    <FormField
                      className="sm:col-span-2"
                      htmlFor={`player-timezone-${player.id}`}
                      label="Timezone"
                    >
                      <Input
                        defaultValue={player.timezone}
                        id={`player-timezone-${player.id}`}
                        maxLength={100}
                        name="timezone"
                      />
                    </FormField>
                    <div className="sm:col-span-2">
                      <Button disabled={!session?.user} size="sm" type="submit">
                        Save player
                      </Button>
                    </div>
                  </form>

                  <form action={archivePlayerAction}>
                    <input name="playerId" type="hidden" value={player.id} />
                    <Button
                      disabled={!session?.user}
                      size="sm"
                      type="submit"
                      variant="ghost"
                    >
                      Archive player
                    </Button>
                  </form>

                  <div className="grid gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      Guardian and contacts
                    </p>

                    {(contactsByPlayerId[player.id] ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No contacts added yet for this player.
                      </p>
                    ) : (
                      <ul className="grid gap-2">
                        {(contactsByPlayerId[player.id] ?? []).map(
                          (contact) => (
                            <li
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                              key={contact.id}
                            >
                              <div className="text-sm text-slate-700">
                                <p className="font-medium">
                                  {contact.firstName} {contact.lastName}
                                  {contact.isPrimary ? " · Primary" : ""}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatRelationshipLabel(contact)}
                                  {contact.isEmergencyContact
                                    ? " · Emergency contact"
                                    : ""}
                                  {contact.email ? ` · ${contact.email}` : ""}
                                  {contact.phone ? ` · ${contact.phone}` : ""}
                                </p>
                                <p className="mt-1 flex flex-wrap gap-2 text-xs">
                                  {contact.phone &&
                                  contactActionPermissions.canCall ? (
                                    <a
                                      className="text-sky-700 underline underline-offset-2 hover:text-sky-800"
                                      href={`tel:${contact.phone}`}
                                    >
                                      Call
                                    </a>
                                  ) : null}
                                  {contact.email &&
                                  contactActionPermissions.canEmail ? (
                                    <a
                                      className="text-sky-700 underline underline-offset-2 hover:text-sky-800"
                                      href={`mailto:${contact.email}`}
                                    >
                                      Email
                                    </a>
                                  ) : null}
                                  {contact.phone &&
                                  contactActionPermissions.canSms ? (
                                    <a
                                      className="text-sky-700 underline underline-offset-2 hover:text-sky-800"
                                      href={`sms:${contact.phone}`}
                                    >
                                      SMS
                                    </a>
                                  ) : null}
                                </p>
                              </div>
                              <form action={archivePlayerContactAction}>
                                <input
                                  name="contactId"
                                  type="hidden"
                                  value={contact.id}
                                />
                                <input
                                  name="playerId"
                                  type="hidden"
                                  value={player.id}
                                />
                                <Button
                                  disabled={!session?.user}
                                  size="sm"
                                  type="submit"
                                  variant="ghost"
                                >
                                  Archive contact
                                </Button>
                              </form>
                            </li>
                          ),
                        )}
                      </ul>
                    )}

                    <form
                      action={createPlayerContactAction}
                      className="grid gap-3 sm:grid-cols-2"
                    >
                      <input name="playerId" type="hidden" value={player.id} />
                      <FormField
                        htmlFor={`contact-first-name-${player.id}`}
                        label="First name"
                      >
                        <Input
                          autoComplete="given-name"
                          id={`contact-first-name-${player.id}`}
                          maxLength={120}
                          name="firstName"
                          required
                        />
                      </FormField>
                      <FormField
                        htmlFor={`contact-last-name-${player.id}`}
                        label="Last name"
                      >
                        <Input
                          autoComplete="family-name"
                          id={`contact-last-name-${player.id}`}
                          maxLength={120}
                          name="lastName"
                          required
                        />
                      </FormField>
                      <FormField
                        htmlFor={`contact-relationship-type-${player.id}`}
                        label="Relationship type"
                      >
                        <div className="grid gap-2">
                          <select
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            defaultValue="parent"
                            id={`contact-relationship-type-${player.id}`}
                            name="relationshipType"
                            aria-describedby={`contact-relationship-help-${player.id}`}
                          >
                            {Object.entries(RELATIONSHIP_TYPE_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                          <p
                            className="text-xs text-slate-500"
                            id={`contact-relationship-help-${player.id}`}
                          >
                            Choose the closest relationship. If you choose Other,
                            fill in the custom relationship field below.
                          </p>
                        </div>
                      </FormField>
                      <FormField
                        htmlFor={`contact-custom-relationship-${player.id}`}
                        label="Custom relationship"
                      >
                        <div className="grid gap-2">
                          <Input
                            id={`contact-custom-relationship-${player.id}`}
                            maxLength={120}
                            name="customRelationship"
                            placeholder="Only needed when Relationship type is Other"
                            aria-describedby={`contact-custom-relationship-help-${player.id}`}
                          />
                          <p
                            className="text-xs text-slate-500"
                            id={`contact-custom-relationship-help-${player.id}`}
                          >
                            Examples: Aunt, host parent, family friend.
                          </p>
                        </div>
                      </FormField>
                      <FormField
                        htmlFor={`contact-email-${player.id}`}
                        label="Email"
                      >
                        <Input
                          autoComplete="email"
                          id={`contact-email-${player.id}`}
                          maxLength={320}
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                        />
                      </FormField>
                      <FormField
                        htmlFor={`contact-phone-${player.id}`}
                        label="Phone"
                      >
                        <Input
                          autoComplete="tel"
                          id={`contact-phone-${player.id}`}
                          maxLength={32}
                          name="phone"
                          placeholder="Optional"
                        />
                      </FormField>
                      <div className="grid gap-2 self-end pb-2 text-sm text-slate-600">
                        <label className="flex items-center gap-2">
                          <input
                            className="h-4 w-4 rounded border-slate-300"
                            name="isPrimary"
                            type="checkbox"
                            value="true"
                          />
                          Primary contact
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            className="h-4 w-4 rounded border-slate-300"
                            name="isEmergencyContact"
                            type="checkbox"
                            value="true"
                          />
                          Emergency contact
                        </label>
                      </div>
                      <div className="sm:col-span-2">
                        {contactActionPermissions.canExport &&
                        (contactsByPlayerId[player.id] ?? []).length > 0 ? (
                          <a
                            className="mb-2 inline-flex text-xs text-sky-700 underline underline-offset-2 hover:text-sky-800"
                            download={buildContactExportFilename(
                              player.firstName,
                              player.lastName,
                            )}
                            href={buildContactExportHref(
                              contactsByPlayerId[player.id] ?? [],
                            )}
                          >
                            Export contacts (CSV)
                          </a>
                        ) : null}
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          disabled={!session?.user}
                          size="sm"
                          type="submit"
                        >
                          Add contact
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
