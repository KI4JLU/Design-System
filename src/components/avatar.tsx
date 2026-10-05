import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Initials avatar. Formalizes the hand-rolled
 * `rounded-full bg-primary-container flex items-center justify-center`
 * circles (sidebar user, top app bar, conversation lists). The initials are
 * decorative on their own — give the avatar an accessible name via
 * `aria-label` (or `alt`) when it is not accompanied by the user's name as
 * text — the avatar then renders as `role="img"` (a plain span may not carry a
 * label). Include the status in the label when using `online` (e.g. "Jane Doe,
 * online"); without a label, `online` renders an sr-only "online" instead.
 *
 * **Picture.** `src` shows the user's picture in the circle. The initials stay
 * until the picture has loaded and come back when it fails, so a broken URL
 * never leaves an empty circle. The picture is decorative like the initials:
 * the avatar's name is the same with or without it.
 *
 * **Colour.** `color` paints the circle in any CSS colour — meant for
 * `categoryColor(key)` (`var(--color-category-N)`), e.g. one colour per
 * speaker. The initials then switch to `on-secondary-fixed`, a dark ink that
 * is the same in light and dark: the category hues do not change with the
 * theme, so their foreground must not either (≥ 4.7:1 on all nine).
 */
const avatarSizes = {
  /** 28px — the side-panel icon tile's size (SidebarUserMenu). */
  xs: "h-7 w-7 text-[11px]",
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

const dotSizes = {
  xs: "h-2 w-2",
  sm: "h-2 w-2",
  default: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

type ImageState = "loaded" | "error";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 1–2 characters, e.g. "SK". Longer strings are not truncated — keep them short. Also the fallback for `src`. */
  initials: string;
  size?: keyof typeof avatarSizes;
  /** Shows a success-colored presence dot (with an sr-only status text). */
  online?: boolean;
  /** Screen-reader text of the presence dot. Default "online". */
  onlineLabel?: string;
  /** URL of the user's picture. Falls back to `initials` while loading and when it fails. */
  src?: string;
  /**
   * Accessible name of the avatar, e.g. the user's name — the same as
   * `aria-label` (which wins when both are set). Leave both out when the name
   * stands next to the avatar as text.
   */
  alt?: string;
  /**
   * Circle colour, any CSS colour value — meant for `categoryColor(key)`.
   * Default: `primary-container`.
   */
  color?: string;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    {
      className,
      initials,
      size = "default",
      online = false,
      onlineLabel = "online",
      src,
      alt,
      color,
      ...props
    },
    ref,
  ) => {
    // Keyed by URL, so a new `src` starts over as "loading" without an effect.
    const [image, setImage] = React.useState<{ src: string; state: ImageState }>();
    const imageState = src && image?.src === src ? image.state : undefined;
    const showImage = Boolean(src) && imageState !== "error";
    const showInitials = !showImage || imageState !== "loaded";

    const ariaLabel = props["aria-label"] ?? alt;
    const named = Boolean(ariaLabel || props["aria-labelledby"]);

    return (
      <span
        ref={ref}
        role={named ? "img" : undefined}
        className={cn("relative inline-flex shrink-0", className)}
        {...props}
        aria-label={ariaLabel}
      >
        <span
          aria-hidden="true"
          data-slot="avatar-circle"
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full font-semibold uppercase select-none",
            color
              ? "text-on-secondary-fixed"
              : "bg-primary-container text-on-primary-container",
            avatarSizes[size],
          )}
          style={color ? { backgroundColor: color } : undefined}
        >
          {showInitials && initials}
          {showImage && src && (
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={() => setImage({ src, state: "loaded" })}
              onError={() => setImage({ src, state: "error" })}
              className={cn(
                "absolute inset-0 size-full object-cover",
                imageState !== "loaded" && "opacity-0",
              )}
            />
          )}
        </span>
        {online && (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "absolute right-0 bottom-0 block rounded-full bg-success ring-2 ring-surface",
                dotSizes[size],
              )}
            />
            <span className="sr-only">{onlineLabel}</span>
          </>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
