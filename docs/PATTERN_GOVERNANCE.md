# Pattern Governance — design, decide, enforce

Status: **guide, not yet implemented** (2026-10-14). This page tells agents how design patterns
and design rules are meant to be proposed, decided and enforced across every product that consumes
`@ki4jlu/design-system`. The registry, the record format and the enforcement tooling described here
**do not exist yet** — each section says what is in place today. Build towards this page; do not
claim a part of it exists until it does.

Ownership and the token/component contribution steps stay in
[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) (§1, §6). This page adds the layer above them: **rules about
how components are combined** (where actions go, how a dialog header is built, …).

---

## 1. Why

A rule that only lives in prose is not followed. The trigger case: JLURAG's `MembersModal` placed
the primary "Hinzufügen" button next to the dialog header in a hand-built row, although actions
belong in the dialog footer. Nothing stopped it — `DialogHeader`/`DialogFooter` are open `div`s that
accept any children, `DialogFooter` was never used in JLURAG, and the rule existed only as an example
snippet in [COMPONENT_GUIDELINES.md](./COMPONENT_GUIDELINES.md#dialog). Agents follow APIs and lint
errors reliably and long prose much less so; this system is built around that fact.

## 2. Reference models (what we borrow)

There is no single standard; this system combines established parts:

| Concern | Borrowed from | What we take |
|---|---|---|
| Decision process | GOV.UK Design System contribution model | Staged proposals, acceptance criteria: *useful, unique, usable, consistent, versatile* |
| Decision records | Architecture Decision Records (Nygard) | Status / context / decision / consequences, one record per decision |
| Pattern pages | GOV.UK, Carbon, Material, Atlassian | *When to use / When not to use / How it works / Do & Don't / Accessibility* |
| Vocabulary | Atomic Design (Frost) | Tokens → components → **patterns** → templates |
| Team model | EightShapes team models (Curtis) | Centralized, single decider |

Our own addition is the **enforcement ladder** (§5): published models leave enforcement vague.

## 3. Roles

- **Decider:** the design-system owner (see DESIGN_SYSTEM.md §1). Only the owner moves a rule to
  `accepted` or `deprecated`.
- **Agents** may find gaps, draft records, build do/don't stories and propose enforcement. An agent
  never accepts a rule, and never treats a `proposed` rule as binding.

## 4. The rule record

Every rule has an ID (`<AREA>-<NN>`, e.g. `DLG-01`, `CMP-03`) and exactly one record. Planned home:
a **Patterns** section in Storybook, one MDX page per pattern, so the rule and its rendered
examples sit together.

```
ID:           DLG-01
Title:        Dialog actions live in the footer
Status:       proposed | accepted | deprecated (superseded by …)
Rule:         one sentence, testable
Why:          one or two sentences
When to use / When not to use
Do / Don't:   two stories, rendered side by side
Enforcement:  api | lint | runtime | visual | review-only   (strongest that applies)
Decided:      <owner>, <date>, <PR>
```

A compact index (ID, title, status, enforcement) is generated from the records for agents and for
reviews. Consumer repos reference that index from their CLAUDE.md, not the full pages.

**Today:** no registry, no IDs. Existing rules live unnumbered in COMPONENT_GUIDELINES.md and
DESIGN_SYSTEM.md §4. They migrate into records as part of building the registry.

## 5. Enforcement ladder

Every accepted rule names the strongest level that can carry it:

1. **api** — a constrained component owns the layout, so the wrong arrangement cannot be written
   (e.g. a dialog taking `eyebrow`, `title`, `description`, `actions` and rendering header and
   footer itself). The primary tool. Open primitives stay available as a documented escape hatch.
2. **lint** — a rule in `@ki4jlu/design-system/eslint-plugin`; the message cites the rule ID.
   Ships as `warn` for one release, then `error`.
3. **runtime** — a development-only `console.warn` with the rule ID, for cases lint cannot see
   (wrapped components, computed children).
4. **visual** — story/screenshot tests on the canonical do-stories.
5. **review-only** — checked in code review against the index. This is **debt**: a rule may be
   accepted at this level only when the record says why nothing stronger fits, and it stays
   visible in the index as such.

**Today:** the ESLint plugin exists (tokens, raw controls, layout-only `className`); constrained
patterns exist for some areas (`SettingsDialog`, `AppShell`, `ChatStage`). `Dialog` itself is fully
open.

## 6. Lifecycle

| Stage | What happens | Artifact |
|---|---|---|
| Intake | A defect or need appears in a product. First question: which rule was missing, or not enforced? | DS board card |
| Design | Draft record + do/don't stories; design the constrained API if the primitives cannot express the pattern | `dev/<topic>` branch or card, Storybook preview |
| Decide | Owner sets `accepted` (or rejects with the reason on the card) | PR approval = decision log |
| Enforce | Rule ships with its enforcement in a DS release; Changelog lists rule changes by ID | Release |
| Migrate | Each consumer (CampusAgents, JLURAG, HAWKI extension) gets one card to comply | Product board cards |
| Audit | On demand, in an interactive session: scan a consumer for violations of accepted rules, findings become cards | Card per finding batch |

Per CLAUDE.md, defects in style or layout are fixed **in the design system**, never worked around in
a consumer.

## 7. What agents do with this today

- **Building UI in a consumer:** prefer a constrained pattern where one exists. With open
  primitives, follow COMPONENT_GUIDELINES.md, including its examples (e.g. dialog actions in
  `DialogFooter`).
- **Spotting a pattern defect:** report it as a candidate rule (proposed ID, one-sentence rule,
  where it was seen) on a DS card. Do not invent a local workaround.
- **Writing a rule:** use the §4 format, mark it `proposed`, and propose the strongest feasible
  enforcement level. Do not mark anything `accepted`.
- **Claiming a rule exists:** only for records that are actually in the repo. Until the registry
  exists, there are no rule IDs to cite.

## 8. Planned pilot (not started)

1. Registry skeleton (Storybook Patterns section + generated index), with `DLG-01` (actions in the
   footer) and `DLG-02` (header = eyebrow / title / description).
2. A constrained dialog pattern that renders header and footer itself. Name and API are still open
   — `// TODO: not yet decided`.
3. Migrate JLURAG `MembersModal`; check CampusAgents for the same pattern.
4. Move the existing guideline rules into records with IDs.

Open question: whether a Figma library becomes the design stage, with Storybook as the enforcement
source of truth, or Storybook serves both — `// TODO: not yet decided`.
