import { StubPage } from "@/components/stub-page";

export default function EventsPage() {
  return (
    <StubPage
      bullets={[
        "Game, practice, and generic event flows are part of the roadmap even though only the route shell exists today.",
        "Playwright is configured so scheduling journeys can gain end-to-end coverage as soon as forms land.",
        "The shared mobile-first layout keeps navigation simple for coaches checking event details on the move.",
        "Telemetry flags are ready for opt-in analytics once the product team is comfortable enabling them.",
      ]}
      description="Events are stubbed now so the navigation and page boundaries exist before calendar logic, RSVPs, and notifications are introduced in later milestones."
      eyebrow="Events"
      title="Scheduling-friendly scaffolding without the business logic yet"
    />
  );
}
