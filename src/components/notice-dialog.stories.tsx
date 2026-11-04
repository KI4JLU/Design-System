import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { NoticeDialog, NoticeDialogLink } from "./notice-dialog";
import { Button } from "./button";

const meta = {
  title: "Components/NoticeDialog",
  component: NoticeDialog,
} satisfies Meta<typeof NoticeDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo({ withConfirm = true, linkList = false }: { withConfirm?: boolean; linkList?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Hinweis zeigen</Button>
      <NoticeDialog
        open={open}
        title="Hinweis zur Nutzung von KI"
        links={
          linkList
            ? [
                { href: "#terms", label: "Nutzungsbedingungen" },
                { href: "#privacy", label: "Datenschutzerklärung" },
              ]
            : undefined
        }
        confirmLabel={withConfirm ? "Ich habe den Hinweis gelesen." : undefined}
        acceptLabel="Akzeptieren"
        declineLabel="Abmelden"
        onAccept={() => setOpen(false)}
        onDecline={() => setOpen(false)}
      >
        <p>Du arbeitest hier mit einem KI-System. Antworten erzeugt ein Sprachmodell, nicht ein Mensch.</p>
        <p>KI-Ausgaben können ungenau oder unvollständig sein. Prüfe jede Ausgabe, bevor du sie weiterverwendest.</p>
        {linkList ? (
          <p>Das KI-System darf nicht für private Zwecke eingesetzt werden. Es gelten:</p>
        ) : (
          <p>
            Das KI-System darf nicht für private Zwecke eingesetzt werden. Du bist für deine Eingaben, hochgeladene
            Inhalte und die Weiterverwendung des KI-Outputs verantwortlich. Deine Rechte und Pflichten sind in den{" "}
            <NoticeDialogLink href="#terms">Nutzungsbedingungen</NoticeDialogLink> und der{" "}
            <NoticeDialogLink href="#privacy">Datenschutzerklärung</NoticeDialogLink> beschrieben.
          </p>
        )}
      </NoticeDialog>
    </>
  );
}

const required = { open: true, title: "", children: null, onAccept: () => {}, onDecline: () => {} };

/**
 * Accepting needs the tick; neither Escape nor a click outside closes the
 * notice. The documents are linked where the text names them.
 */
export const WithConfirmation: Story = { args: required, render: () => <Demo /> };

/**
 * Without `confirmLabel`, the accept button is enabled right away. `links`
 * lists documents below the text — only for ones the text does not name.
 */
export const LinkList: Story = { args: required, render: () => <Demo withConfirm={false} linkList /> };
