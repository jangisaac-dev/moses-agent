#!/usr/bin/env node

import process from "node:process";
import {
  installAgent,
  uninstallAgent,
  validateInstall,
  printHelp,
} from "../src/installer/core.js";

const [, , command = "help", ...rest] = process.argv;

function readFlag(name) {
  const index = rest.indexOf(name);
  if (index === -1) return undefined;
  return rest[index + 1];
}

const options = {
  target: readFlag("--target"),
  force: rest.includes("--force"),
};

try {
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      printHelp();
      break;
    case "validate": {
      const result = validateInstall(options);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "install": {
      const result = installAgent(options);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case "uninstall": {
      const result = uninstallAgent(options);
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        command,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
