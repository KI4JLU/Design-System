import { cva } from "class-variance-authority";

/**
 * The composer's (`PromptInput`) frame — the ONE place the frame radius and
 * the radius of everything inside it are decided.
 *
 * A capsule while the composer is a single line; once the text has moved
 * above the control bar or an attachment row sits on top, the corners stay at
 * `rounded-2xl` (24px, half a control row) so they keep following the
 * circular controls inside instead of dropping to the card radius (a full
 * pill on a tall box would read as a capsule, not an input). Controls are
 * circles (`promptInputControlShape`).
 */
export const promptInputFrameVariants = cva(
  [
    "group/prompt-input flex-wrap overflow-hidden bg-surface-container-lowest rounded-full has-[>textarea[data-multiline]]:rounded-2xl has-[>[data-slot=prompt-input-attachments]]:rounded-2xl",
    // The drop zone (PromptInput `data-dragging`): armed — a dashed primary
    // border, as an idle FileDropzone; over — plus the focus ring.
    "data-[dragging]:border-dashed data-[dragging]:border-primary",
    "data-[dragging=over]:ring-2 data-[dragging=over]:ring-focus-ring",
  ],
);

/**
 * Radius of a control inside the composer: a circle. Applied by
 * `InputGroupButton` (hence every PromptInputButton / Submit / ActionMenu
 * trigger) and the attachment chip.
 */
export const promptInputControlShape = "rounded-full";
