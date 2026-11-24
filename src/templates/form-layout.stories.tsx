import type { Meta, StoryObj } from "@storybook/react-vite";
import { composeStories } from "@storybook/react-vite";
import { FormLayout } from "./form-layout";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Stack } from "../components/stack";
import * as formStories from "../components/form.stories";
import * as selectStories from "../components/select.stories";

// Portable stories: field examples from the existing component stories are
// reused as form content, not mocked anew.
const { Field, WithError } = composeStories(formStories, {});
const { InForm: SelectInForm } = composeStories(selectStories, {});

const meta = {
  title: "Templates/FormLayout",
  component: FormLayout,
  tags: ["!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FormLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Settings: Story = {
  args: {
    title: "Element-Einstellungen",
    description: "Name, Standard-Modell und Fehlerzustände.",
  },
  render: (args) => (
    <form onSubmit={(e) => e.preventDefault()}>
      <FormLayout
        {...args}
        actions={
          <>
            <Button variant="secondary" type="button">
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </>
        }
      >
        <Card className="p-6">
          <Stack gap="md">
            <Field />
            <SelectInForm />
          </Stack>
        </Card>
        <Card className="p-6">
          <WithError />
        </Card>
      </FormLayout>
    </form>
  ),
};
