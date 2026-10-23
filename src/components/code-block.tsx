import * as React from "react";
import { Check, Copy, Minus, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

/**
 * Code/terminal viewer: a header row — the language on the left, the actions
 * on the right (an app's own `actions`, copy, and with `collapsible` a
 * fold toggle) — a hairline, then the code. Deliberately fixed-dark: the
 * `code-surface` tokens do NOT switch in dark mode (see tokens.css), so the
 * block looks identical in both themes — like an editor window.
 * Formalizes the former CampusAgents call-site exception (embed snippets).
 * The copy button writes `code` to the clipboard and confirms by swapping its
 * icon and name (Copy → Check) for ~2 s. No syntax highlighting: the code is
 * shown as written.
 */
export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The raw code to display and copy. */
  code: string;
  /** Shown in the header, e.g. `python`. */
  language?: string;
  /** Extra header actions before the copy button, e.g. an app's „Code ausführen". */
  actions?: React.ReactNode;
  /** Adds a fold toggle that hides the code below the header. */
  collapsible?: boolean;
  /** Start folded (with `collapsible`). */
  defaultCollapsed?: boolean;
  /** Copy-button name in idle state. */
  copyLabel?: string;
  /** Copy-button name shown briefly after a successful copy. */
  copiedLabel?: string;
  /** Fold-toggle name while the code shows. */
  collapseLabel?: string;
  /** Fold-toggle name while the code is folded. */
  expandLabel?: string;
}

/** A header action: a small bordered square on the code surface. */
const actionClass =
  "size-7 rounded-md border border-on-code-surface/15 bg-on-code-surface/5 p-0 text-on-code-surface/80 hover:bg-on-code-surface/10 hover:text-on-code-surface [&_svg]:size-3.5";

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  (
    {
      code,
      language,
      actions,
      collapsible = false,
      defaultCollapsed = false,
      copyLabel = "Code kopieren",
      copiedLabel = "Kopiert",
      collapseLabel = "Code einklappen",
      expandLabel = "Code ausklappen",
      className,
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = React.useState(false);
    const [collapsed, setCollapsed] = React.useState(collapsible && defaultCollapsed);
    const timeoutRef = React.useRef<number | undefined>(undefined);
    const bodyId = React.useId();

    // Clear a pending label reset when unmounting mid-confirmation.
    React.useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        ref={ref}
        data-slot="code-block"
        className={cn("overflow-hidden rounded-lg bg-code-surface text-on-code-surface", className)}
        {...props}
      >
        <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2">
          <span className="min-w-0 truncate text-sm font-semibold text-on-code-surface/60">{language}</span>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label={copied ? copiedLabel : copyLabel}
              title={copied ? copiedLabel : copyLabel}
              className={actionClass}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            </Button>
            {collapsible && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? expandLabel : collapseLabel}
                title={collapsed ? expandLabel : collapseLabel}
                aria-expanded={!collapsed}
                aria-controls={bodyId}
                className={actionClass}
              >
                {collapsed ? <Plus aria-hidden /> : <Minus aria-hidden />}
              </Button>
            )}
          </div>
        </div>
        {/* `m-0`: `<pre>` carries a non-zero user-agent margin (1em,
            measured in Chromium), and a consuming app that reverts element
            margins in `@layer base` would otherwise move it. The hairline is
            its own inset element for the same reason. */}
        <div id={bodyId} hidden={collapsible && collapsed}>
          <div aria-hidden="true" className="mx-4 border-t border-on-code-surface/10" />
          <pre className="m-0 overflow-x-auto px-4 py-3 font-mono text-sm whitespace-pre-wrap break-words">
            {code}
          </pre>
        </div>
      </div>
    );
  },
);
CodeBlock.displayName = "CodeBlock";

export { CodeBlock };
