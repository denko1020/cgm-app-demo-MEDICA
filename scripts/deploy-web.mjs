// Build the web bundle and publish dist/ to the gh-pages branch.
// Usage: npm run deploy:web   (works on macOS and Windows)
import { execSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";

const run = (cmd) =>
  execSync(cmd, { stdio: "inherit", env: { ...process.env, CI: "1", EXPO_NO_TELEMETRY: "1" } });

run("npx expo export --platform web");
copyFileSync("dist/index.html", "dist/404.html"); // SPA fallback for deep links on GitHub Pages
writeFileSync("dist/.nojekyll", "");               // keep the _expo/ folder from being ignored by Jekyll
run('npx gh-pages -d dist --dotfiles -m "deploy web"');
