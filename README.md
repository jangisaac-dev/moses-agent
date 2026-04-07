# moses-agent

한국어 문서는 [`README.ko.md`](./README.ko.md)에서 볼 수 있습니다.

Reusable Moses orchestrator agent package for OpenCode-style environments.

Install the bundled Moses control-plane team into your local OpenCode agent directory, reload your session, and call the entrypoint as `@moses`.

`moses-agent` packages the Moses control-plane prompt plus its bundled `moses-*` specialist prompts as a small, reviewable repository so you can keep the team under version control, install it consistently across machines, and distribute it without bundling unrelated project configuration.

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

If `validate` shows that the existing target directory contains unmanaged files and `forceRequiredForInstall` is `true`, stop and review before replacing anything.

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

After installation, verify the target directory and bundle management state:

```bash
node bin/moses-install.js validate
```

### For AI agents

Paste this into your coding agent:

```text
Clone https://github.com/jangisaac-dev/moses-agent.git into a local folder named moses-agent, read README.md and docs/installation.md, run `node bin/moses-install.js validate`, explain whether `forceRequiredForInstall` is true and why, and only if the target directory looks correct run `./install.sh`. After that, tell me the installed target directory, which bundle files were written, whether backups were created, and remind me to reload or restart OpenCode so `@moses` becomes available.
```

This keeps the AI-agent flow close to oh-my-opencode's "give the agent a concrete installation task" style, while only using commands this repository actually supports today.

### Default install target directory

```text
~/.config/opencode/agents
```

The installer writes `moses.md` plus the bundled `moses-*.md` specialist prompts into this directory.

If your runtime uses a different directory, install with `--target-dir` and `--force`.

```bash
node bin/moses-install.js install --target-dir "$HOME/.config/opencode/agents-custom" --force
```

### Manual installation

If you do not want to run the installer CLI, use the step-by-step manual copy flow in [`docs/manual-install.md`](./docs/manual-install.md).

For the full install guide used by both humans and AI agents, see [`docs/installation.md`](./docs/installation.md).

---

## Contents

