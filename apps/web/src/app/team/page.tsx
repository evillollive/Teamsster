import { StubPage } from "@/components/stub-page";

export default function TeamPage() {
  return (
    <StubPage
      bullets={[
        "Teams carry their own timezone so travel squads and regional leagues can stay accurate.",
        "Permission helpers distinguish league-wide powers from team-level coaching workflows.",
        "No components call the database directly; future team mutations belong in validated server-side modules.",
        "The shell is mobile-first so volunteers can update lineups from the sideline.",
      ]}
      description="Teams are where the everyday work happens, so the scaffold emphasizes clear roles, small reusable UI pieces, and routes that are ready for future feature slices."
      eyebrow="Team"
      title="A calm placeholder for team operations"
    />
  );
}
