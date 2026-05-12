# Mastra audits folder — convention

**Always add new QA / forensic artifacts here:**  
`/home/sk/mde/tasks/prompts/mastra/audits/`

## Naming

| Kind | Pattern | Example |
|------|---------|---------|
| Task proof checklist | `{TASK-ID}-*-checklist.md` | `MASTRA-056-grounded-map-pin-category-checklist.md` |
| Verification report | `{TASK-ID}-*-verification-report.md` | `MASTRA-047-verification-report.md` |
| Cross-cutting audit | descriptive slug | `10-maps-audit.md` |

Include YAML frontmatter when useful (`id`, `title`, `created`, `related`).

## Minimum content for a checklist

1. Proof summary (checkboxes tied to task DoD).
2. Scope exclusions (what must **not** appear in the PR).
3. Copy-paste commands (`rg` / `npm run …`).
4. “Out of scope / defer” pointers to other task IDs.

Maps doc hub may link here from `tasks/prompts/mastra/maps/MAPS-DOCS-CITATIONS.md` when that file is updated.
