import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageViewer } from "./image-viewer";

// jsdom decodes no images: the load event is fired by hand, with the natural
// size defined on the element first.
function load(img: HTMLImageElement, width: number, height: number) {
  Object.defineProperty(img, "naturalWidth", { value: width, configurable: true });
  Object.defineProperty(img, "naturalHeight", { value: height, configurable: true });
  fireEvent.load(img);
}

describe("ImageViewer", () => {
  it("shows the image with its alt text and the toolbar controls", () => {
    render(<ImageViewer src="blob:x" alt="Lageplan" toolbarEnd={<button type="button">Download</button>} />);
    expect(screen.getByRole("img", { hidden: true, name: "Lageplan" })).toHaveAttribute("src", "blob:x");
    expect(screen.getByRole("button", { name: "Vergrößern" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verkleinern" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  // Oracle: a 200×100 image in a viewer with no measured size fits at 100 %
  // (never enlarged); one step in is the next zoom level, 125 %.
  it("starts at fit and steps through the zoom levels", () => {
    render(<ImageViewer src="blob:x" alt="Lageplan" />);
    load(screen.getByRole("img", { hidden: true, name: "Lageplan" }) as HTMLImageElement, 200, 100);
    expect(screen.getByRole("button", { name: /Einpassen \(100%\)/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vergrößern" }));
    expect(screen.getByRole("button", { name: /Einpassen \(125%\)/ })).toBeInTheDocument();
    const img = screen.getByRole("img", { hidden: true, name: "Lageplan" });
    expect(img).toHaveStyle({ width: "250px", height: "125px" });
    fireEvent.click(screen.getByRole("button", { name: /Einpassen/ }));
    expect(screen.getByRole("button", { name: /Einpassen \(100%\)/ })).toBeInTheDocument();
  });

  it("says so when the image cannot be loaded", () => {
    render(<ImageViewer src="blob:x" alt="Lageplan" labels={{ loadError: "Kaputt" }} />);
    fireEvent.error(screen.getByRole("img", { hidden: true, name: "Lageplan" }));
    expect(screen.getByText("Kaputt")).toBeInTheDocument();
  });
});
