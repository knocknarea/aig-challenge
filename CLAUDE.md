# Claude Rules for this Project

## Permission Boundaries

1. **Never auto-commit.** Always ask the user before creating any git commit, without exception.

2. **Never auto-push.** Always ask before pushing to any remote branch or origin.

3. **Ask before destructive file operations.** Confirm with the user before: deleting any file, running `rm`, `git reset --hard`, `git checkout --`, `git clean`, or overwriting uncommitted changes.

4. **Restrict all bash and file operations to this directory.** All commands, reads, writes, deletes, and moves must stay within `/Users/adrian/develop/interviews/aig-policy-quote`. Do not operate on paths outside this directory.

## Interaction Log

5. **Maintain AGENT_LOG.md.** After completing any meaningful unit of work in a session, append an entry to `AGENT_LOG.md` at the project root. Never overwrite the file — only append. Use this format:

```
## [YYYY-MM-DD] <short title>
- What was done and why
- Files created or modified
- Decisions made or deferred
```

## Project Documentation

6. **Maintain README.md.** Keep `README.md` up to date as the application evolves. Update it whenever the project structure, stack, or run instructions change.
