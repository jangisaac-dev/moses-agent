import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

export function resolveTemplatePath() {
  return path.join(repoRoot, "src", "templates", "agent.md");
}

export function resolveDefaultTarget() {
  return path.join(os.homedir(), ".config", "opencode", "agents", "moses.md");
}

export function resolveTargetPath(target) {
  if (!target) return resolveDefaultTarget();
  if (target.startsWith("~")) {
    return path.join(os.homedir(), target.slice(1));
  }
  return path.resolve(target);
}

export function resolveBackupPath(targetPath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${targetPath}.backup-${timestamp}`;
}

export function getRepoRoot() {
  return repoRoot;
}
