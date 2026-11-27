import * as React from "react";
import { cn } from "./utils";

/**
 * When a message was raised: `14:32` today, `25.11., 14:32` on another day;
 * `full` always with the year.
 */
function formatCreatedTime(at: Date, lang: string, full = false, now = new Date()) {
  const sameDay = at.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(lang, {
    ...(full
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : sameDay
        ? {}
        : { day: "2-digit", month: "2-digit" }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
}

// `<html lang>`, followed: the app switches language by setting it.
function subscribeLang(changed: () => void) {
  const observer = new MutationObserver(changed);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}
const currentLang = () => document.documentElement.lang || "de";
// Null on the server and while hydrating: the text depends on the browser's
// language and time zone, so it is left out until then and hydration matches.
const noLang = () => null;

/**
 * A message's creation time, for the end of its title row (toasts, `Alert`).
 * Formatted for `<html lang>` (German without one), and again when it
 * changes.
 *
 * **Visible:** `14:32` today, `25.11., 14:32` once it is from another day —
 * it renders again at midnight. **Read out:** the full date and time, which
 * never changes, so the midnight switch does not make a live region (an
 * `Alert` with `live`, the toaster) announce the message again.
 *
 * Renders nothing for an invalid `Date`.
 */
export function CreatedTime({ at, className }: { at: Date; className?: string }) {
  const lang = React.useSyncExternalStore(subscribeLang, currentLang, noLang);
  const [, dayChanged] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timer = setTimeout(dayChanged, midnight.getTime() - Date.now() + 1);
    return () => clearTimeout(timer);
  });
  if (Number.isNaN(at.getTime())) return null;
  return (
    <time
      dateTime={at.toISOString()}
      className={cn("shrink-0 text-xs font-normal tabular-nums", className)}
    >
      {lang ? (
        <>
          <span aria-hidden="true" data-slot="created-time-label">
            {formatCreatedTime(at, lang)}
          </span>
          <span className="sr-only">{formatCreatedTime(at, lang, true)}</span>
        </>
      ) : null}
    </time>
  );
}
