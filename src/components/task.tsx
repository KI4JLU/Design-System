"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { cn } from "../lib/utils";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 rounded-action border border-outline-variant bg-secondary-container px-1.5 py-0.5 text-on-surface text-xs",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<"div">;

export const TaskItem = ({ children, className, ...props }: TaskItemProps) => (
  <div className={cn("text-on-surface-variant text-sm", className)} {...props}>
    {children}
  </div>
);

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}: TaskProps) => (
  <Collapsible className={cn(className)} defaultOpen={defaultOpen} {...props} />
);

// No asChild: the trigger always slots its child (the default button or yours);
// asChild={false} would nest the default button inside a second one.
export type TaskTriggerProps = Omit<
  ComponentProps<typeof CollapsibleTrigger>,
  "asChild"
> & {
  title: string;
};

export const TaskTrigger = ({
  children,
  className,
  title,
  ...props
}: TaskTriggerProps) => (
  <CollapsibleTrigger className={cn("group", className)} {...props} asChild>
    {children ?? (
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 text-on-surface-variant text-sm transition-colors hover:text-on-surface rounded-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <SearchIcon className="size-4" />
        <span className="text-sm">{title}</span>
        <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </button>
    )}
  </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({
  children,
  className,
  ...props
}: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-on-surface outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  >
    <div className="mt-4 space-y-2 border-surface-container border-l-2 pl-4">
      {children}
    </div>
  </CollapsibleContent>
);
