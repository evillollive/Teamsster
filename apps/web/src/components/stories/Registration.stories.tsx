import type { Meta, StoryObj } from "@storybook/react";

type RegistrationStatus =
  | "not_started"
  | "incomplete"
  | "submitted"
  | "approved"
  | "rejected";

type DashboardEntry = {
  playerName: string;
  guardianName: string;
  status: RegistrationStatus;
  submittedAt: string | null;
};

const statusColors: Record<RegistrationStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  incomplete: "bg-amber-100 text-amber-700",
  submitted: "bg-sky-100 text-sky-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-600",
};

function RegistrationDashboard({
  entries,
  seasonName,
}: {
  entries: DashboardEntry[];
  seasonName: string;
}) {
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section aria-label="Registration dashboard" className="max-w-2xl">
      <h2 className="mb-2 text-lg font-semibold">{seasonName} registrations</h2>
      <div className="mb-4 flex flex-wrap gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status as RegistrationStatus]}`}
            key={status}
          >
            {status.replace("_", " ")}: {count}
          </span>
        ))}
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <th className="px-3 py-2" scope="col">
              Player
            </th>
            <th className="px-3 py-2" scope="col">
              Guardian
            </th>
            <th className="px-3 py-2" scope="col">
              Status
            </th>
            <th className="px-3 py-2" scope="col">
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr className="border-b border-slate-100" key={entry.playerName}>
              <td className="px-3 py-2 font-medium">{entry.playerName}</td>
              <td className="px-3 py-2 text-slate-600">{entry.guardianName}</td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[entry.status]}`}
                >
                  {entry.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-500">
                {entry.submittedAt ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function WizardStep({
  step,
  totalSteps,
  title,
  children,
}: {
  step: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={`Step ${step} of ${totalSteps}: ${title}`}
      className="max-w-md"
    >
      <div className="mb-4">
        <div
          aria-label={`Step ${step} of ${totalSteps}`}
          className="flex gap-1"
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          {Array.from({ length: totalSteps }, (_, idx) => (
            <div
              className={`h-1.5 flex-1 rounded-full ${idx < step ? "bg-sky-500" : "bg-slate-200"}`}
              // biome-ignore lint/suspicious/noArrayIndexKey: Static progress bar segments
              key={idx}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Step {step} of {totalSteps}
        </p>
      </div>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const meta: Meta<typeof RegistrationDashboard> = {
  title: "Registration/Dashboard",
  component: RegistrationDashboard,
  tags: ["autodocs"],
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
};

export default meta;
type Story = StoryObj<typeof RegistrationDashboard>;

export const MixedStatuses: Story = {
  args: {
    seasonName: "Spring 2026",
    entries: [
      {
        playerName: "Alex Rivera",
        guardianName: "Maria Rivera",
        status: "approved",
        submittedAt: "2026-03-15",
      },
      {
        playerName: "Sam Chen",
        guardianName: "Wei Chen",
        status: "submitted",
        submittedAt: "2026-03-20",
      },
      {
        playerName: "Jordan Lee",
        guardianName: "Chris Lee",
        status: "incomplete",
        submittedAt: null,
      },
      {
        playerName: "Casey Kim",
        guardianName: "Pat Kim",
        status: "not_started",
        submittedAt: null,
      },
      {
        playerName: "Taylor Smith",
        guardianName: "Robin Smith",
        status: "rejected",
        submittedAt: "2026-03-10",
      },
    ],
  },
};

export const WizardPlayerInfo: StoryObj<typeof WizardStep> = {
  render: () => (
    <WizardStep step={1} title="Player information" totalSteps={4}>
      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="first">
            First name
          </label>
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            id="first"
            placeholder="First name"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="last">
            Last name
          </label>
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            id="last"
            placeholder="Last name"
          />
        </div>
      </div>
    </WizardStep>
  ),
};

export const WizardReview: StoryObj<typeof WizardStep> = {
  render: () => (
    <WizardStep step={4} title="Review and submit" totalSteps={4}>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p>
          <strong>Player:</strong> Alex Rivera
        </p>
        <p>
          <strong>Guardian:</strong> Maria Rivera (Parent)
        </p>
        <p>
          <strong>Division:</strong> U12 Competitive
        </p>
        <p className="mt-2 text-xs text-slate-500">
          By submitting, you confirm the information is accurate.
        </p>
      </div>
    </WizardStep>
  ),
};
