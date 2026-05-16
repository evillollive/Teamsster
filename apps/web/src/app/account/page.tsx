import { StubPage } from "@/components/stub-page";

export default function AccountPage() {
  return (
    <StubPage
      bullets={[
        "Better Auth is scaffolded for email/password plus magic link sign-in.",
        "Future account mutations should flow through shared Zod validation helpers.",
        "Profile, timezone, and notification preferences are planned as league-friendly settings.",
        "Sentry and Plausible remain off by default until environment variables are explicitly enabled.",
      ]}
      description="Authentication in Teamsster is designed to be welcoming for busy families and volunteers: email/password when you need it, magic links when you just need to get back to the roster fast."
      eyebrow="Account"
      title="Auth-ready, but still intentionally simple"
    />
  );
}
