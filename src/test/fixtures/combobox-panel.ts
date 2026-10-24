import { expect, within } from "storybook/test";

/*
 * Shared by the `Combobox` and `TokenInput` stories: probes that resolve
 * tokens in the browser, and the joined-panel geometry both components draw.
 * Oracle, as in those stories: the DOM as the browser and assistive
 * technology see it and token values resolved by the browser on a probe
 * element — never the components' class strings or state.
 */

export const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** The option `aria-activedescendant` points at, resolved through the DOM. */
export const activeOption = (input: HTMLElement) => {
  const id = input.getAttribute("aria-activedescendant");
  return id ? input.ownerDocument.getElementById(id) : null;
};

/* ------------------------------------------------------------------------ */
/* Probes and the joined-panel geometry, shared by every story              */
/* ------------------------------------------------------------------------ */

/** `color` of a probe painted with `value` — the token, resolved by the browser. */
export const resolvedColor = (host: HTMLElement, value: string) => {
  const probe = host.ownerDocument.createElement("span");
  probe.style.color = value;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

/** `background` / `box-shadow` of a probe styled with `value` — the token, resolved by the browser. */
export const resolvedStyle = (host: HTMLElement, property: "backgroundColor" | "boxShadow", value: string) => {
  const probe = host.ownerDocument.createElement("div");
  probe.style[property] = value;
  host.ownerDocument.body.append(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
};

/**
 * The layers of a computed `box-shadow` that paint anything: a layer is
 * invisible when its colour is fully transparent or all four lengths are 0
 * (Tailwind's empty `0 0 #0000` ring/shadow slots).
 */
export const visibleShadowLayers = (boxShadow: string) =>
  [
    ...boxShadow.matchAll(
      /((?:rgba?|oklch|oklab|color)\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/g,
    ),
  ]
    .filter(([, color, ...lengths]) => {
      const transparent = /^rgba\(.*,\s*0\)$/.test(color);
      return !transparent && lengths.some((n) => parseFloat(n) !== 0);
    })
    .map(([layer]) => layer);

export const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** 1rem in px, as the browser resolves it. */
export const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

/** `tokens.css`: `--spacing-gutter: 24px`. */
export const GUTTER = 24;

/** An element's content box (inside border and padding), from its box and computed style. */
export const contentBox = (el: HTMLElement) => {
  const box = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const left = box.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
  const right = box.right - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
  return { left, right, width: right - left };
};

export const centre = (box: { left: number; right: number }) => (box.left + box.right) / 2;

/**
 * The open field's stated width: the requested palette width, capped by the
 * nearest container's content width and by the viewport minus both gutters —
 * never narrower than the closed field.
 */
export const grownWidth = (requestedPx: number, containerWidth: number, closedWidth: number) =>
  Math.max(closedWidth, Math.min(requestedPx, containerWidth, window.innerWidth - 2 * GUTTER));

/** Waits for running CSS transitions on `el` (the field animates its border and radius back on close). */
export const settled = async (el: Element) => {
  await Promise.all(el.getAnimations().map((animation) => animation.finished));
};

export const corners = (style: CSSStyleDeclaration) => [
  style.borderTopLeftRadius,
  style.borderTopRightRadius,
  style.borderBottomRightRadius,
  style.borderBottomLeftRadius,
];

/**
 * A field's frame as the browser draws it: box, the four radii, border
 * colour and width, background, shadow (incl. the focus ring) and padding.
 */
export const fieldLook = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return {
    height: box.height,
    width: box.width,
    radius: corners(style),
    borderColor: [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor],
    borderWidth: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
    background: style.backgroundColor,
    boxShadow: style.boxShadow,
    padding: style.padding,
  };
};

/** The portalled panel element that holds `listbox`. */
export const panelOf = (listbox: HTMLElement) => {
  const panel = listbox.closest<HTMLElement>('[data-slot="combobox-content"]');
  if (!panel) throw new Error("panel missing");
  return panel;
};

/**
 * The joined geometry, read from the open panel: one portalled `z-50`
 * element whose box starts on the field's top edge, exactly the field's
 * width; the field has no border, ring or shadow of its own, square bottom
 * corners and the panel's top radius; one divider on the field's bottom
 * border row; one outer radius; one shadow (`--shadow-overlay`) plus the
 * focus halo — the resting `outline-variant` border plus a `primary/10` ring
 * `--field-focus-halo` wide (0px, i.e. none, at contrast `normal`), or the
 * `error` border and an `error/10` ring with `aria-invalid`; and the field under the panel's top still gets the
 * pointer.
 */
export async function expectJoinedPanel(
  canvasElement: HTMLElement,
  field: HTMLElement,
  listbox: HTMLElement,
  {
    radius,
    frame = field,
    invalid = false,
  }: { radius: string; frame?: HTMLElement; invalid?: boolean },
) {
  const panel = panelOf(listbox);
  const body = panel.querySelector<HTMLElement>('[data-slot="combobox-panel-body"]');
  if (!body) throw new Error("panel body missing");

  // Portalled and on top.
  await expect(canvasElement.contains(panel)).toBe(false);
  await expect(getComputedStyle(panel).zIndex).toBe("50");

  // One box: the panel starts on the field's top edge, exactly as wide.
  const fieldBox = frame.getBoundingClientRect();
  const panelBox = panel.getBoundingClientRect();
  await expect(Math.abs(panelBox.top - fieldBox.top)).toBeLessThan(0.5);
  await expect(Math.abs(panelBox.left - fieldBox.left)).toBeLessThan(0.5);
  await expect(Math.abs(panelBox.width - fieldBox.width)).toBeLessThan(0.5);
  await expect(panelBox.bottom).toBeGreaterThan(fieldBox.bottom);
  // No gap: the divider (the list's 1px top border) is the field's bottom
  // border row — its last pixel row — and the list starts right under it.
  const bodyBox = body.getBoundingClientRect();
  await expect(Math.abs(bodyBox.top + 1 - fieldBox.bottom)).toBeLessThan(0.5);
  const bodyStyle = getComputedStyle(body);
  await expect(bodyStyle.borderTopWidth).toBe("1px");
  await expect(bodyStyle.borderTopColor).toBe(resolvedColor(canvasElement, "var(--color-outline-variant)"));
  await expect(bodyStyle.backgroundColor).toBe(
    resolvedStyle(canvasElement, "backgroundColor", "var(--color-surface-container-lowest)"),
  );

  // One border: the panel's, in the focused field's colour; the field's own is gone.
  const border = resolvedColor(canvasElement, invalid ? "var(--color-error)" : "var(--color-outline-variant)");
  const panelStyle = getComputedStyle(panel);
  const frameStyle = getComputedStyle(frame);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    await expect(panelStyle[`border${side}Width`]).toBe("1px");
    await expect(panelStyle[`border${side}Color`]).toBe(border);
    await expect(frameStyle[`border${side}Color`]).toBe(TRANSPARENT);
  }

  // One outer radius on the panel; the field's top corners follow it, its bottom ones are square.
  await expect(corners(panelStyle)).toEqual([radius, radius, radius, radius]);
  await expect(corners(frameStyle)).toEqual([radius, radius, "0px", "0px"]);

  // One shadow: the overlay elevation and the focus ring on the panel, nothing on the field.
  await expect(visibleShadowLayers(frameStyle.boxShadow)).toEqual([]);
  const panelLayers = visibleShadowLayers(panelStyle.boxShadow);
  for (const layer of visibleShadowLayers(
    resolvedStyle(canvasElement, "boxShadow", "var(--shadow-overlay)"),
  )) {
    await expect(panelLayers).toContain(layer);
  }
  const ring = resolvedColor(
    canvasElement,
    `color-mix(in oklab, ${invalid ? "var(--color-error)" : "var(--color-primary)"} 10%, transparent)`,
  );
  const halo = getComputedStyle(panel).getPropertyValue("--field-focus-halo").trim();
  await expect(panelLayers.some((layer) => layer.startsWith(ring))).toBe(halo !== "0px");
  if (halo !== "0px") {
    await expect(panelLayers.some((layer) => layer.startsWith(ring) && layer.endsWith(`0px 0px 0px ${halo}`))).toBe(true);
  }

  // The panel's top is a window: the pointer reaches the field, and the options.
  const hit = document.elementFromPoint(fieldBox.left + fieldBox.width / 2, fieldBox.top + fieldBox.height / 2);
  await expect(frame.contains(hit)).toBe(true);
  const firstOption = within(listbox).getAllByRole("option")[0].getBoundingClientRect();
  const optionHit = document.elementFromPoint(
    firstOption.left + firstOption.width / 2,
    firstOption.top + firstOption.height / 2,
  );
  await expect(within(listbox).getAllByRole("option")[0].contains(optionHit)).toBe(true);

  // Radix's role="dialog" stays removed.
  await expect(within(canvasElement.ownerDocument.body).queryByRole("dialog")).toBeNull();
}
