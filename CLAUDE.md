# JLU Design System

## Dev harness

**The main session is the project manager** and does the work itself; there are no subagents.
Quick edits are batched on a `dev/<topic>` branch, board cards are tracked with the `kanban-doku`
skill, and both are reviewed once by Codex (`/codex:review`, plugin `openai/codex-plugin-cc`)
before they ship. See `.claude/skills/project-manager/` (both lanes) and
`.claude/skills/kanban-doku/` (board and PM loop).

## Design patterns and rules

How patterns and design rules are proposed, decided and enforced — and what an agent may and may
not do with them — is in [docs/PATTERN_GOVERNANCE.md](docs/PATTERN_GOVERNANCE.md). It is a guide;
the registry it describes is not built yet. Agents propose rules, only the owner accepts them.

## Premade components first — always

If a shadcn registry (shadcn/ui, AI Elements, …) already has a component, it is imported with
`npx shadcn@latest add` and only normalised to JLU tokens and DS primitives. It is never hand-ported
or redesigned. Upstream bugs are fixed in their own commit after the import. Rule, allowed changes and the
fidelity diff: [docs/COMPONENT_GUIDELINES.md → „Premade components first"](docs/COMPONENT_GUIDELINES.md#premade-components-first--a-standing-rule).

## Parallel work runs in a temporary worktree — always

Any work that runs alongside other activity in this repo — a card worked while a quick-edit batch
is open, parallel tasks, background jobs — happens in a **temporary git worktree**
(`git worktree add`), never in the main working tree. The main checkout belongs to the
interactive session (the PM). It is on `main` and clean, except while a quick-edit batch is open
on a `dev/<topic>` branch. That batch is the interactive session's own work, not parallel work.

## Commit messages

Conventional Commits, one short lowercase summary line:

```
fix(docker): npm auth for @ki4jlu/design-system in frontend image build
```

- Format: `type(scope): summary` — types: feat, fix, chore, docs, refactor, test, ci
- The summary starts lowercase, with a **PascalCase component name** (`feat(sidebar):
  SidebarUserMenu …`), or with a **version** — releases are `chore(release): 0.23.0`.
- **Summary is the message. Max 72 characters, and usually that is the whole commit.**
- **A body is at most 3 lines, and only for a decision or a non-obvious *why*.** Never restate the
  diff or list what was verified — the kanban card is the durable record and is where reviewers look.
- Enforced by `.githooks/commit-msg`; wire it once per clone with `git config core.hooksPath
  .githooks`. Merges, reverts and fixups are exempt.
- Do NOT add a `Co-Authored-By: Claude` trailer. Co-author trailers are for humans only.
