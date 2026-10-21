import * as React from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import {
  aiDisclosureChevronClass,
  aiDisclosureTriggerClass,
  type AiIconComponent,
} from "./ai-disclosure-variants";

/**
 * One task an agent ran ("Suche in den Quellen"), its lines folded under a
 * titled trigger. Port of the AI Elements `Task`
 * (https://registry.ai-sdk.dev/task.json) on a Radix Collapsible and JLU
 * tokens. Open by default (`defaultOpen`); `open`/`onOpenChange` are the
 * Radix Collapsible's own.
 */
export type TaskProps = React.ComponentPropsWithoutRef<typeof Collapsible>;

const Task = React.forwardRef<HTMLDivElement, TaskProps>(({ defaultOpen = true, ...props }, ref) => (
  <Collapsible ref={ref} defaultOpen={defaultOpen} {...props} />
));
Task.displayName = "Task";

/**
 * The button that shows and hides the task's lines: `icon` (default lucide
 * `Search`, decorative), `title`, chevron. `children` replace the whole row
 * inside the button. Unlike AI Elements (a `<div>` slotted into the trigger,
 * so not focusable), this is always a real `<button>` with `aria-expanded`
 * — hence no `asChild`; for a trigger element of your own, use
 * `CollapsibleTrigger asChild` inside the `Task`.
 */
export interface TaskTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CollapsibleTrigger>, "title" | "asChild"> {
  /** The task, as its accessible name too. */
  title: React.ReactNode;
  icon?: AiIconComponent;
}

const TaskTrigger = React.forwardRef<HTMLButtonElement, TaskTriggerProps>(
  ({ className, children, title, icon: Icon = SearchIcon, ...props }, ref) => (
    <CollapsibleTrigger
      ref={ref}
      className={cn(aiDisclosureTriggerClass, className)}
      {...props}
      asChild={false}
    >
      {children ?? (
        <>
          <Icon aria-hidden="true" className="size-4" />
          <span>{title}</span>
          <ChevronDownIcon aria-hidden="true" className={aiDisclosureChevronClass} />
        </>
      )}
    </CollapsibleTrigger>
  ),
);
TaskTrigger.displayName = "TaskTrigger";

/** The folded part: the task's lines, indented behind a rule. */
export type TaskContentProps = React.ComponentPropsWithoutRef<typeof CollapsibleContent>;

const TaskContent = React.forwardRef<HTMLDivElement, TaskContentProps>(
  ({ className, children, ...props }, ref) => (
    <CollapsibleContent
      ref={ref}
      className={cn("text-on-surface outline-none", className)}
      {...props}
    >
      <div className="mt-4 space-y-2 border-l-2 border-outline-variant pl-4">{children}</div>
    </CollapsibleContent>
  ),
);
TaskContent.displayName = "TaskContent";

/** One line of a task, in the muted text colour. */
export type TaskItemProps = React.HTMLAttributes<HTMLDivElement>;

const TaskItem = React.forwardRef<HTMLDivElement, TaskItemProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-on-surface-variant", className)} {...props} />
));
TaskItem.displayName = "TaskItem";

/**
 * A file named inside a task line („Lese <Datei>"): a small inline chip,
 * a `<span>` so it can sit in running text. Pass an icon as a child if wanted.
 * Its radius is the Style's tile radius (6px rounded, a pill in the pill Style).
 */
export type TaskItemFileProps = React.HTMLAttributes<HTMLSpanElement>;

const TaskItemFile = React.forwardRef<HTMLSpanElement, TaskItemFileProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--ui-radius-tile,6px)] border border-outline-variant bg-secondary-container px-1.5 py-0.5 text-xs text-on-secondary-container [&_svg]:size-3 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  ),
);
TaskItemFile.displayName = "TaskItemFile";

export { Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile };
