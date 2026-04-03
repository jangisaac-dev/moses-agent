# Release notes for v0.1 preparation

## Release objective

Ship `moses-agent` as a small GitHub repository that users can clone or download and then install locally.

## Before first release

- verify `README.md` matches actual install behavior
- verify `install.sh` and `uninstall.sh` work on a clean machine
- verify backup behavior when `moses.md` already exists
- verify overwrite refusal for unmanaged files without `--force`
- verify uninstall refusal for unmanaged files without `--force`
- verify `node bin/moses-install.js validate` prints correct paths
- verify repository contains license and package metadata

## Suggested release checklist

1. Review repository contents.
2. Validate install and uninstall in a temporary target path.
3. Validate managed-vs-unmanaged safety behavior.
4. Confirm the bundled template is the intended Moses prompt.
5. Tag the release as `v0.1.0`.
6. Publish the GitHub release notes.

## Private release checklist

1. Create the repository as private.
2. Push the local main branch.
3. Verify that placeholders like `OWNER` in `package.json` and README are replaced before any public release.
4. Confirm the repository contains no personal local paths or environment-specific secrets.

## Future enhancements

- npm publish flow
- automated test harness
- optional backup restoration command
- checksum verification for release artifacts
