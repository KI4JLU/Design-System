# JLU Design System

Shared design tokens, theming and React UI components for JLU projects.
Goal: **one** consistent look and feel, consumed as a dependency
(`@ki4jlu/design-system`) instead of copied into each project.

- **Tokens** (`tokens.css`): two layers — primitives (`--p-*`) → semantic
  tokens (`--color-primary`, `--color-surface-container-*`, status,
  interaction, elevation, typography/spacing/radius tokens), light + dark.
- **Components**: Button, Card, Input, Label, Dialog, form field primitives,
  SettingsDialog — based on shadcn/ui (Radix + Tailwind 4), styled only
  through semantic tokens.
- **Theming**: `ThemeProvider` (light / dark / system, `data-theme` on
  `<html>`), `useTheme`, `AppearanceSettings`.
- **Enforcement**: ESLint plugin (`no-hardcoded-colors`, `no-raw-ui-elements`).

Documentation & examples: **Storybook** — `npm run storybook`
(component reference with props tables, token cheat sheet, theming guide).
Governance & contribution process: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md),
usage rules: [docs/COMPONENT_GUIDELINES.md](docs/COMPONENT_GUIDELINES.md).

## Installing in a project

### Recommended: straight from git (no token)

The repo is public, so this way needs **no registry and no token** — not
locally, not in CI, not in the Docker build:

```bash
npm install github:KI4JLU/Design-System#<tag>   # e.g. the latest release tag
```

Always pin to a **tag**, not to `main`. On install the `prepare` script builds
`dist/` (including `tokens.css`); for that npm briefly fetches the
devDependencies but doesn't run their install scripts — so neither Storybook
nor a Playwright browser ends up in the consumer's tree.

The only requirement: `git` must be available in the build environment (in
slim Docker images, install it if needed).

### Alternative: GitHub Packages registry

`npm.pkg.github.com` requires a token — **even for public packages**; that is a
limitation of GitHub Packages' npm registry. Add an `.npmrc` to the project
once:

```ini
@ki4jlu:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

A token with the `read:packages` scope, locally for example:

```bash
gh auth refresh -h github.com -s read:packages
export NODE_AUTH_TOKEN=$(gh auth token)
npm install @ki4jlu/design-system
```

(In GitHub Actions the built-in `GITHUB_TOKEN` is enough.)

## Setup (Tailwind 4 app)

Main CSS file:

```css
@import "tailwindcss";
@import "@ki4jlu/design-system/tokens.css";
@source "../node_modules/@ki4jlu/design-system";
```

App root + `index.html`:

- Mount `<ThemeProvider>` around the app.
- Copy the no-flash script into the `<head>` (see Storybook "Theming").
- The app loads the fonts itself: **Inter, Manrope**. Monospace (`font-mono`) only for code, from the system fonts — no web font.

```tsx
import { ThemeProvider, Button, Card } from "@ki4jlu/design-system";
```

### PDF components: the pdf.js worker

`PdfViewer`, `PdfThumbnail`, `FilePreview` and `renderPdfFirstPage` use pdf.js.
`pdfjs-dist` is a **peer dependency**: install it next to the design system, and
hand the design system its worker URL once at app start:

```bash
npm install pdfjs-dist@^6.3.289
```

```ts
// e.g. src/main.tsx
import { setPdfWorkerSrc } from "@ki4jlu/design-system";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

setPdfWorkerSrc(pdfWorkerUrl);
```

Your app's Vite build emits the worker as a same-origin `/assets` file, so a CSP
with `script-src 'self'` allows it — no `blob:` or `data:` needed. The `?url`
import is only a string, so pdf.js itself still loads lazily on the first PDF.
Without this setup PDFs do not render (`PdfViewer` shows its load error,
thumbnails stay blank) and the console names the missing call. With linked
workspaces or duplicate installs, keep a single copy via Vite's
`resolve.dedupe: ["pdfjs-dist"]`.

## Development

```bash
npm install
npm run storybook        # workbench + docs (port 6006)
npm test                 # unit tests (jsdom), then story tests (Chromium) — one after the other
npm test -- <file|-t …>  # one vitest run with just that filter
npm run lint             # including the dogfooded design-system rules
npm run build            # dist/: ESM + d.ts + tokens.css
```

> **Note (npm bug):** `@emnapi/*` is in the devDependencies on purpose.
> Otherwise npm on macOS drops these Linux/WASI-only optional deps from the
> lockfile on every incremental `npm install`, after which `npm ci` fails in CI
> (npm/cli#4828). Don't remove them.

## Release

Bump the version in `package.json` (semver), update the changelog in
`docs/DESIGN_SYSTEM.md`, then push the tag — GitHub Actions publishes to
GitHub Packages:

```bash
npm version 0.2.0
git push --follow-tags
```
