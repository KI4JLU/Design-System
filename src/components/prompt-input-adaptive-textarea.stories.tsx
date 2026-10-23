import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { useState } from "react";
import { ArrowUp, FileText, WandSparkles } from "lucide-react";
import { PromptInputAdaptiveTextarea } from "./prompt-input-adaptive-textarea";
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputButton,
  PromptInputSubmit,
} from "./prompt-input";
import { InputGroupAddon } from "./input-group";

const meta = {
  title: "Components/PromptInputAdaptiveTextarea",
  component: PromptInputAdaptiveTextarea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PromptInputAdaptiveTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The chat composer as JustRAG mounts it: plus menu bottom-left, tools and
 * send bottom-right, both overlaid on the frame; the textarea keeps one line
 * between them and moves above them once it wraps.
 */
function Composer({
  voice,
  placeholder = "Stelle eine Frage…",
  className = "mx-auto max-w-3xl",
}: {
  voice?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [recording, setRecording] = useState(false);
  return (
    <div className={className}>
      <PromptInput id="composer" onSubmit={() => setValue("")}>
        <InputGroupAddon align="inline-start" className="absolute bottom-1 left-3 p-0">
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger className="size-10" aria-label="Anhängen" />
            <PromptInputActionMenuContent align="start">
              <PromptInputActionMenuItem>Fotos oder Dateien hinzufügen</PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </InputGroupAddon>
        <PromptInputAdaptiveTextarea
          aria-label="Nachricht"
          className="px-4 text-base leading-normal"
          placeholder={placeholder}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inlineLeft={72}
          inlineRight={172}
          laneHeight={48}
          maxHeight={240}
        />
        <InputGroupAddon align="inline-end" className="absolute right-3 bottom-1 gap-1 p-0">
          <PromptInputButton aria-label="Entwurf verbessern">
            <WandSparkles aria-hidden="true" />
          </PromptInputButton>
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2 text-sm text-on-surface-variant">
            <FileText size={16} aria-hidden="true" />
            <span>33</span>
          </span>
          <PromptInputSubmit
            className="size-10"
            aria-label="Senden"
            disabled={!value.trim()}
            idle={!value.trim()}
            voice={voice ? { label: "Spracheingabe", active: recording, onActivate: () => setRecording((r) => !r) } : undefined}
          >
            <ArrowUp aria-hidden="true" />
          </PromptInputSubmit>
        </InputGroupAddon>
      </PromptInput>
      <p className="mt-4 text-sm text-on-surface-variant">{value.length} Zeichen</p>
    </div>
  );
}

export const ChatComposer: Story = {
  args: { value: "", onValueChange: undefined } as never,
  render: () => <Composer />,
};

/** With a speech-to-text provider wired: the idle send button becomes the
 *  voice trigger and turns back into the arrow as soon as there is a draft. */
export const VoiceIdle: Story = {
  args: { value: "", onValueChange: undefined } as never,
  render: () => <Composer voice />,
};

/** A placeholder longer than the gap between the controls (a long topic name,
 *  a narrow column): the empty field stays one line and the placeholder ends
 *  in an ellipsis — the control bar opens only once there is text that wraps. */
export const LongPlaceholder: Story = {
  args: { value: "", onValueChange: undefined } as never,
  render: () => (
    <Composer
      className="max-w-[420px]"
      placeholder="Stelle eine Frage zu Fachbereiche, Zentren und Einrichtungen…"
    />
  ),
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Nachricht" }) as HTMLTextAreaElement;
    const frame = field.closest("[data-slot=input-group]") as HTMLElement;
    // Never a horizontal scrollbar, in either mode: text wraps (unbroken runs
    // included) and the x axis does not scroll. Classic scrollbars (Safari
    // with a mouse) would otherwise draw a bar under the text.
    const noHorizontalScroll = async () => {
      const style = getComputedStyle(field);
      await expect(style.overflowX).toBe("hidden");
      await expect(style.overflowWrap).toBe("anywhere");
      await expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth);
      // The field must not widen past its frame either.
      await expect(field.getBoundingClientRect().width).toBeLessThanOrEqual(frame.clientWidth);
    };

    await expect(field).not.toHaveAttribute("data-multiline");
    await expect(getComputedStyle(field, "::placeholder").whiteSpace).toBe("nowrap");
    await noHorizontalScroll();

    await userEvent.type(field, "Welche Fachbereiche gibt es an der Universität insgesamt?");
    await expect(field).toHaveAttribute("data-multiline");
    await noHorizontalScroll();

    await userEvent.clear(field);
    await userEvent.type(
      field,
      "https://www.uni-giessen.de/de/fbz/zentren/hrz/dienste/kommunikation-und-kollaboration/ki-dienste/justrag",
    );
    await expect(field).toHaveAttribute("data-multiline");
    await noHorizontalScroll();

    await userEvent.clear(field);
    await expect(field).not.toHaveAttribute("data-multiline");
    await noHorizontalScroll();
  },
};
