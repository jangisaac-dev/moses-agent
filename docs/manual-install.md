# Manual installation

Use this flow if you want the same end result as the installer without executing `install.sh` or `node bin/moses-install.js install`.

## Default install target

The default install target is:

```text
~/.config/opencode/agents/moses.md
```

This is the supported default target for Unix-like systems where OpenCode-style agents are loaded from the standard config directory.

If your runtime loads agents from a different path, use the CLI with `--target` and verify that your runtime actually reads that location.

## Manual copy flow

1. Create the target directory if it does not exist.
2. Back up any existing `moses.md`.
3. Copy `src/templates/agent.md` to the target path.
4. Reload or restart OpenCode.
5. Confirm `@moses` becomes callable.

Example:

```bash
mkdir -p "$HOME/.config/opencode/agents"
cp "$HOME/.config/opencode/agents/moses.md" "$HOME/.config/opencode/agents/moses.md.backup" 2>/dev/null || true
cp ./src/templates/agent.md "$HOME/.config/opencode/agents/moses.md"
```

Then restart or reload your OpenCode session. Once the runtime re-reads the agent directory, Moses should be callable as `@moses`.

The bundled template includes a `moses-agent` management marker so the CLI can distinguish its own installs from unrelated files.

## Manual uninstall

```bash
rm "$HOME/.config/opencode/agents/moses.md"
```

If backup files exist, restore one manually only after checking which version you want to recover.

## Manual validate

Check that the installed target exists and that the CLI reports the expected ownership/path state:

```bash
node ./bin/moses-install.js validate
```

## Compare with the installer

Manual install reaches the same target file as the installer, but it does not:

- create timestamped backups automatically,
- detect managed vs unmanaged targets for you,
- print structured JSON results.

If you want those safety checks, prefer:

```bash
node ./bin/moses-install.js validate
./install.sh
```

## Notes

- This package does not edit broader OpenCode config.
- If you use a custom config directory, install to your preferred target path with `--target --force`.
- Manual `rm` removal is a low-level bypass. Prefer the CLI uninstall command when possible.
