import { Card } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Legal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </Card>

      <Card className="prose prose-slate max-w-none text-sm leading-7">
        <h2 className="text-lg font-semibold">1. Information We Collect</h2>
        <p>
          Teamsster collects information you provide directly, including your
          name, email address, timezone, and notification preferences when you
          create an account. When you manage leagues, teams, and rosters, we
          store the information you enter about players, contacts, events, and
          announcements.
        </p>

        <h2 className="mt-6 text-lg font-semibold">
          2. Children&apos;s Privacy (COPPA Compliance)
        </h2>
        <p>
          Teamsster is designed for use by coaches, administrators, and parents
          managing youth sports organizations. We do not knowingly collect
          personal information directly from children under 13. Player records
          are created and managed by authorized adult users (coaches, admins,
          parents). If you believe a child under 13 has provided us with
          personal information without parental consent, please contact us
          immediately so we can remove it.
        </p>

        <h2 className="mt-6 text-lg font-semibold">
          3. How We Use Your Information
        </h2>
        <ul className="list-disc pl-5">
          <li>To provide and maintain the Teamsster service</li>
          <li>To send notifications you have opted into (announcements, event reminders, weekly digests)</li>
          <li>To enforce permissions and access controls within leagues and teams</li>
          <li>To generate audit logs for administrative transparency</li>
          <li>To improve the service through anonymized usage analytics (when enabled)</li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold">4. Data Sharing</h2>
        <p>
          We do not sell your personal information. We share data only with:
        </p>
        <ul className="list-disc pl-5">
          <li>Other members of your leagues and teams, as permitted by your role and the app&apos;s permission system</li>
          <li>Service providers who help us operate (database hosting, email delivery) under strict data processing agreements</li>
          <li>Law enforcement when required by law</li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold">5. Data Retention</h2>
        <p>
          We retain your account data as long as your account is active.
          Archived records (leagues, teams, players) are soft-deleted and can
          be permanently removed upon request. You may delete your account at
          any time from your account settings, which will remove your personal
          data and disassociate you from all leagues and teams.
        </p>

        <h2 className="mt-6 text-lg font-semibold">6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5">
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Delete your account and associated data</li>
          <li>Export your data</li>
          <li>Opt out of non-essential communications</li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold">7. Security</h2>
        <p>
          We use industry-standard security measures including encrypted
          connections (TLS), secure password hashing, environment-specific
          secret management, and role-based access controls. All administrative
          actions are logged for audit purposes.
        </p>

        <h2 className="mt-6 text-lg font-semibold">8. Analytics</h2>
        <p>
          When analytics are enabled, we use privacy-focused tools (such as
          Plausible Analytics) that do not use cookies and do not track
          individual users across sites. Error monitoring (such as Sentry) is
          used solely to identify and fix technical issues.
        </p>

        <h2 className="mt-6 text-lg font-semibold">9. Contact</h2>
        <p>
          For privacy-related questions or requests, contact us at the email
          address listed in your organization&apos;s Teamsster settings or via
          our GitHub repository.
        </p>
      </Card>
    </div>
  );
}
