import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoticeDialog, NoticeDialogLink, type NoticeDialogProps } from "./notice-dialog";

// Oracle: NoticeDialog's doc comment — an alertdialog named by its title and
// described by its text and links, focus starts on the title, Escape does not
// close it, accepting needs the tick when there is a confirm checkbox, and the
// linked documents open in a new tab, which a screen reader is told; focus
// returns to where it was on close.

function renderNotice(props: Partial<NoticeDialogProps> = {}) {
  const onAccept = vi.fn();
  const onDecline = vi.fn();
  render(
    <NoticeDialog
      open
      title="Hinweis"
      confirmLabel="Gelesen"
      acceptLabel="Akzeptieren"
      declineLabel="Abmelden"
      onAccept={onAccept}
      onDecline={onDecline}
      {...props}
    >
      <p>Erster Absatz.</p>
      <p>
        Es gelten die <NoticeDialogLink href="/terms">Nutzungsbedingungen</NoticeDialogLink>.
      </p>
    </NoticeDialog>,
  );
  return { onAccept, onDecline };
}

describe("NoticeDialog", () => {
  it("is an alertdialog named by its title and described by its text and links", () => {
    renderNotice();
    const dialog = screen.getByRole("alertdialog", { name: "Hinweis" });
    expect(dialog).toHaveAccessibleDescription(
      /^Erster Absatz\. Es gelten die Nutzungsbedingungen ?\(öffnet in neuem Tab\)\.$/,
    );
  });

  it("starts focus on the title", () => {
    renderNotice();
    expect(screen.getByRole("heading", { name: "Hinweis" })).toHaveFocus();
  });

  it("opens a link in the text in a new tab and says so", () => {
    renderNotice();
    const terms = screen.getByRole("link", { name: /^Nutzungsbedingungen ?\(öffnet in neuem Tab\)$/ });
    expect(terms).toHaveAttribute("href", "/terms");
    expect(terms).toHaveAttribute("target", "_blank");
    expect(terms).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("tells screen readers about the new tab in the dialog's newTabLabel", () => {
    renderNotice({ newTabLabel: "opens in a new tab" });
    expect(screen.getByRole("link", { name: /^Nutzungsbedingungen ?\(opens in a new tab\)$/ })).toBeInTheDocument();
  });

  it("lists documents the text does not name below it", () => {
    renderNotice({ links: [{ href: "/privacy", label: "Datenschutzerklärung" }] });
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Datenschutzerklärung");
    expect(screen.getByRole("link", { name: /^Datenschutzerklärung/ })).toHaveAttribute("target", "_blank");
  });

  it("accepts only after the confirm checkbox is ticked", async () => {
    const { onAccept } = renderNotice();
    const accept = screen.getByRole("button", { name: "Akzeptieren" });
    expect(accept).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: "Gelesen" }));
    await userEvent.click(accept);
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("accepts without a tick when there is no confirm checkbox", async () => {
    const { onAccept } = renderNotice({ confirmLabel: undefined });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Akzeptieren" }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it("keeps accepting disabled while pending", async () => {
    renderNotice({ pending: true });
    await userEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "Akzeptieren" })).toBeDisabled();
  });

  it("declines through its second action and stays open on Escape", async () => {
    const { onDecline } = renderNotice();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Abmelden" }));
    expect(onDecline).toHaveBeenCalledOnce();
  });

  it("returns focus to where it was when it closes", async () => {
    function Host() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Öffnen</button>
          <NoticeDialog open={open} title="Hinweis" onAccept={() => setOpen(false)} onDecline={() => setOpen(false)}>
            <p>Text.</p>
          </NoticeDialog>
        </>
      );
    }
    render(<Host />);
    const opener = screen.getByRole("button", { name: "Öffnen" });
    await userEvent.click(opener);
    expect(screen.getByRole("heading", { name: "Hinweis" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Akzeptieren" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});