- [Installation](#installation)
- [What this package does](#what-this-package-does)
- [Who this is for](#who-this-is-for)
- [v1.0.2 scope](#v102-scope)
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

## Host-aware brainstorming UX

When Moses needs bounded up-front clarification, it first checks what interaction affordances the current host runtime exposes.

- In OpenCode-style runtimes with structured question support, Moses can present select-style intake prompts.
- In generic CLI environments, Moses falls back to numbered text choices plus freeform input.
- In text-only environments, Moses uses short multiple-choice phrasing in plain text.
- Precise requests skip this layer and continue through the normal planning-first flow.

This adapter changes the user experience of the initial intake only. It does **not** change Moses's planning, approval, orchestration, or validation logic.

This repository provides a focused way to install a bundled Moses control-plane team:

- installs the Moses entry prompt plus bundled `moses-*` specialist prompts into a local OpenCode-style agent directory,
- backs up existing managed target files before replacement,
- refuses risky overwrite/remove operations by default,
- supports explicit custom target-directory installation with `--force`,
- ships a reusable installer, shell wrappers, and release docs.

This package is a control-plane-first bundle: Moses stays planner/orchestrator/communicator-only, the bundled `moses-*` team serves as the default internal specialist set, and downstream execution relies on explicit delegation packets rather than broad worker inference.

The package is intentionally small. It is **not** a plugin, hook framework, dashboard, or runtime extension bundle.

## Who this is for

Use `moses-agent` if you want to:

- keep a reusable Moses orchestrator prompt in its own repository,
- install or re-install it consistently across machines,
- review install behavior before writing into your config directory,
- package the agent for private or public GitHub distribution.

## v1.0.2 scope

Version `1.0.2` keeps the package intentionally focused while adding host-aware brainstorming UX at the intake layer.

Included:

- Moses control-plane template plus bundled specialist prompts
- Node-based installer CLI
- shell wrappers for install / uninstall
- backup-before-overwrite behavior
- ownership / management marker checks
- custom target support with explicit force flag
- manual install documentation
- release preparation documentation
- host-aware brainstorming UX for vague intake requests

## What is intentionally out of scope

Not included in v1.0.2:

- automatic OpenCode config mutation outside the agent target directory
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
│       ├── agent.md
│       └── moses-*.md
└── docs/
    ├── installation.md
    ├── manual-install.md
    └── release.md
```

## Supported install model

The supported default target directory is:

```text
~/.config/opencode/agents
```

This is the default install directory for Unix-like environments where OpenCode-style agents are loaded from the standard config directory.

The installer writes `moses.md` plus the bundled `moses-*.md` worker prompts into that directory.

If your runtime uses a different directory, you can still install there with `--target-dir --force`, but you are responsible for making sure your runtime actually reads that location.

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

### Install to a custom target directory

```bash
node bin/moses-install.js install --target-dir "$HOME/.config/opencode/agents-custom" --force
```

After installation, reload or restart your OpenCode session so the runtime can re-read the agent directory. When the host runtime loads the installed bundle, Moses becomes callable as `@moses` and can route to the bundled `moses-*` prompts.

## CLI commands

```bash
node bin/moses-install.js help
node bin/moses-install.js validate
node bin/moses-install.js install
node bin/moses-install.js install --target-dir "$HOME/.config/opencode/agents-custom" --force
node bin/moses-install.js uninstall
node bin/moses-install.js uninstall --target-dir "$HOME/.config/opencode/agents-custom" --force
```

## Install behavior

On install, the CLI:

1. resolves the bundled templates directory,
2. resolves the target directory,
3. creates parent directories when needed,
4. checks whether each existing bundle target is managed by `moses-agent`,
5. creates timestamped backups for existing target files when needed,
6. writes `moses.md` plus bundled `moses-*.md` prompts into the target directory,
7. reports the result as structured JSON.

If any existing target file in the bundle directory does not look like a `moses-agent` managed file, install refuses to overwrite it unless `--force` is supplied.

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

This marker lets the CLI distinguish package-managed files from unrelated files across the installed bundle.

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

1. edit the relevant files in `src/templates/`,
2. validate the repository locally,
3. install the bundle again to the desired target directory.

If you maintain multiple variants, use explicit custom target directories so you do not accidentally overwrite your main Moses bundle.

## Validation

The built-in validator reports:

- repository root,
- target directory,
- whether the target directory is the default path,
- per-template paths and target filenames,
- template presence,
- managed marker presence,
- target directory existence,
- per-target existence,
- whether each target looks managed,
- whether `--force` would be required for install or uninstall.

Example:

```bash
node bin/moses-install.js validate
```

This validator is a path-and-ownership check. It is **not** a full compatibility guarantee for every OpenCode distribution or every custom config layout.

## Uninstall behavior

The uninstall command:

- checks whether each bundle target exists,
- refuses to remove unmanaged targets by default,
- requires `--force` for non-default target directories,
- removes bundle files only when the safety rules permit it.

It does **not** automatically restore backups. Backup restoration is intentionally manual in v1.0.2 because multiple candidate backups may exist and automatic selection would be error-prone.

After uninstall, reload or restart your OpenCode session. If no replacement Moses bundle exists at the relevant target directory, `@moses` should no longer be available.

## Development notes

Useful local commands:

```bash
node bin/moses-install.js help
node bin/moses-install.js validate
node bin/moses-install.js install --target-dir "$PWD/tmp/opencode-agents" --force
node bin/moses-install.js uninstall --target-dir "$PWD/tmp/opencode-agents" --force
```

## Release guidance

Before shipping this repository:

1. verify docs match actual CLI behavior,
2. verify overwrite refusal for unmanaged files,
3. verify uninstall refusal for unmanaged files,
4. verify custom target-directory behavior with `--force`,
5. verify repository metadata in `package.json` matches the actual GitHub repository,
6. verify no private local paths or secrets remain.

Release notes and checklist details are in:

- [`docs/release.md`](./docs/release.md)

## Known limitations

- Default install behavior targets Unix-like systems using the standard config path.
- Ownership detection is marker-based, not cryptographic.
- The package manages a bundled agent directory entrypoint plus worker prompts; it does not manage broader runtime configuration.
- Backup restoration is manual.
- Full CI and cross-platform coverage are not included in v1.0.2.

## License

MIT
