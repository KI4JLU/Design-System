"use client";

import { Button } from "./button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "./button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "../lib/utils";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import type { UIMessage } from "ai";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactElement, ReactNode } from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary-container group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-on-surface",
      "group-[.is-assistant]:text-on-surface",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

// A name is required (WCAG 4.1.2): `label`, or `tooltip`, which then names the button.
export type MessageActionProps = ComponentProps<typeof Button> &
  ({ tooltip: string; label?: string } | { tooltip?: string; label: string });

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    // Without a distinct label the tooltip text IS the name; describing the
    // button with it again would announce it twice.
    const describes = Boolean(label) && label !== tooltip;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            asChild
            {...(describes ? {} : { "aria-describedby": props["aria-describedby"] })}
          >
            {button}
          </TooltipTrigger>
          {/* Inverse surface, not the DS Tooltip's primary: on a primary user
              bubble a primary tooltip disappears into it (message actions only) */}
          <TooltipContent className="bg-inverse-surface text-inverse-on-surface">
            <p className="m-0">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
  countOnly: boolean;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  /** Controlled current branch index (pair with `onBranchChange`). */
  branch?: number;
  /**
   * The number of branches, for a consumer that renders only the current one
   * (e.g. a server-side message tree). `MessageBranchContent` then shows its
   * children as that branch instead of picking one by index.
   */
  totalBranches?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  branch,
  totalBranches: totalBranchesProp,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [storedBranch, setCurrentBranch] = useControllableState({
    defaultProp: defaultBranch,
    onChange: onBranchChange,
    prop: branch,
  });
  const [branches, setBranches] = useState<ReactElement[]>([]);
  const countOnly = totalBranchesProp !== undefined;
  const totalBranches = totalBranchesProp ?? branches.length;
  // Children that shrank below the current index show their last branch —
  // only once the count is known: before MessageBranchContent registers (SSR,
  // the first client render) the requested branch stands.
  const currentBranch =
    totalBranches > 0 ? Math.min(storedBranch, totalBranches - 1) : storedBranch;

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
    },
    [setCurrentBranch]
  );

  const goToPrevious = useCallback(() => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : totalBranches - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, totalBranches, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch =
      currentBranch < totalBranches - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, totalBranches, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      countOnly,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches,
    }),
    [branches, countOnly, currentBranch, goToNext, goToPrevious, totalBranches]
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  className,
  ...props
}: MessageBranchContentProps) => {
  const { countOnly, currentBranch, setBranches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  // Before paint (so the selector is there on the first frame), and whenever
  // the branch children change, not only their count
  useLayoutEffect(() => {
    setBranches(childrenArray);
  }, [childrenArray, setBranches]);

  // Count-only: the children ARE the current branch — one wrapper for all of them
  if (countOnly) {
    return (
      <div
        className={cn("grid gap-2 overflow-hidden [&>div]:pb-0", "block", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return childrenArray.map((branch, index) => {
    const isCurrent = index === currentBranch;
    // Props (id, handlers, className) go to the shown branch only, not to every wrapper
    return (
      <div
        className={cn(
          "grid gap-2 overflow-hidden [&>div]:pb-0",
          isCurrent ? "block" : "hidden",
          isCurrent && className
        )}
        key={branch.key ?? index}
        {...(isCurrent ? props : {})}
      >
        {branch}
      </div>
    );
  });
};

export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({
  className,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      aria-label="Versionen"
      className={cn(
        // `!`: must beat ButtonGroup's squared inner corners; full = the DS icon Button's radius
        "[&>*:not(:first-child)]:rounded-l-full! [&>*:not(:last-child)]:rounded-r-full!",
        className
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button> & {
  /** The button's name from the version it goes to (1-based) and the total. */
  formatLabel?: (target: number, total: number) => string;
};

export const MessageBranchPrevious = ({
  children,
  formatLabel = (target, total) => `Vorherige Version (${target} von ${total})`,
  ...props
}: MessageBranchPreviousProps) => {
  const { currentBranch, goToPrevious, totalBranches } = useMessageBranch();
  const target = currentBranch > 0 ? currentBranch - 1 : totalBranches - 1;

  return (
    <Button
      aria-label={formatLabel(target + 1, totalBranches)}
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button> & {
  /** The button's name from the version it goes to (1-based) and the total. */
  formatLabel?: (target: number, total: number) => string;
};

export const MessageBranchNext = ({
  children,
  formatLabel = (target, total) => `Nächste Version (${target} von ${total})`,
  ...props
}: MessageBranchNextProps) => {
  const { currentBranch, goToNext, totalBranches } = useMessageBranch();
  const target = currentBranch < totalBranches - 1 ? currentBranch + 1 : 0;

  return (
    <Button
      aria-label={formatLabel(target + 1, totalBranches)}
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement> & {
  /** Replaces the default „N von M" (1-based current branch, total). */
  format?: (current: number, total: number) => ReactNode;
};

const defaultFormatPage = (current: number, total: number) => `${current} von ${total}`;

export const MessageBranchPage = ({
  className,
  format = defaultFormatPage,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      aria-atomic="true"
      aria-live="polite"
      className={cn(
        "whitespace-nowrap border-none bg-transparent text-on-surface-variant shadow-none",
        className
      )}
      {...props}
    >
      {format(currentBranch + 1, totalBranches)}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<"div">;

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <div
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    />
  )
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
