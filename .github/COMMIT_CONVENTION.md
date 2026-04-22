# Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>: <short summary>
```

## Types

| Type | Description |
|---|---|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `chore` | Tooling, CI, dependencies, build config |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace (no code change) |

## Examples

```
feat: add Steam provider for game search
fix: handle empty API response in OMDb provider
refactor: extract shared logic into base provider class
chore: update esbuild to 0.25.x
docs: add API key setup guide to README
test: add coverage for note generator edge cases
```

## Rules

- Use lowercase for the summary
- Do not end the summary with a period
- Keep the summary under 72 characters
- Use the imperative mood ("add" not "added" or "adds")

## Git commit template

This repository includes a [commit message template](.gitmessage) that appears when you run `git commit` without `-m`. To set it up after cloning:

```bash
git config --local commit.template .github/.gitmessage
```
