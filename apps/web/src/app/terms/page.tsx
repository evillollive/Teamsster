import { Card } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="grid gap-6">
      <Card className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Legal
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </Card>

      <Card className="prose prose-slate max-w-none text-sm leading-7">
        <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Teamsster, you agree to be bound by these Terms
          of Service. If you do not agree, you may not use the service.
        </p>

        <h2 className="mt-6 text-lg font-semibold">
          2. Description of Service
        </h2>
        <p>
          Teamsster is a team and league management platform designed for youth
          sports organizations. It provides tools for managing leagues, teams,
          player rosters, events, announcements, and member roles.
        </p>

        <h2 className="mt-6 text-lg font-semibold">3. User Accounts</h2>
        <ul className="list-disc pl-5">
          <li>
            You must provide accurate information when creating an account
          </li>
          <li>
            You are responsible for maintaining the security of your account
            credentials
          </li>
          <li>
            You must be at least 18 years old to create an account, or have
            parental/guardian consent
          </li>
          <li>One person may not maintain more than one account</li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5">
          <li>Use the service for any unlawful purpose</li>
          <li>
            Upload or share content that is harmful, abusive, or violates
            others&apos; rights
          </li>
          <li>
            Attempt to gain unauthorized access to other users&apos; accounts or
            data
          </li>
          <li>Interfere with or disrupt the service infrastructure</li>
          <li>
            Use automated tools to scrape or access the service without
            permission
          </li>
        </ul>

        <h2 className="mt-6 text-lg font-semibold">5. User Content</h2>
        <p>
          You retain ownership of content you create (league names, team
          information, player records, announcements). By using the service,
          you grant Teamsster a license to store, display, and transmit your
          content as needed to provide the service.
        </p>

        <h2 className="mt-6 text-lg font-semibold">
          6. Roles and Permissions
        </h2>
        <p>
          League and team administrators are responsible for managing member
          roles and permissions within their organizations. Teamsster provides
          role-based access controls but is not responsible for how
          administrators assign or manage these roles.
        </p>

        <h2 className="mt-6 text-lg font-semibold">
          7. Player Data and Minors
        </h2>
        <p>
          Player records in Teamsster represent youth athletes and are managed
          by authorized adults. Users who create or manage player records are
          responsible for ensuring they have appropriate authority (as a coach,
          administrator, or parent/guardian) to manage that information.
        </p>

        <h2 className="mt-6 text-lg font-semibold">8. Account Termination</h2>
        <p>
          You may delete your account at any time from your account settings.
          We may suspend or terminate accounts that violate these terms. Upon
          termination, your personal data will be removed, but audit logs and
          anonymized records may be retained for organizational continuity.
        </p>

        <h2 className="mt-6 text-lg font-semibold">
          9. Limitation of Liability
        </h2>
        <p>
          Teamsster is provided &quot;as is&quot; without warranties of any
          kind. We are not liable for any indirect, incidental, or
          consequential damages arising from your use of the service.
        </p>

        <h2 className="mt-6 text-lg font-semibold">10. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the
          service after changes constitutes acceptance of the updated terms.
          We will notify users of material changes via email or in-app notice.
        </p>

        <h2 className="mt-6 text-lg font-semibold">11. Open Source</h2>
        <p>
          Teamsster is open-source software licensed under AGPL-3.0. The source
          code is available on GitHub. These Terms of Service govern your use
          of the hosted service, not the source code itself.
        </p>

        <h2 className="mt-6 text-lg font-semibold">12. Contact</h2>
        <p>
          For questions about these terms, contact us via our GitHub repository
          or the contact information in your organization&apos;s settings.
        </p>
      </Card>
    </div>
  );
}
