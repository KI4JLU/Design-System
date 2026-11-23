// `npm test`. Without arguments: the unit project, then the story project, one
// after the other — run together, the unit workers took the CPU and the slowest
// stories ran into their timeout. With arguments (`npm test -- src/x.test.tsx`,
// `-t name`, `--project unit`): one `vitest run` with exactly those, so a filter
// reaches vitest the way it did before.
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

function vitest(extra) {
  const result = spawnSync("vitest", ["run", ...extra], { stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (args.length > 0) process.exit(vitest(args));
const unit = vitest(["--project", "unit"]);
process.exit(unit !== 0 ? unit : vitest(["--project", "storybook"]));
