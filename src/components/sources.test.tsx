import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Source, Sources, SourcesContent, SourcesTrigger } from "./sources";

// Oracle for this file: the AI Elements registry source of `sources`
// (https://elements.ai-sdk.dev/api/registry/sources.json, the revision the
// shadcn CLI installed), read independently of the DS file: `Sources` is a
// Collapsible (closed by default, Radix unmounts closed content);
// `SourcesTrigger` is the `CollapsibleTrigger` button and, without children,
// shows "Used {count} sources" (German literal here: "{count} Quellen
// verwendet") plus a chevron; `Source` is an `<a>` with `target="_blank"` and
// `rel="noreferrer"` that shows its `title` unless given children.
function Subject() {
  return (
    <Sources>
      <SourcesTrigger count={2} />
      <SourcesContent>
        <Source href="https://www.uni-giessen.de/a" title="Prüfungsordnung" />
        <Source href="https://www.uni-giessen.de/b" title="Modulhandbuch" />
      </SourcesContent>
    </Sources>
  );
}

describe("Sources", () => {
  it("starts closed with the count in the trigger", () => {
    render(<Subject />);
    const trigger = screen.getByRole("button", { name: "2 Quellen verwendet" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("opens on click and lists the sources as new-tab links", async () => {
    render(<Subject />);
    const trigger = screen.getByRole("button", { name: "2 Quellen verwendet" });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const link = screen.getByRole("link", { name: "Prüfungsordnung" });
    expect(link).toHaveAttribute("href", "https://www.uni-giessen.de/a");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("closes again on a second click", async () => {
    render(<Subject />);
    const trigger = screen.getByRole("button", { name: "2 Quellen verwendet" });
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("uses the title as text, not as a title attribute", async () => {
    render(<Subject />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("link", { name: "Modulhandbuch" })).not.toHaveAttribute("title");
  });

  it("uses children instead of the default trigger and source markup", async () => {
    render(
      <Sources>
        <SourcesTrigger count={1}>Belege</SourcesTrigger>
        <SourcesContent>
          <Source href="/x" title="unbenutzt">
            Eigener Eintrag
          </Source>
        </SourcesContent>
      </Sources>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Belege" }));
    expect(screen.getByRole("link", { name: "Eigener Eintrag" })).toBeInTheDocument();
    expect(screen.queryByText("unbenutzt")).not.toBeInTheDocument();
    expect(screen.queryByText("1 Quellen verwendet")).not.toBeInTheDocument();
  });
});
