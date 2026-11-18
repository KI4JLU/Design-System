import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./form";
import { Button } from "./button";

const meta = {
  title: "Components/Forms/Form",
  component: FormItem,
} satisfies Meta<typeof FormItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Field: Story = {
  render: () => (
    <FormItem className="max-w-sm">
      <FormLabel>Benutzername</FormLabel>
      <FormControl>
        <Input placeholder="z. B. anna" />
      </FormControl>
      <FormDescription>Öffentlich sichtbar.</FormDescription>
    </FormItem>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormItem className="max-w-sm" error="Bitte eine gültige E-Mail eingeben.">
      <FormLabel>E-Mail</FormLabel>
      <FormControl>
        <Input type="email" defaultValue="not-an-email" />
      </FormControl>
      <FormMessage />
    </FormItem>
  ),
};

const LiveValidationExample = () => {
  const [value, setValue] = useState("");
  const error = value && !value.includes("@") ? "Ungültige E-Mail." : undefined;
  return (
    <form className="max-w-sm space-y-4" onSubmit={(e) => e.preventDefault()}>
      <FormItem error={error}>
        <FormLabel>E-Mail</FormLabel>
        <FormControl>
          <Input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
      <Button type="submit">Speichern</Button>
    </form>
  );
};

export const LiveValidation: Story = {
  render: () => <LiveValidationExample />,
};

export const StandaloneLabelInput: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-1">
      <Label htmlFor="q">Suche</Label>
      <Input id="q" placeholder="Suchen…" />
    </div>
  ),
};
