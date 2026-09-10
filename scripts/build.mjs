import { execFileSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
execFileSync("python3", ["scripts/check_html.py"], { stdio: "inherit" });
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("web", "dist", { recursive: true });
console.log("Built static lookout → dist/");
