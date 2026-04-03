# Release notes for v1.0.1

## Release objective

Ship `moses-agent` v1.0.1 as an easy-to-install GitHub repository with prominent install docs, a Korean README variant, and validated local install behavior.

## Release focus

- keep the install path easy to find from the top of the README
- keep AI-agent installation instructions copy-pasteable
- ship a Korean README variant for local users
- keep all claims aligned with commands the repository actually supports

## Before releasing v1.0.1

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
5. Tag the release as `v1.0.1`.
6. Publish the GitHub release notes.

## Private release checklist

1. Create the repository as private.
2. Push the local main branch.
3. Verify that README language links and install docs stay in sync before any public release.
4. Confirm the repository contains no personal local paths or environment-specific secrets.

## Suggested release note summary

- surface the supported install flow at the top of the README
- add a Korean README variant with links back to the English original
- keep installation docs aligned with the current CLI safety model

## Future enhancements

- npm publish flow
- automated test harness
- optional backup restoration command
- checksum verification for release artifacts
