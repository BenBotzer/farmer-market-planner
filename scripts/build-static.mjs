import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(projectRoot, "dist");

if (!distDir.startsWith(projectRoot)) {
  throw new Error("Refusing to build outside the project directory.");
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

await cp(resolve(projectRoot, "index.html"), resolve(distDir, "index.html"));
await cp(resolve(projectRoot, "src"), resolve(distDir, "src"), { recursive: true });
await cp(resolve(projectRoot, "README.md"), resolve(distDir, "README.md"));
await writeFile(resolve(distDir, ".nojekyll"), "");

console.log(`Built static site in ${distDir}`);
