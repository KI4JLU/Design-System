import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

/*
 * Setup of the `storybook` test project (vite.config.ts).
 *
 * Every story starts with the real pointer off the page. Stories that check a
 * CSS `:hover` state move Playwright's real mouse (`realHover`,
 * src/test/fixtures/real-pointer.ts), and nothing moves it back: the next
 * story rendered at the same spot started hovered — `SidebarCard → Menu Over
 * Title` saw its at-rest fade already applied when it ran after one of them.
 */

declare module "vitest/browser" {
  interface BrowserCommands {
    parkPointer: () => Promise<void>;
  }
}

beforeEach(async () => {
  await commands.parkPointer();
});
