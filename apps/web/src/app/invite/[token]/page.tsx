import { auth } from "@teamsster/auth";
import {
  getLeagueInvitationByToken,
  getTeamInvitationByToken,
} from "@teamsster/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  acceptLeagueInvitationForUser,
  acceptTeamInvitationForUser,
} from "@/lib/membership";

type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

type InvitePageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

type LeagueInvitation = NonNullable<
  Awaited<ReturnType<typeof getLeagueInvitationByToken>>
>;
type TeamInvitation = NonNullable<
  Awaited<ReturnType<typeof getTeamInvitationByToken>>
>;
type InvitationDetail =
  | ({ kind: "league" } & LeagueInvitation)
  | ({ kind: "team" } & TeamInvitation);

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getInvitationStatus(invitation: {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
}): InvitationStatus {
  if (invitation.acceptedAt) {
    return "accepted";
  }
  if (invitation.revokedAt) {
    return "revoked";
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    return "expired";
  }
  return "pending";
}

function getDestinationHref(invitation: InvitationDetail) {
  return invitation.kind === "league"
    ? `/league/${invitation.leagueId}`
    : `/league/${invitation.leagueId}/team/${invitation.teamId}`;
}

function getInviteHeading(invitation: InvitationDetail) {
  return invitation.kind === "league"
    ? `Join ${invitation.leagueName}`
    : `Join ${invitation.teamName}`;
}

function getInviteContext(invitation: InvitationDetail) {
  return invitation.kind === "league"
    ? `League · ${invitation.leagueName}`
    : `Team · ${invitation.teamName} in ${invitation.leagueName}`;
}

function getActionErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case "accepted":
      return (
        "This invitation was already accepted. You can head straight to the " +
        "dashboard."
      );
    case "email-mismatch":
      return (
        "This invitation belongs to a different email address. Sign in with " +
        "the invited account to accept it."
      );
    case "expired":
      return "This invitation has expired. Ask an admin to send you a fresh invite.";
    case "revoked":
      return "This invitation was revoked before it could be accepted.";
    case "unavailable":
      return (
        "This invitation changed while you were viewing the page. Refresh and " +
        "try again."
      );
    default:
      return null;
  }
}

