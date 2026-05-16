import { StubPage } from "@/components/stub-page";

export default function RosterPage() {
  return (
    <StubPage
      bullets={[
        "Players are modeled separately from users so parents, guardians, and volunteers can collaborate cleanly.",
        "The roster scaffold anticipates soft deletes instead of destructive removals.",
        "Future intake forms should use shared Zod helpers before any mutation reaches the database.",
        "Core permission tests already cover who can edit roster-related data.",
      ]}
      description="Roster management is often the heart of a youth sports app, so Teamsster starts by protecting the data model before layering on registrations, waivers, or availability tracking."
      eyebrow="Roster"
      title="People-first data modeling starts here"
    />
  );
}
