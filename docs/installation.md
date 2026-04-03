# Installation

Complete installation guide for `moses-agent` with human flow, AI-agent flow, verification, and manual fallback.

This repository does **not** currently ship a published `npx`/`bunx` installer. The supported easy-install path today is: clone the repository, validate the target, then run `./install.sh` or `node bin/moses-install.js install`.

## Prerequisites

- Node.js `>=18`
- A Unix-like environment using an OpenCode-style agent directory
- A runtime that loads agents from `~/.config/opencode/agents` or a custom path you control

## Installation methods

### Method 1: Let an AI agent install it

Paste this into your coding agent:

```text
Clone https://github.com/jangisaac-dev/moses-agent.git into a local folder named moses-agent, read README.md and docs/installation.md, run `node bin/moses-install.js validate`, explain whether `forceRequiredForInstall` is true and why, and only if the target/path looks correct run `./install.sh`. After that, tell me the installed target path, whether a backup was created, and remind me to reload or restart OpenCode so `@moses` becomes available.
```

The agent should:

1. clone the repository,
2. inspect `README.md`, `docs/installation.md`, and `package.json`,
3. run `node bin/moses-install.js validate`,
4. explain whether install looks safe as-is or whether `--force` would be required,
5. run `./install.sh` or `node bin/moses-install.js install` only when appropriate,
6. report the installed target path,
7. report whether a backup was created,
8. remind the user to reload or restart OpenCode so `@moses` becomes available.

This gives AI agents a concrete install mission similar in spirit to oh-my-opencode, but without claiming unsupported package-manager flows.

### Method 2: Human install

Fastest supported one-liner:

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent && cd moses-agent && node bin/moses-install.js validate && ./install.sh
```

Step-by-step flow:

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent
cd moses-agent
node bin/moses-install.js validate
./install.sh
```

Alternative CLI flow:

```bash
node bin/moses-install.js install
```

If `validate` shows `forceRequiredForInstall: true` because the target is unmanaged, stop and review before using `--force`.

### Method 3: Manual installation

If you do not want to run the installer CLI, follow [`docs/manual-install.md`](./manual-install.md).

## Supported install target

Default target:

```text
~/.config/opencode/agents/moses.md
```

Custom target example:

```bash
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

Non-default targets require `--force` by design.

## Verify installation

Run:

```bash
node bin/moses-install.js validate
```

Check for:

- `templateExists: true`
- `templateHasManagedMarker: true`
- the expected `targetPath`
- whether `targetLooksManaged` is true after installation

Then reload or restart your OpenCode session and confirm `@moses` is callable.

## Safety model

- Existing targets are backed up before replacement.
- Unmanaged files are not overwritten without `--force`.
- Non-default targets require `--force`.
- Unmanaged files are not removed during uninstall without `--force`.

## Troubleshooting

### Install refuses to overwrite a file

The target probably exists and does not look like a `moses-agent` managed file. Either choose a different target or rerun with `--force` only if you intentionally want to replace it.

### Moses does not appear after install

Reload or restart OpenCode. Then confirm your runtime actually reads the target path you installed to.

### Need a custom path

Use:

```bash
node bin/moses-install.js install --target "/your/path/moses.md" --force
```
