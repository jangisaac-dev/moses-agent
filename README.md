# moses-agent

한국어 문서는 [`README.ko.md`](./README.ko.md)에서 볼 수 있습니다.

Reusable Moses orchestrator agent package for OpenCode-style environments.

Install Moses into your local OpenCode agent directory, reload your session, and call it as `@moses`.

`moses-agent` packages the Moses prompt as a small, reviewable repository so you can keep the agent under version control, install it consistently across machines, and distribute it without bundling unrelated project configuration.

---

## Installation

### Requirements

- Node.js `>=18`
- Unix-like environment using the standard OpenCode-style agent directory

### Fast path

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent && cd moses-agent && node bin/moses-install.js validate && ./install.sh
```

This is the easiest supported install flow today.

If `validate` shows that the existing target is unmanaged and `forceRequiredForInstall` is `true`, stop and review before replacing anything.

### For humans

The fastest local install flow:

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent
cd moses-agent
node bin/moses-install.js validate
./install.sh
```

Then reload or restart your OpenCode session. If the runtime reads `~/.config/opencode/agents`, Moses becomes callable as `@moses`.

If you prefer the CLI directly:

```bash
node bin/moses-install.js install
```

After installation, verify the target path and management state:

```bash
node bin/moses-install.js validate
```

### For AI agents

Paste this into your coding agent:

```text
Clone https://github.com/jangisaac-dev/moses-agent.git into a local folder named moses-agent, read README.md and docs/installation.md, run `node bin/moses-install.js validate`, explain whether `forceRequiredForInstall` is true and why, and only if the target/path looks correct run `./install.sh`. After that, tell me the installed target path, whether a backup was created, and remind me to reload or restart OpenCode so `@moses` becomes available.
```

This keeps the AI-agent flow close to oh-my-opencode's "give the agent a concrete installation task" style, while only using commands this repository actually supports today.

### Default install target

```text
~/.config/opencode/agents/moses.md
```

If your runtime uses a different path, install with `--target` and `--force`.

```bash
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

### Manual installation

If you do not want to run the installer CLI, use the step-by-step manual copy flow in [`docs/manual-install.md`](./docs/manual-install.md).

For the full install guide used by both humans and AI agents, see [`docs/installation.md`](./docs/installation.md).

---

## Contents

- [Installation](#installation)
- [What this package does](#what-this-package-does)
- [Who this is for](#who-this-is-for)
- [v1.0.1 scope](#v101-scope)
- [What is intentionally out of scope](#what-is-intentionally-out-of-scope)
- [Repository layout](#repository-layout)
- [Supported install model](#supported-install-model)
- [CLI commands](#cli-commands)
- [Install behavior](#install-behavior)
- [Safety model](#safety-model)
- [Manual installation](#manual-installation)
- [Customization](#customization)
- [Validation](#validation)
- [Uninstall behavior](#uninstall-behavior)
- [Development notes](#development-notes)
- [Release guidance](#release-guidance)
- [Known limitations](#known-limitations)
- [License](#license)

---

## What this package does

This repository provides a focused way to install a single agent file:

- installs the Moses agent prompt into a local OpenCode-style agent directory,
- backs up an existing target file before replacement,
- refuses risky overwrite/remove operations by default,
- supports explicit custom target installation with `--force`,
- ships a reusable installer, shell wrappers, and release docs.

The package is intentionally small. It is **not** a plugin, hook framework, dashboard, or runtime extension bundle.

## Who this is for

Use `moses-agent` if you want to:

- keep a reusable Moses orchestrator prompt in its own repository,
- install or re-install it consistently across machines,
- review install behavior before writing into your config directory,
- package the agent for private or public GitHub distribution.

## v1.0.1 scope

Version `1.0.1` keeps the package intentionally focused.

Included:

- Moses agent template
- Node-based installer CLI
- shell wrappers for install / uninstall
- backup-before-overwrite behavior
- ownership / management marker checks
- custom target support with explicit force flag
- manual install documentation
- release preparation documentation

## What is intentionally out of scope

Not included in v1.0.1:

- automatic OpenCode config mutation outside the agent target file
- plugin runtime hooks
- background services or dashboards
- automatic npm publishing
- automatic GitHub repo creation inside the package itself
- automatic backup restoration
- cryptographic install ownership verification

## Repository layout

```text
moses-agent/
├── README.md
├── README.ko.md
├── LICENSE
├── .gitignore
├── package.json
├── install.sh
├── uninstall.sh
├── bin/
│   └── moses-install.js
├── src/
│   ├── installer/
│   │   ├── core.js
│   │   └── paths.js
│   └── templates/
│       └── agent.md
└── docs/
    ├── installation.md
    ├── manual-install.md
    └── release.md
