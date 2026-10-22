import { execFileSync } from "node:child_process";
for (let offset = 0; offset < 1500; offset += 100) {
  const result = execFileSync(
    "./node_modules/.bin/convex",
    ["run", "seed:profiles", JSON.stringify({ offset })],
    { encoding: "utf8" },
  );
  process.stdout.write(result);
}
