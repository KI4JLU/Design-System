import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
} from "./description-list";

const renderList = (layout?: "stacked" | "inline") =>
  render(
    <DescriptionList layout={layout} aria-label="Konto">
      <DescriptionItem data-testid="item">
        <DescriptionTerm>E-Mail</DescriptionTerm>
        <DescriptionDetails>maria@uni-giessen.de</DescriptionDetails>
      </DescriptionItem>
    </DescriptionList>,
  );

describe("DescriptionList", () => {
  it("renders dl > div > dt + dd", () => {
    const { container } = renderList();
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    const item = dl!.firstElementChild!;
    expect(item.tagName).toBe("DIV");
    expect([...item.children].map((el) => el.tagName)).toEqual(["DT", "DD"]);
  });

  it("exposes term and definition roles", () => {
    renderList();
    const list = screen.getByLabelText("Konto");
    expect(within(list).getByRole("term")).toHaveTextContent("E-Mail");
    expect(within(list).getByRole("definition")).toHaveTextContent("maria@uni-giessen.de");
  });

  it("resets user-agent margins on dl and dd", () => {
    const { container } = renderList();
    expect(container.querySelector("dl")).toHaveClass("m-0");
    expect(container.querySelector("dd")).toHaveClass("m-0");
  });

  it("styles the term as a muted label and the value as body text", () => {
    renderList();
    expect(screen.getByText("E-Mail")).toHaveClass("text-label-sm", "text-on-surface-variant");
    expect(screen.getByText("maria@uni-giessen.de")).toHaveClass("text-body-base", "text-on-surface");
  });

  it("lets a long term wrap anywhere so the inline term column keeps its cap", () => {
    render(
      <DescriptionList layout="inline">
        <DescriptionTerm>Datenschutzgrundverordnungskonformitätsprüfung</DescriptionTerm>
        <DescriptionDetails>Bestanden</DescriptionDetails>
      </DescriptionList>,
    );
    expect(screen.getByText("Datenschutzgrundverordnungskonformitätsprüfung")).toHaveClass(
      "min-w-0",
      "wrap-anywhere",
    );
  });

  it("stacks by default", () => {
    const { container } = renderList();
    expect(container.querySelector("dl")).toHaveClass("flex-col");
    expect(screen.getByTestId("item")).toHaveClass("flex", "flex-col");
  });

  it("lays items into the list's two-column grid when inline", () => {
    const { container } = renderList("inline");
    expect(container.querySelector("dl")).toHaveClass("grid");
    expect(screen.getByTestId("item")).toHaveClass("col-span-full", "grid-cols-subgrid");
  });

  it("passes className through", () => {
    const { container } = render(
      <DescriptionList className="mt-4">
        <DescriptionTerm className="sr-only">x</DescriptionTerm>
        <DescriptionDetails>y</DescriptionDetails>
      </DescriptionList>,
    );
    expect(container.querySelector("dl")).toHaveClass("mt-4", "m-0");
    expect(container.querySelector("dt")).toHaveClass("sr-only");
  });
});
