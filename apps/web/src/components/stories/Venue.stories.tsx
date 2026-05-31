import type { Meta, StoryObj } from "@storybook/react";

type Venue = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  fieldCount: number;
};

type AvailabilitySlot = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  fieldName: string;
};

function VenueList({ venues }: { venues: Venue[] }) {
  return (
    <ul aria-label="Venues" className="grid max-w-lg gap-3">
      {venues.map((venue) => (
        <li
          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          key={venue.id}
        >
          <p className="font-medium text-slate-900">{venue.name}</p>
          {venue.address ? (
            <p className="mt-1 text-sm text-slate-500">
              {venue.address}
              {venue.city ? `, ${venue.city}` : ""}
              {venue.state ? `, ${venue.state}` : ""}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-slate-400">
            {venue.fieldCount} field{venue.fieldCount !== 1 ? "s" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function AvailabilityCalendar({ slots }: { slots: AvailabilitySlot[] }) {
  const days = [...new Set(slots.map((s) => s.dayOfWeek))];
  return (
    <section aria-label="Field availability" className="max-w-md">
      {days.map((day) => (
        <div className="mb-3" key={day}>
          <h3 className="text-sm font-semibold text-slate-700">{day}</h3>
          <ul className="mt-1 grid gap-1">
            {slots
              .filter((s) => s.dayOfWeek === day)
              .map((slot) => (
                <li
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  key={`${day}-${slot.fieldName}-${slot.startTime}`}
                >
                  <span className="font-medium">{slot.fieldName}</span>
                  <span className="text-slate-500">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

const meta: Meta<typeof VenueList> = {
  title: "Venues/VenueList",
  component: VenueList,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: true },
          { id: "list", enabled: true },
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VenueList>;

export const MultipleVenues: Story = {
  args: {
    venues: [
      {
        id: "1",
        name: "Riverside Park",
        address: "123 River Rd",
        city: "Springfield",
        state: "IL",
        fieldCount: 3,
      },
      {
        id: "2",
        name: "Community Center",
        address: "456 Main St",
        city: "Springfield",
        state: "IL",
        fieldCount: 1,
      },
    ],
  },
};

export const Availability: StoryObj<typeof AvailabilityCalendar> = {
  render: () => (
    <AvailabilityCalendar
      slots={[
        {
          dayOfWeek: "Monday",
          startTime: "09:00",
          endTime: "11:00",
          fieldName: "Field A",
        },
        {
          dayOfWeek: "Monday",
          startTime: "14:00",
          endTime: "16:00",
          fieldName: "Field B",
        },
        {
          dayOfWeek: "Wednesday",
          startTime: "17:00",
          endTime: "19:00",
          fieldName: "Field A",
        },
        {
          dayOfWeek: "Saturday",
          startTime: "08:00",
          endTime: "12:00",
          fieldName: "Field A",
        },
        {
          dayOfWeek: "Saturday",
          startTime: "08:00",
          endTime: "12:00",
          fieldName: "Field B",
        },
      ]}
    />
  ),
};
