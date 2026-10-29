import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "../lib/utils";

export interface FileDropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrop" | "title"> {
  /** The dropped files (never empty). */
  onFiles: (files: File[]) => void;
  /** Main line ("Dateien hier ablegen"). */
  title: React.ReactNode;
  /** Second line (accepted types). */
  hint?: React.ReactNode;
  /** Default: an upload cloud. */
  icon?: React.ReactNode;
  /**
   * Makes the zone a button that opens a file picker (click, Enter, Space) —
   * the keyboard path for a dropzone that stays on screen.
   */
  onBrowse?: () => void;
  /**
   * `surface` (default): the card surface, so an empty panel's dropzone
   * stands out. `translucent`: a see-through fill that lets a coloured
   * background (a page glow) show through, tinted with the accent colour on
   * hover and while files hover over it.
   */
  variant?: "surface" | "translucent";
}

/**
 * A drop target for files: dashed frame, icon, title and hint, highlighted
 * while files hover over it. Dropping is pointer-only — pass `onBrowse` (or
 * keep an upload button beside it) for the keyboard path. Pair with `useWindowFileDrag` to show it
 * only while files are being dragged. Radius follows the Style
 * (`--ui-radius-box`).
 */
const FileDropzone = React.forwardRef<HTMLDivElement, FileDropzoneProps>(
  ({ onFiles, title, hint, icon, onBrowse, variant = "surface", className, ...props }, ref) => {
    const [over, setOver] = React.useState(false);
    const depth = React.useRef(0);
    return (
      <div
        ref={ref}
        data-slot="file-dropzone"
        data-over={over || undefined}
        data-variant={variant}
        {...(onBrowse && {
          role: "button",
          tabIndex: 0,
          onClick: onBrowse,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onBrowse();
            }
          },
        })}
        className={cn(
          // Resting state: the card surface (white in light mode) with the highlight
          // border, so an empty panel's dropzone stands out; hovering files tint it.
          "flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary p-6 text-center text-on-surface-variant transition-colors",
          "rounded-[var(--ui-radius-box,var(--radius-xl))]",
          variant === "translucent"
            ? "bg-surface-container-lowest/40 hover:bg-primary/10 data-[over]:bg-primary/15 data-[over]:text-primary"
            : "bg-surface-container-lowest data-[over]:bg-primary/10 data-[over]:text-primary",
          onBrowse &&
            "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          onBrowse && variant === "surface" && "hover:bg-primary/5",
          className,
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current += 1;
          setOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setOver(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) onFiles(files);
        }}
        {...props}
      >
        <span aria-hidden="true" className="flex text-primary [&>svg]:size-8">
          {icon ?? <UploadCloud />}
        </span>
        <p className="m-0 text-sm font-medium text-on-surface">{title}</p>
        {hint != null && <p className="m-0 text-xs">{hint}</p>}
      </div>
    );
  },
);
FileDropzone.displayName = "FileDropzone";

export { FileDropzone };