function mapAcceptErrorToCode(message: string) {
  if (message.includes("already been accepted")) {
    return "accepted";
  }
  if (message.includes("different email address")) {
    return "email-mismatch";
  }
  if (message.includes("expired")) {
    return "expired";
  }
  if (message.includes("revoked")) {
    return "revoked";
  }
  return "unavailable";
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const requestHeaders = await headers();
  const [{ token }, query, session] = await Promise.all([
    params,
    searchParams,
    auth.api.getSession({ headers: requestHeaders }),
  ]);

  const leagueInvitation = await getLeagueInvitationByToken(token);
  const teamInvitation = leagueInvitation
    ? null
    : await getTeamInvitationByToken(token);
  const invitation = leagueInvitation
    ? ({ kind: "league", ...leagueInvitation } satisfies InvitationDetail)
    : teamInvitation
      ? ({ kind: "team", ...teamInvitation } satisfies InvitationDetail)
      : null;

  if (!invitation) {
    return (
      <Card className="grid gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Invitation
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Invitation not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            This invite link is invalid or no longer points to an active league or
            team.
          </p>
        </div>
        <div>
          <Button asChild size="sm">
            <Link href="/league">Go to leagues</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const destinationHref = getDestinationHref(invitation);
  const invitationKind = invitation.kind;
  const invitationStatus = getInvitationStatus(invitation);
  const invitedEmail = invitation.email.trim().toLowerCase();
  const signedInEmail = session?.user?.email?.trim().toLowerCase() ?? null;
  const emailMatches = signedInEmail === invitedEmail;
  const actionErrorMessage =
    invitationStatus === "pending" ? getActionErrorMessage(query.error) : null;

  async function acceptInvitationAction() {
    "use server";

    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });
    if (!currentSession?.user) {
      redirect("/account");
    }

    try {
      if (invitationKind === "league") {
        const acceptedInvitation = await acceptLeagueInvitationForUser(
          currentSession.user.id,
          token,
        );
        revalidatePath("/league");
        revalidatePath(`/league/${acceptedInvitation.leagueId}`);
        redirect(`/league/${acceptedInvitation.leagueId}`);
      }

      const acceptedInvitation = await acceptTeamInvitationForUser(
        currentSession.user.id,
        token,
      );
      revalidatePath("/league");
      revalidatePath("/team");
      revalidatePath(`/league/${acceptedInvitation.leagueId}`);
      revalidatePath(
        `/league/${acceptedInvitation.leagueId}/team/${acceptedInvitation.teamId}`,
      );
      redirect(
        `/league/${acceptedInvitation.leagueId}/team/${acceptedInvitation.teamId}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        redirect(`/invite/${token}?error=${mapAcceptErrorToCode(error.message)}`);
      }
      throw error;
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Invitation
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {getInviteHeading(invitation)}
        </h1>
        <p className="text-sm text-slate-600">
          You&apos;ve been invited as a {formatRole(invitation.role)}.
        </p>
      </Card>

      <Card className="grid gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Invite details
          </p>
          <p className="mt-2 font-semibold text-slate-900">
            {getInviteContext(invitation)}
          </p>
        </div>
        <div className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <p>
            <span className="font-medium text-slate-900">Role:</span>{" "}
            {formatRole(invitation.role)}
          </p>
          <p>
            <span className="font-medium text-slate-900">Invited email:</span>{" "}
            {invitation.email}
          </p>
          <p>
            <span className="font-medium text-slate-900">Expires:</span>{" "}
            {invitation.expiresAt.toLocaleString()}
          </p>
          <p>
            <span className="font-medium text-slate-900">Destination:</span>{" "}
            {destinationHref}
          </p>
        </div>
      </Card>

      <Card className="grid gap-4">
        {actionErrorMessage ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {actionErrorMessage}
          </p>
        ) : null}

        {invitationStatus === "accepted" ? (
          <>
            <div>
              <h2 className="text-lg font-semibold">Invitation already accepted</h2>
              <p className="mt-1 text-sm text-slate-600">
                This link has already been used. You can still open the related
                dashboard if you have access.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild size="sm">
                <Link href={destinationHref}>Open dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/league">Back to leagues</Link>
              </Button>
            </div>
          </>
        ) : null}

        {invitationStatus === "revoked" ? (
          <div>
            <h2 className="text-lg font-semibold">Invitation revoked</h2>
            <p className="mt-1 text-sm text-slate-600">
              This invitation is no longer active. Ask a league admin to send a
              replacement invite if you still need access.
            </p>
          </div>
        ) : null}

        {invitationStatus === "expired" ? (
          <div>
            <h2 className="text-lg font-semibold">Invitation expired</h2>
            <p className="mt-1 text-sm text-slate-600">
              This invite has timed out. Ask an admin for a fresh invitation.
            </p>
          </div>
        ) : null}

        {invitationStatus === "pending" && !session?.user ? (
          <>
            <div>
              <h2 className="text-lg font-semibold">Sign in to accept</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sign in through Better Auth first, then come back here to accept
                your invitation.
              </p>
            </div>
            <div>
              <Button asChild size="sm">
                <Link href="/account">Go to account</Link>
              </Button>
            </div>
          </>
        ) : null}

        {invitationStatus === "pending" && session?.user && !emailMatches ? (
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">Wrong account signed in</h2>
            <p className="text-sm text-slate-600">
              This invite was sent to {invitation.email}. Sign in with that email
              address to accept it.
            </p>
            <div>
              <Button asChild size="sm" variant="secondary">
                <Link href="/account">Manage account</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {invitationStatus === "pending" && session?.user && emailMatches ? (
          <>
            <div>
              <h2 className="text-lg font-semibold">Accept invitation</h2>
              <p className="mt-1 text-sm text-slate-600">
                You&apos;re signed in as {session.user.email}. Accepting this invite
                will add you to the destination right away.
              </p>
            </div>
            <form action={acceptInvitationAction}>
              <Button type="submit">Accept invitation</Button>
            </form>
          </>
        ) : null}
      </Card>
    </div>
  );
}
