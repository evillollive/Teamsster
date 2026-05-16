import { StubPage } from "@/components/stub-page";

export default function LeaguePage() {
  return (
    <StubPage
      bullets={[
        "Every team belongs to a league, including the Personal League created for solo organizers.",
        "League and team timezones are first-class fields in the Drizzle schema scaffold.",
        "Soft deletes and audit logs are included from the start to support trustworthy administration.",
        "Owner, admin, coach, board, player, parent, and guest permissions are centralized in code.",
      ]}
      description="This league hub is a placeholder today, but the schema and permission model behind it already assume multi-tenancy, collaboration, and future extension points."
      eyebrow="League"
      title="League-first scaffolding with future-proof guardrails"
    />
  );
}
