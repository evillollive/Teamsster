import type { Meta, StoryObj } from "@storybook/react";

type Match = {
  id: string;
  round: string;
  matchNumber: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore: string | null;
  awayScore: string | null;
  winner: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
};

function BracketMatch({ match }: { match: Match }) {
  const statusColors = {
    scheduled: "bg-slate-100 text-slate-600",
    in_progress: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-600",
  };

  return (
    <section
      aria-label={`Round ${match.round}, Match ${match.matchNumber}`}
      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          R{match.round} M{match.matchNumber}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[match.status]}`}
        >
          {match.status}
        </span>
      </div>
      <div className="grid gap-1">
        <div
          className={`flex items-center justify-between rounded px-2 py-1 text-sm ${match.winner === match.homeTeam && match.winner ? "bg-emerald-50 font-semibold" : ""}`}
        >
          <span>{match.homeTeam ?? "TBD"}</span>
          <span className="font-mono">{match.homeScore ?? "-"}</span>
        </div>
        <div
          className={`flex items-center justify-between rounded px-2 py-1 text-sm ${match.winner === match.awayTeam && match.winner ? "bg-emerald-50 font-semibold" : ""}`}
        >
          <span>{match.awayTeam ?? "TBD"}</span>
          <span className="font-mono">{match.awayScore ?? "-"}</span>
        </div>
      </div>
    </section>
  );
}

function BracketView({ matches }: { matches: Match[] }) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort();
  return (
    <section
      aria-label="Tournament bracket"
      className="flex gap-6 overflow-x-auto p-4"
    >
      {rounds.map((round) => (
        <div className="grid min-w-48 gap-4" key={round}>
          <h3 className="text-sm font-semibold text-slate-600">
            Round {round}
          </h3>
          {matches
            .filter((m) => m.round === round)
            .map((match) => (
              <BracketMatch key={match.id} match={match} />
            ))}
        </div>
      ))}
    </section>
  );
}

const meta: Meta<typeof BracketView> = {
  title: "Tournaments/Bracket",
  component: BracketView,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: { rules: [{ id: "color-contrast", enabled: true }] },
    },
  },
};

export default meta;
type Story = StoryObj<typeof BracketView>;

export const FourTeamSemifinals: Story = {
  args: {
    matches: [
      {
        id: "1",
        round: "1",
        matchNumber: "1",
        homeTeam: "Eagles",
        awayTeam: "Hawks",
        homeScore: "3",
        awayScore: "1",
        winner: "Eagles",
        status: "completed",
      },
      {
        id: "2",
        round: "1",
        matchNumber: "2",
        homeTeam: "Lions",
        awayTeam: "Bears",
        homeScore: "2",
        awayScore: "2",
        winner: null,
        status: "completed",
      },
      {
        id: "3",
        round: "2",
        matchNumber: "1",
        homeTeam: "Eagles",
        awayTeam: null,
        homeScore: null,
        awayScore: null,
        winner: null,
        status: "scheduled",
      },
    ],
  },
};

export const InProgress: Story = {
  args: {
    matches: [
      {
        id: "1",
        round: "1",
        matchNumber: "1",
        homeTeam: "Team A",
        awayTeam: "Team B",
        homeScore: "1",
        awayScore: "0",
        winner: null,
        status: "in_progress",
      },
      {
        id: "2",
        round: "1",
        matchNumber: "2",
        homeTeam: "Team C",
        awayTeam: "Team D",
        homeScore: null,
        awayScore: null,
        winner: null,
        status: "scheduled",
      },
    ],
  },
};

export const Empty: Story = {
  args: { matches: [] },
};
