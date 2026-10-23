import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

describe("Alert", () => {
  it("is a static notice without a role by default", () => {
    const { container } = render(
      <Alert>
        <AlertDescription>Hinweis</AlertDescription>
      </Alert>,
    );
    expect(container.firstElementChild).not.toHaveAttribute("role");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("maps live to status and alert roles", () => {
    const { rerender } = render(
      <Alert live="polite">
        <AlertDescription>Gespeichert</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Gespeichert");

    rerender(
      <Alert live="assertive" tone="error">
        <AlertDescription>Speichern fehlgeschlagen</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen");
  });

  it("applies the tone's container tokens", () => {
    const { container } = render(<Alert tone="warning">x</Alert>);
    expect(container.firstElementChild).toHaveClass(
      "bg-warning-container",
      "text-on-warning-container",
    );
  });

  it("renders a decorative icon per status tone and none for neutral", () => {
    const { container, rerender } = render(<Alert tone="error">x</Alert>);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");

    rerender(<Alert tone="neutral">x</Alert>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("replaces the icon via icon and drops it with icon={null}", () => {
    const { container, rerender } = render(
      <Alert tone="info" icon={<span data-testid="custom" />}>
        x
      </Alert>,
    );
    expect(screen.getByTestId("custom")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();

    rerender(
      <Alert tone="info" icon={null}>
        x
      </Alert>,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a close button only with onDismiss", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Alert tone="warning">x</Alert>);
    expect(screen.queryByRole("button")).toBeNull();

    rerender(
      <Alert tone="warning" onDismiss={onDismiss}>
        x
      </Alert>,
    );
    const close = screen.getByRole("button", { name: "Schließen" });
    expect(close).toHaveAttribute("type", "button");
    await userEvent.click(close);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("accepts a custom dismiss label and is keyboard operable", async () => {
    const onDismiss = vi.fn();
    render(
      <Alert onDismiss={onDismiss} dismissLabel="Hinweis ausblenden">
        x
      </Alert>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Hinweis ausblenden" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps action buttons in the tab order before the close button", async () => {
    render(
      <Alert tone="error" onDismiss={() => {}}>
        <AlertDescription>Laden fehlgeschlagen</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm">
            Erneut versuchen
          </Button>
        </AlertAction>
      </Alert>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Schließen" })).toHaveFocus();
  });

  it("resets user-agent margins on title and description", () => {
    render(
      <Alert>
        <AlertTitle asChild>
          <h3>Titel</h3>
        </AlertTitle>
        <AlertDescription>Text</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Titel" })).toHaveClass("m-0");
    expect(screen.getByText("Text")).toHaveClass("m-0");
  });

  it("passes className through and forwards the ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Alert ref={ref} className="mt-4">
        x
      </Alert>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass("mt-4");
  });
});
