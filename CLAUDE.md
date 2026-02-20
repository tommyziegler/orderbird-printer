# CLAUDE.md

This file provides guidance for AI assistants (such as Claude) working on the **orderbird-printer** repository.

## Project Overview

**orderbird-printer** is a project owned by Tommy Ziegler (toziegler@cisco.com), licensed under the MIT License (2026). The repository is in its initial state — no source code, build system, or dependencies have been added yet. As the project grows, this file should be updated to reflect the current architecture, conventions, and workflows.

## Repository State

At the time of writing, the repository contains:

```
orderbird-printer/
├── .git/
├── LICENSE      # MIT License
└── CLAUDE.md    # This file
```

No source code, package manager configuration, build tooling, or tests exist yet.

## Git Workflow

### Branch Strategy

- **`main`** — default production branch on the remote
- **`master`** — local default branch (mirrors `main`)
- **`claude/<session-id>`** — feature/task branches created by Claude for specific tasks

### Naming Conventions

Claude-managed branches must follow the pattern:

```
claude/<task-description>-<session-id>
```

Example: `claude/claude-md-mlvbinjr9u2envol-HqT8b`

### Pushing Changes

Always use:

```bash
git push -u origin <branch-name>
```

- Branch names **must** start with `claude/` and end with the matching session ID, or push will fail with HTTP 403.
- On network failure, retry with exponential backoff: 2s → 4s → 8s → 16s.

### Commit Conventions

- Write clear, descriptive commit messages in the imperative mood (e.g. "Add printer discovery service").
- Keep commits focused and atomic.
- GPG/SSH signing is enabled in the git config — do not pass `--no-gpg-sign`.

### Remote Configuration

The remote `origin` points to a local git proxy:

```
http://127.0.0.1:20946/git/tommyziegler/orderbird-printer
```

## Development Guidelines (to be updated as code is added)

As the codebase grows, document the following here:

### Technology Stack

_To be determined. Update this section once the stack is chosen (e.g. language, frameworks, build tools)._

### Directory Structure

_To be documented once source directories are established._

### Build & Run

_To be documented once a build system is configured._

### Testing

_To be documented once a test framework is set up._

### Code Conventions

_To be documented once a coding style and linting configuration are established._

## Key Principles for AI Assistants

1. **Read before editing.** Always read a file before modifying it.
2. **Minimal changes.** Only change what is necessary for the task; do not refactor unrelated code.
3. **No unused artifacts.** Remove code and files that are no longer needed; do not leave dead code behind.
4. **Security first.** Do not introduce command injection, XSS, SQL injection, or other OWASP Top 10 vulnerabilities.
5. **No over-engineering.** Prefer the simplest solution that meets requirements. Avoid premature abstractions.
6. **Keep this file current.** Update CLAUDE.md whenever the project structure, stack, or workflows change significantly.
