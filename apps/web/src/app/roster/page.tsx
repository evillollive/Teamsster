import { StubPage } from "@/components/stub-page";

export default function RosterPage() {
  return (
    <StubPage
      bullets={[
        "Players are modeled separately from users so parents, guardians, and volunteers can collaborate cleanly.",
        "Team roster pages now support player create, update, and archive actions with soft deletes.",
        "Players now track eligibility status/notes and optional profile metadata like pronouns and primary position.",
        "Every roster mutation flows through shared Zod validation and centralized permission checks.",
        "Audit log events are written for player create, update, and archive actions.",
      ]}
      description="Roster management is often the heart of a youth sports app. Start from a league team dashboard and open a team's roster manager to maintain active players without destructive deletes."
      eyebrow="Roster"
      title="Player CRUD, contacts, and metadata workflows are now in place"
    />
  );
}
