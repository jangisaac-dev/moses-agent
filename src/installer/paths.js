import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const PRIMARY_TEMPLATE_NAME = "agent.md";
const PRIMARY_TARGET_NAME = "moses.md";

export function resolveTemplateDir() {
  return path.join(repoRoot, "src", "templates");
}

export function resolveDefaultTargetDir() {
  return path.join(os.homedir(), ".config", "opencode", "agents");
}

export function resolveTargetDir(target) {
  if (!target) return resolveDefaultTargetDir();
  if (target.startsWith("~")) {
    return path.join(os.homedir(), target.slice(1));
  }
  return path.resolve(target);
}

export function listTemplateBundle() {
  const templateDir = resolveTemplateDir();
  const names = fs
    .readdirSync(templateDir)
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => {
      if (a === PRIMARY_TEMPLATE_NAME) return -1;
      if (b === PRIMARY_TEMPLATE_NAME) return 1;
      return a.localeCompare(b);
    });

  return names.map((templateName) => ({
    templateName,
    templatePath: path.join(templateDir, templateName),
    targetName: templateName === PRIMARY_TEMPLATE_NAME ? PRIMARY_TARGET_NAME : templateName,
  }));
}

export function resolveBackupPath(targetPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${targetPath}.backup-${timestamp}`;
}

export function getRepoRoot() {
  return repoRoot;
}
