import type { Meta, StoryObj } from "@storybook/react";

import { RELATIONSHIP_TYPE_LABELS } from "@/lib/relationship";

function RelationshipDropdown({
  defaultValue = "parent",
  showCustom = false,
}: {
  defaultValue?: string;
  showCustom?: boolean;
}) {
  return (
    <div className="grid max-w-sm gap-3">
      <div className="grid gap-2 text-sm font-medium text-slate-700">
        <label htmlFor="relationship-type">Relationship type</label>
        <select
          aria-describedby="relationship-type-help"
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          defaultValue={defaultValue}
          id="relationship-type"
          name="relationshipType"
        >
          {Object.entries(RELATIONSHIP_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500" id="relationship-type-help">
          Choose the closest relationship. If you choose Other, fill in the
          custom relationship field below.
        </p>
      </div>

      {showCustom ? (
        <div className="grid gap-2 text-sm font-medium text-slate-700">
          <label htmlFor="custom-relationship">Custom relationship</label>
          <input
            aria-describedby="custom-relationship-help"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            id="custom-relationship"
            maxLength={120}
            name="customRelationship"
            placeholder="Aunt, host parent, family friend..."
          />
          <p className="text-xs text-slate-500" id="custom-relationship-help">
            Describe the relationship in a few words.
          </p>
        </div>
      ) : null}
    </div>
  );
}

const meta: Meta<typeof RelationshipDropdown> = {
  title: "Roster/RelationshipDropdown",
  component: RelationshipDropdown,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "label", enabled: true },
          { id: "select-name", enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RelationshipDropdown>;

export const Default: Story = {
  args: { defaultValue: "parent" },
};

export const OtherSelected: Story = {
  args: { defaultValue: "other", showCustom: true },
};

export const Guardian: Story = {
  args: { defaultValue: "guardian" },
};
