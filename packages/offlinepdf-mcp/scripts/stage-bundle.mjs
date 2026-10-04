// Builds a self-contained staging directory for `mcpb pack`.
//
// This package lives in an npm workspace: its runtime dependencies are hoisted to the
// repo root's node_modules, and `offlinepdf-sdk` is a workspace symlink, not a published
// package. Neither exists inside this package's own folder, so packing this folder
// directly produces a .mcpb whose dist/index.js can't resolve any of its imports once
// extracted into Claude Desktop's extensions directory (there's no repo root above it
// to hoist from). This script assembles a standalone copy that has everything it needs
// physically alongside dist/index.js, the way the installed extension actually runs.
import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const pkgRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stageDir = path.join(pkgRoot, ".mcpb-stage");
const sdkRoot = path.join(pkgRoot, "../offlinepdf-sdk");

const pkg = JSON.parse(await readFile(path.join(pkgRoot, "package.json"), "utf8"));

console.log("Staging self-contained bundle at", stageDir);
await rm(stageDir, { recursive: true, force: true });
await mkdir(stageDir, { recursive: true });

// 1. Built output + packaging metadata
await cp(path.join(pkgRoot, "dist"), path.join(stageDir, "dist"), { recursive: true });
await cp(path.join(pkgRoot, "manifest.json"), path.join(stageDir, "manifest.json"));
await cp(path.join(pkgRoot, "LICENSE"), path.join(stageDir, "LICENSE"));
await cp(path.join(pkgRoot, "README.md"), path.join(stageDir, "README.md"));

// 2. A minimal package.json with only the production dependencies that are real,
// registry-resolvable packages (offlinepdf-sdk is handled separately below, since it's
// a workspace package with no published version to install). offlinepdf-sdk's own
// runtime dependencies (e.g. fflate) are merged in here too — npm never sees
// offlinepdf-sdk itself (it's copied in after install, not installed), so without this
// its transitive deps would silently go missing from the staged node_modules.
const sdkPkg = JSON.parse(await readFile(path.join(sdkRoot, "package.json"), "utf8"));
const { ["offlinepdf-sdk"]: _workspaceDep, ...registryDeps } = pkg.dependencies;
void _workspaceDep;
const allDeps = { ...registryDeps, ...(sdkPkg.dependencies ?? {}) };
await writeFile(
  path.join(stageDir, "package.json"),
  JSON.stringify({ name: pkg.name, version: pkg.version, type: "module", private: true, dependencies: allDeps }, null, 2)
);

// 3. Install the real production dependencies fresh from the registry into the stage's
// own node_modules (not hoisted, not symlinked — physically present).
console.log("Installing production dependencies into stage...");
execFileSync("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], { cwd: stageDir, stdio: "inherit", shell: true });

// 4. offlinepdf-sdk isn't published, so copy its already-built dist + package.json
// directly into the stage's node_modules rather than trying to npm-install it.
const sdkStageDir = path.join(stageDir, "node_modules", "offlinepdf-sdk");
await mkdir(sdkStageDir, { recursive: true });
await cp(path.join(sdkRoot, "dist"), path.join(sdkStageDir, "dist"), { recursive: true });
await writeFile(
  path.join(sdkStageDir, "package.json"),
  JSON.stringify({ name: sdkPkg.name, version: sdkPkg.version, main: sdkPkg.main, module: sdkPkg.module, types: sdkPkg.types }, null, 2)
);

console.log("Stage ready:", stageDir);
