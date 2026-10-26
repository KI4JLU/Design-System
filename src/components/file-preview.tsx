import * as React from "react";
import { FileIcon, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { PdfThumbnail } from "./pdf-thumbnail";

export interface FilePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Object/data/http URL of the file. Without one only the glyph + badge show. */
  url?: string;
  /** MIME type, e.g. `image/png`, `application/pdf`. */
  mediaType?: string;
  /** Used for the filetype badge (extension) and the image alt text. */
  filename?: string;
  /** The file is still being fetched: a spinner instead of the glyph. */
  loading?: boolean;
  /**
   * The start of a text file (plain text, Markdown, extracted document text),
   * shown as a miniature page when there is no picture. Long text fades out
   * at the bottom.
   */
  text?: string;
  /** Overrides the filetype badge (default: the extension, else the MIME subtype). */
  badge?: string;
  /**
   * A custom body in place of the glyph — facts about something that is not
   * a file, e.g. a synced feed or repository. Top-aligned; the badge stays.
   */
  children?: React.ReactNode;
}

/**
 * Fixed-size (160×192) preview of a file: the picture, the first PDF page
 * (`PdfThumbnail`), the first lines of a text file (`text`), a custom body
 * (`children`), or a file glyph — with a filetype badge bottom-left.
 * Nothing else, so a long filename never resizes it. Shared by the composer's
 * attachment chips (hover) and the sources list (hover); wrap it in whatever
 * surface fits (HoverCard, Popover, inline).
 */
const FilePreview = React.forwardRef<HTMLDivElement, FilePreviewProps>(
  ({ url, mediaType, filename = "", loading = false, text, badge, children, className, ...props }, ref) => {
    const isImage = Boolean(url) && Boolean(mediaType?.startsWith("image/"));
    const isPdf = Boolean(url) && mediaType === "application/pdf";
    // Filetype badge: the extension when the name has one, else the MIME subtype.
    const extension = filename.includes(".") ? filename.split(".").pop() : undefined;
    const typeLabel = badge ?? (extension || mediaType?.split("/").pop() || "file")
      .replace(/^x-/, "")
      .toUpperCase();

    return (
      <div
        ref={ref}
        data-slot="file-preview"
        className={cn(
          "relative flex h-48 w-40 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest",
          className,
        )}
        {...props}
      >
        {isImage ? (
          <img
            alt={filename}
            className="max-h-full max-w-full object-contain"
            height={192}
            src={url}
            width={160}
          />
        ) : isPdf ? (
          <PdfThumbnail height={192} src={url!} width={160} />
        ) : text ? (
          <div
            data-slot="file-preview-text"
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-3 text-[8px] leading-[1.4] text-on-surface-variant [mask-image:linear-gradient(to_bottom,black_65%,transparent_92%)]"
          >
            {text}
          </div>
        ) : children ? (
          <div data-slot="file-preview-body" className="absolute inset-0 flex flex-col gap-1.5 overflow-hidden p-3 pb-11 text-xs text-on-surface">
            {children}
          </div>
        ) : loading ? (
          <Loader2
            aria-hidden="true"
            className="size-6 animate-spin text-on-surface-variant"
          />
        ) : (
          <FileIcon
            aria-hidden="true"
            className="size-12 text-on-surface-variant"
            strokeWidth={1.25}
          />
        )}
        <Badge
          appearance="filled"
          tone="neutral"
          className="absolute bottom-2 left-2 shadow-card"
        >
          {typeLabel}
        </Badge>
      </div>
    );
  },
);
FilePreview.displayName = "FilePreview";

export { FilePreview };
