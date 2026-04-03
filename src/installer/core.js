import fs from "node:fs";
import path from "node:path";
import {
  getRepoRoot,
  resolveBackupPath,
  resolveDefaultTarget,
  resolveTargetPath,
  resolveTemplatePath,
} from "./paths.js";

const MANAGED_MARKER = "<!-- moses-agent:managed -->";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function isManagedContent(content) {
  return content.includes(MANAGED_MARKER);
}

function isDefaultTarget(targetPath) {
  return targetPath === resolveDefaultTarget();
}

export function printHelp() {
  console.log(`moses-agent

Usage:
  moses-agent help
  moses-agent validate [--target <path>]
  moses-agent install [--target <path>] [--force]
  moses-agent uninstall [--target <path>] [--force]

Defaults:
  target: ~/.config/opencode/agents/moses.md

Safety:
  --force is required for non-default targets and for removing or replacing
  files not previously installed by moses-agent.
`);
}

export function validateInstall(options = {}) {
  const templatePath = resolveTemplatePath();
  const targetPath = resolveTargetPath(options.target);
  const targetDir = path.dirname(targetPath);
  const templateExists = fs.existsSync(templatePath);
  const targetExists = fs.existsSync(targetPath);
  const templateContent = templateExists ? readText(templatePath) : null;
  const targetContent = targetExists ? readText(targetPath) : null;

  return {
    ok: templateExists,
    repoRoot: getRepoRoot(),
    templatePath,
    templateExists,
    templateHasManagedMarker: Boolean(templateContent && isManagedContent(templateContent)),
    targetPath,
    targetDir,
    targetDirExists: fs.existsSync(targetDir),
    targetExists,
    targetIsDefault: isDefaultTarget(targetPath),
    targetLooksManaged: Boolean(targetContent && isManagedContent(targetContent)),
    forceRequiredForInstall: !isDefaultTarget(targetPath) || Boolean(targetContent && !isManagedContent(targetContent)),
    forceRequiredForUninstall: !isDefaultTarget(targetPath) || Boolean(targetContent && !isManagedContent(targetContent)),
  };
}

export function installAgent(options = {}) {
  const templatePath = resolveTemplatePath();
  const targetPath = resolveTargetPath(options.target);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const targetDir = path.dirname(targetPath);
  fs.mkdirSync(targetDir, { recursive: true });

  const templateContent = readText(templatePath);

  if (!isDefaultTarget(targetPath) && !options.force) {
    throw new Error(`Non-default target requires --force: ${targetPath}`);
  }

  let backupPath = null;
  if (fs.existsSync(targetPath)) {
    const currentContent = readText(targetPath);
    const targetIsManaged = isManagedContent(currentContent);

    if (!targetIsManaged && !options.force) {
      throw new Error(`Refusing to overwrite unmanaged target without --force: ${targetPath}`);
    }

    backupPath = resolveBackupPath(targetPath);
    fs.copyFileSync(targetPath, backupPath);
  }

  fs.writeFileSync(targetPath, templateContent, "utf8");

  return {
    ok: true,
    action: "install",
    templatePath,
    targetPath,
    backupPath,
    forced: Boolean(options.force),
  };
}

export function uninstallAgent(options = {}) {
  const targetPath = resolveTargetPath(options.target);

  if (!fs.existsSync(targetPath)) {
    return {
      ok: true,
      action: "uninstall",
      targetPath,
      removed: false,
      reason: "target-not-found",
    };
  }

  const currentContent = readText(targetPath);
  const targetIsManaged = isManagedContent(currentContent);

  if (!isDefaultTarget(targetPath) && !options.force) {
    throw new Error(`Non-default target uninstall requires --force: ${targetPath}`);
  }

  if (!targetIsManaged && !options.force) {
    throw new Error(`Refusing to remove unmanaged target without --force: ${targetPath}`);
  }

  fs.rmSync(targetPath);

  return {
    ok: true,
    action: "uninstall",
    targetPath,
    removed: true,
    forced: Boolean(options.force),
  };
}
