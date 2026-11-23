// `npm test`. Without arguments: the unit project, then the story project, one
// after the other — run together, the unit workers took the CPU and the slowest
// stories ran into their timeout. With arguments (`npm test -- src/x.test.tsx`,
// `-t name`, `--project unit`): one `vitest run` with exactly those, so a filter
// reaches vitest the way it did before.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);

// Vitest's own entry, run by this Node without a shell: on Windows a shell
// would split a quoted filter (`-t "two words"`) again before Vitest saw it.
const require = createRequire(import.meta.url);
const vitestPackage = require.resolve("vitest/package.json");
const vitestBin = join(dirname(vitestPackage), require(vitestPackage).bin.vitest);

function vitest(extra) {
  const result = spawnSync(process.execPath, [vitestBin, "run", ...extra], { stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (args.length > 0) process.exit(vitest(args));
const unit = vitest(["--project", "unit"]);
process.exit(unit !== 0 ? unit : vitest(["--project", "storybook"]));
