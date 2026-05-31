import type { Meta, StoryObj } from "@storybook/react";

type IncidentReport = {
  id: string;
  type: "injury" | "conduct" | "facility" | "other";
  severity: "minor" | "moderate" | "serious" | "critical";
  title: string;
  narrative: string;
  date: string;
  reportedBy: string;
  reviewed: boolean;
};

const severityColors = {
  minor: "bg-slate-100 text-slate-600",
  moderate: "bg-amber-100 text-amber-700",
  serious: "bg-orange-100 text-orange-700",
  critical: "bg-rose-100 text-rose-700",
};

const typeIcons = { injury: "🩹", conduct: "⚠️", facility: "🏟️", other: "📋" };

function IncidentList({ reports }: { reports: IncidentReport[] }) {
  return (
    <ul aria-label="Incident reports" className="grid max-w-lg gap-3">
      {reports.map((report) => (
        <li
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          key={report.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{typeIcons[report.type]}</span>
                <p className="font-medium text-slate-900">{report.title}</p>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {report.narrative.slice(0, 100)}
                {report.narrative.length > 100 ? "..." : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[report.severity]}`}
                >
                  {report.severity}
                </span>
                <span className="text-xs text-slate-400">
                  {report.date} by {report.reportedBy}
                </span>
              </div>
            </div>
            {report.reviewed ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Reviewed
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Pending
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

const meta: Meta<typeof IncidentList> = {
  title: "Incidents/ReportList",
  component: IncidentList,
  tags: ["autodocs"],
  parameters: {
    a11y: { config: { rules: [{ id: "color-contrast", enabled: true }] } },
  },
};

export default meta;
type Story = StoryObj<typeof IncidentList>;

export const MixedReports: Story = {
  args: {
    reports: [
      {
        id: "1",
        type: "injury",
        severity: "moderate",
        title: "Ankle sprain during practice",
        narrative:
          "Player A twisted their ankle on the sideline. Ice applied, parent notified.",
        date: "2026-06-01",
        reportedBy: "Coach Kim",
        reviewed: false,
      },
      {
        id: "2",
        type: "conduct",
        severity: "minor",
        title: "Unsportsmanlike behavior",
        narrative:
          "Player B received a yellow card for arguing with the referee.",
        date: "2026-05-28",
        reportedBy: "Ref Martinez",
        reviewed: true,
      },
      {
        id: "3",
        type: "facility",
        severity: "serious",
        title: "Broken goal post",
        narrative: "Goal post on Field B collapsed during warmup. No injuries.",
        date: "2026-05-25",
        reportedBy: "Coach Rivera",
        reviewed: true,
      },
    ],
  },
};

export const CriticalOnly: Story = {
  args: {
    reports: [
      {
        id: "1",
        type: "injury",
        severity: "critical",
        title: "Concussion suspected",
        narrative: "Player hit head on goalpost. EMS called.",
        date: "2026-06-01",
        reportedBy: "Ref Johnson",
        reviewed: false,
      },
    ],
  },
};
