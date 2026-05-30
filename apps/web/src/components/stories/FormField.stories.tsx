import type { Meta, StoryObj } from "@storybook/react";

import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof FormField> = {
  title: "Components/FormField",
  component: FormField,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    htmlFor: "email",
    label: "Email address",
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="email" placeholder="name@example.com" type="email" />
    </FormField>
  ),
};

export const WithDescription: Story = {
  args: {
    htmlFor: "phone",
    label: "Phone number",
    description: "Include country code for international numbers.",
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="phone" placeholder="+1 555-0100" />
    </FormField>
  ),
};

export const WithError: Story = {
  args: {
    htmlFor: "name",
    label: "First name",
    error: "First name is required.",
  },
  render: (args) => (
    <FormField {...args}>
      <Input id="name" />
    </FormField>
  ),
};
