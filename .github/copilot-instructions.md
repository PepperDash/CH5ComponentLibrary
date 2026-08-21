# Copilot Instructions

## Commit Message Convention

All commits **must** use [Conventional Commits](https://www.conventionalcommits.org/) syntax:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Allowed types

| Type       | When to use                                              |
|------------|----------------------------------------------------------|
| `feat`     | A new feature                                            |
| `fix`      | A bug fix                                                |
| `docs`     | Documentation-only changes                               |
| `style`    | Formatting, missing semi-colons, etc (no logic change)   |
| `refactor` | Code change that is neither a fix nor a feature          |
| `perf`     | Performance improvement                                  |
| `test`     | Adding or updating tests                                 |
| `build`    | Changes to build system or external dependencies         |
| `ci`       | Changes to CI/CD configuration                           |
| `chore`    | Other changes that don't modify src or test files        |
| `revert`   | Reverts a previous commit                                |

### Examples

```
feat(slider): add range-selection support
fix(build): add trailing slash to publishConfig.registry for OIDC
ci: remove registry-url from setup-node to prevent token auth conflict
docs: update README with new publish instructions
chore: bump devDependencies
```

### Breaking changes

Append `!` after the type/scope, or add a `BREAKING CHANGE:` footer:

```
feat!: drop Node 14 support

BREAKING CHANGE: minimum Node version is now 18
```
