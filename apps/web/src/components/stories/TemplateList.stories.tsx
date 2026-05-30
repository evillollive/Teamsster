import type { Meta, StoryObj } from "@storybook/react";

type TemplateSummary = {
  id: string;
  name: string;
  type: string;
  description?: string;
  isBuiltIn: boolean;
  teamId: string | null;
};

function TemplateList({ templates }: { templates: TemplateSummary[] }) {
  return (
    <ul aria-label="Templates" className="grid max-w-lg gap-3">
      {templates.map((template) => (
        <li
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          key={template.id}
        >
          <div>
            <p className="font-medium text-slate-900">{template.name}</p>
            {template.description ? (
              <p className="mt-1 text-sm text-slate-500">
                {template.description}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {template.isBuiltIn ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                  Built-in
                </span>
              ) : null}
              {template.teamId ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  Team-level
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  League-level
                </span>
              )}
            </div>
          </div>
          <button
            className="inline-flex h-9 items-center justify-center rounded-full px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            type="button"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

function TemplatePreview({
  template,
}: {
  template: TemplateSummary & { fields: Record<string, unknown> };
}) {
  return (
    <section
      aria-label={`Preview of ${template.name}`}
      className="max-w-md rounded-2xl border border-slate-200 bg-white p-4"
    >
      <h3 className="text-lg font-semibold">{template.name}</h3>
      {template.description ? (
        <p className="mt-1 text-sm text-slate-500">{template.description}</p>
      ) : null}
      <dl className="mt-3 grid gap-2">
        {Object.entries(template.fields).map(([key, value]) => (
          <div className="flex gap-2 text-sm" key={key}>
            <dt className="font-medium text-slate-700">{key}:</dt>
            <dd className="text-slate-600">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const meta: Meta<typeof TemplateList> = {
  title: "Templates/TemplateList",
  component: TemplateList,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "list", enabled: true },
          { id: "button-name", enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TemplateList>;

export const BuiltInTemplates: Story = {
  args: {
    templates: [
      {
        id: "1",
        name: "Weekly Practice",
        type: "event",
        description: "Standard weekly team practice session.",
        isBuiltIn: true,
        teamId: null,
      },
      {
        id: "2",
        name: "Game Day",
        type: "event",
        description: "Regular season game with RSVP tracking.",
        isBuiltIn: true,
        teamId: null,
      },
      {
        id: "3",
        name: "Rain Cancellation",
        type: "announcement",
        description: "Quick weather cancellation notice.",
        isBuiltIn: true,
        teamId: null,
      },
    ],
  },
};

export const MixedScope: Story = {
  args: {
    templates: [
      {
        id: "1",
        name: "Custom Practice",
        type: "event",
        description: "Modified practice for our team.",
        isBuiltIn: false,
        teamId: "team-1",
      },
      {
        id: "2",
        name: "Standard Registration",
        type: "registration_form",
        description: "Basic season registration.",
        isBuiltIn: true,
        teamId: null,
      },
    ],
  },
};

export const Empty: Story = {
  args: { templates: [] },
};

// Preview story
export const Preview: StoryObj<typeof TemplatePreview> = {
  render: () => (
    <TemplatePreview
      template={{
        id: "1",
        name: "Weekly Practice",
        type: "event",
        description: "Standard weekly team practice session.",
        isBuiltIn: true,
        teamId: null,
        fields: {
          title: "Practice",
          duration: "90 minutes",
          recurrence: "weekly",
        },
      }}
    />
  ),
};
