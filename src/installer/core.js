import fs from "node:fs";
import path from "node:path";
import {
  getRepoRoot,
  listTemplateBundle,
  resolveBackupPath,
  resolveDefaultTargetDir,
  resolveTargetDir,
} from "./paths.js";

const MANAGED_MARKER = "<!-- moses-agent:managed -->";

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function isManagedContent(content) {
  return content.includes(MANAGED_MARKER);
}

function isDefaultTargetDir(targetDir) {
  return targetDir === resolveDefaultTargetDir();
}

function targetPathFor(targetDir, targetName) {
  return path.join(targetDir, targetName);
}

function readManagedState(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return {
      exists: false,
      looksManaged: false,
      forceRequired: false,
    };
  }

  const content = readText(targetPath);
  const looksManaged = isManagedContent(content);

  return {
    exists: true,
    looksManaged,
    forceRequired: !looksManaged,
  };
}

function buildBundleValidation(targetDir) {
  const bundle = listTemplateBundle();
  const files = bundle.map(({ templateName, templatePath, targetName }) => {
    const templateExists = fs.existsSync(templatePath);
    const templateContent = templateExists ? readText(templatePath) : null;
    const targetPath = targetPathFor(targetDir, targetName);
    const targetState = readManagedState(targetPath);

    return {
      templateName,
      templatePath,
      templateExists,
      templateHasManagedMarker: Boolean(templateContent && isManagedContent(templateContent)),
      targetName,
      targetPath,
      targetExists: targetState.exists,
      targetLooksManaged: targetState.looksManaged,
      forceRequiredForInstall: targetState.forceRequired,
      forceRequiredForUninstall: targetState.forceRequired,
    };
  });

  return {
    bundle,
    files,
    allTemplatesExist: files.every((file) => file.templateExists),
    allTemplatesManaged: files.every((file) => file.templateHasManagedMarker),
    anyTargetExists: files.some((file) => file.targetExists),
    anyTargetUnmanaged: files.some((file) => file.targetExists && !file.targetLooksManaged),
    forceRequiredForInstall: !isDefaultTargetDir(targetDir) || files.some((file) => file.forceRequiredForInstall),
    forceRequiredForUninstall: !isDefaultTargetDir(targetDir) || files.some((file) => file.forceRequiredForUninstall),
  };
}

export function printHelp() {
  console.log(`moses-agent

Usage:
  moses-agent help
  moses-agent validate [--target-dir <path>]
  moses-agent install [--target-dir <path>] [--force]
  moses-agent uninstall [--target-dir <path>] [--force]

Defaults:
  target directory: ~/.config/opencode/agents
  installed files: moses.md + bundled moses-*.md prompts

Safety:
  --force is required for non-default target directories and for removing or replacing
  files not previously installed by moses-agent.
`);
}

export function validateInstall(options = {}) {
  const targetDir = resolveTargetDir(options.targetDir ?? options.target);
  const bundleState = buildBundleValidation(targetDir);
  const primaryFile = bundleState.files.find((file) => file.targetName === "moses.md");

  return {
    ok: bundleState.allTemplatesExist && bundleState.allTemplatesManaged,
    repoRoot: getRepoRoot(),
    targetDir,
    targetDirExists: fs.existsSync(targetDir),
    targetIsDefault: isDefaultTargetDir(targetDir),
    targetPath: primaryFile?.targetPath ?? targetPathFor(targetDir, "moses.md"),
    templatePath: primaryFile?.templatePath ?? null,
    templateExists: primaryFile?.templateExists ?? false,
    templateHasManagedMarker: primaryFile?.templateHasManagedMarker ?? false,
    targetExists: primaryFile?.targetExists ?? false,
    targetLooksManaged: primaryFile?.targetLooksManaged ?? false,
    forceRequiredForInstall: bundleState.forceRequiredForInstall,
    forceRequiredForUninstall: bundleState.forceRequiredForUninstall,
    installedFiles: bundleState.files,
  };
}

export function installAgent(options = {}) {
  const targetDir = resolveTargetDir(options.targetDir ?? options.target);
  const bundle = listTemplateBundle();

  if (!isDefaultTargetDir(targetDir) && !options.force) {
    throw new Error(`Non-default target directory requires --force: ${targetDir}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const backupPaths = [];

  for (const { templateName, templatePath, targetName } of bundle) {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const targetPath = targetPathFor(targetDir, targetName);
    const templateContent = readText(templatePath);

    if (fs.existsSync(targetPath)) {
      const currentContent = readText(targetPath);
      const targetIsManaged = isManagedContent(currentContent);

      if (!targetIsManaged && !options.force) {
        throw new Error(`Refusing to overwrite unmanaged target without --force: ${targetPath}`);
      }

      const backupPath = resolveBackupPath(targetPath);
      fs.copyFileSync(targetPath, backupPath);
      backupPaths.push({ targetPath, backupPath });
    }

    fs.writeFileSync(targetPath, templateContent, "utf8");
  }

  return {
    ok: true,
    action: "install",
    targetDir,
    installedFiles: bundle.map(({ templateName, templatePath, targetName }) => ({
      templateName,
      templatePath,
      targetName,
      targetPath: targetPathFor(targetDir, targetName),
    })),
    backupPaths,
    forced: Boolean(options.force),
  };
}

export function uninstallAgent(options = {}) {
  const targetDir = resolveTargetDir(options.targetDir ?? options.target);
  const bundle = listTemplateBundle();

  if (!isDefaultTargetDir(targetDir) && !options.force) {
    throw new Error(`Non-default target directory uninstall requires --force: ${targetDir}`);
  }

  const removedFiles = [];
  const skippedFiles = [];

  for (const { targetName } of bundle) {
    const targetPath = targetPathFor(targetDir, targetName);

    if (!fs.existsSync(targetPath)) {
      skippedFiles.push({ targetPath, reason: "target-not-found" });
      continue;
    }

    const currentContent = readText(targetPath);
    const targetIsManaged = isManagedContent(currentContent);

    if (!targetIsManaged && !options.force) {
      throw new Error(`Refusing to remove unmanaged target without --force: ${targetPath}`);
    }

    fs.rmSync(targetPath);
    removedFiles.push(targetPath);
  }

  return {
    ok: true,
    action: "uninstall",
    targetDir,
    removed: removedFiles.length > 0,
    removedFiles,
    skippedFiles,
    forced: Boolean(options.force),
  };
}