```

## Supported install model

The supported default target is:

```text
~/.config/opencode/agents/moses.md
```

This is the default install path for Unix-like environments where OpenCode-style agents are loaded from the standard config directory.

If your runtime uses a different path, you can still install there with `--target --force`, but you are responsible for making sure your runtime actually reads that location.

## Quick start

### Option A — shell wrapper

```bash
git clone https://github.com/jangisaac-dev/moses-agent.git moses-agent
cd moses-agent
./install.sh
```

### Option B — Node CLI

```bash
node bin/moses-install.js install
```

### Validate first

```bash
node bin/moses-install.js validate
```

### Install to a custom target

```bash
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

After installation, reload or restart your OpenCode session so the runtime can re-read the agent directory. When the host runtime loads the installed file, Moses becomes callable as `@moses`.

## CLI commands

```bash
node bin/moses-install.js help
node bin/moses-install.js validate
node bin/moses-install.js install
node bin/moses-install.js install --target "$HOME/.config/opencode/agents/moses.custom.md" --force
node bin/moses-install.js uninstall
node bin/moses-install.js uninstall --target "$HOME/.config/opencode/agents/moses.custom.md" --force
```

## Install behavior

On install, the CLI:

1. resolves the bundled template,
2. resolves the target path,
3. creates parent directories when needed,
4. checks whether the target is managed by `moses-agent`,
5. creates a timestamped backup if the target already exists,
6. writes the Moses template to the target path,
7. reports the result as structured JSON.

If the existing target does not look like a `moses-agent` managed file, install refuses to overwrite it unless `--force` is supplied.

## Safety model

The installer is intentionally conservative.

### Default target safety

- Default target installs are allowed without `--force`.
- Existing files are backed up before replacement.

### Non-default target safety

- Any non-default target requires `--force`.
- This prevents accidental writes into unrelated files or directories.

### Managed file detection

The bundled template includes a marker:

```html
<!-- moses-agent:managed -->
```

This marker lets the CLI distinguish package-managed files from unrelated files.

### Unmanaged file protection

- install refuses to overwrite unmanaged files by default,
- uninstall refuses to delete unmanaged files by default.

You can override these checks with `--force`, but that is an explicit operator decision.

## Manual installation

If you prefer not to use the CLI, see:

- [`docs/manual-install.md`](./docs/manual-install.md)

Manual installation is useful for audited environments, packaging experiments, or situations where shell wrappers are not desirable.

## Customization

The simplest supported customization path is to:

1. edit `src/templates/agent.md`,
2. validate the repository locally,
3. install it again to the desired target.

If you maintain multiple variants, use explicit custom targets so you do not accidentally overwrite your main Moses install.

## Validation

The built-in validator reports:

- repository root,
- template path,
- template presence,
- managed marker presence,
- target path,
- target directory existence,
- target existence,
- whether the target is the default path,
- whether the target looks managed,
- whether `--force` would be required for install or uninstall.

Example:

```bash
node bin/moses-install.js validate
```

This validator is a path-and-ownership check. It is **not** a full compatibility guarantee for every OpenCode distribution or every custom config layout.

## Uninstall behavior

The uninstall command:

- checks whether the target exists,
- refuses to remove unmanaged targets by default,
- requires `--force` for non-default targets,
- removes the file only when the safety rules permit it.

It does **not** automatically restore backups. Backup restoration is intentionally manual in v1.0.1 because multiple candidate backups may exist and automatic selection would be error-prone.

After uninstall, reload or restart your OpenCode session. If no replacement agent file exists at the relevant target path, `@moses` should no longer be available.

## Development notes

Useful local commands:

```bash
node bin/moses-install.js help
node bin/moses-install.js validate
node bin/moses-install.js install --target "$PWD/tmp/moses-test.md" --force
node bin/moses-install.js uninstall --target "$PWD/tmp/moses-test.md" --force
```

## Release guidance

Before shipping this repository:

1. verify docs match actual CLI behavior,
2. verify overwrite refusal for unmanaged files,
3. verify uninstall refusal for unmanaged files,
4. verify custom-target behavior with `--force`,
5. verify repository metadata in `package.json` matches the actual GitHub repository,
6. verify no private local paths or secrets remain.

Release notes and checklist details are in:

- [`docs/release.md`](./docs/release.md)

## Known limitations

- Default install behavior targets Unix-like systems using the standard config path.
- Ownership detection is marker-based, not cryptographic.
- The package manages a single agent file; it does not manage broader runtime configuration.
- Backup restoration is manual.
- Full CI and cross-platform coverage are not included in v1.0.1.

## License

MIT
