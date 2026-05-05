# How to verify each prompt task is “correct”

Use this when **reviewing** or **authoring** files under `tasks/prompts/`. “Correct” means: **executable by an engineer or agent without guessing**, **aligned with `system.md` + diagrams where claimed**, and **checkable** against skills and repo rules.

---

## 1. Load the task-system skill first

| Skill | Path | Why |
|-------|------|-----|
| **mdeai tasks** | `.claude/skills/tasks/SKILL.md` | Phase system (CORE/MVP/ADVANCED/PRODUCTION), diagram-first rule, naming (`EX-NNN`, epic folders), optional `skills:` on tasks |

If the prompt is **implementation-shaped**, also load **mde-writing-plans** (`.claude/skills/mde-writing-plans/SKILL.md`) for acceptance criteria and verification wording.

---

## 2. Per-prompt verification loop (do in order)

| Step | Check | Pass criteria |
|------|--------|----------------|
| **A. Structure** | Frontmatter `yaml` blocks for each subtask (`id`, `diagram_id`, `phase`, `dependencies`, **`description`**, etc.) | Valid YAML; IDs unique within the file; phase matches folder (`core/` → CORE, etc.). **`description`** = one line, real-world outcome (“what ships”)—see `scripts/inject-yaml-description-core-prompts.py` for `core/` auto-fill from `title`. |
| **B. Diagram traceability** | If `diagram_id: MERM-XX` is set | `tasks/mermaid/INDEX.md` (or the `.mmd` file) references the same ID — **or** the prompt states an explicit **exception** to `system.md` (see audit `11-system-audit.md`). |
| **C. Dependencies** | `dependencies: []` or lists task IDs | No impossible order (e.g. WA search before security); matches epic order in `tasks/roadmap.md` where relevant. |
| **D. Acceptance criteria** | Bullets under **Acceptance Criteria** | Each item is **observable** (command, table, UI behavior, or “link to PR”); avoid-only vague “should work”. |
| **E. Skills / read-first** | `skill:` in YAML and/or **Read first** section | Implementer knows which skill bundle to open; for Edge/DB prompts, **Read first** includes `supabase/functions/` or `supabase/migrations/` as appropriate. |
| **F. Repo reality** | Cross-check `CLAUDE.md`, `tasks/audit/09-full-system-audit.md` or newer audits | Security/data blockers cited where the prompt touches prod, payments, or WA. |
| **G. Index consistency** | If the file is listed in `INDEX.md` | Path, phase label, and **file counts** in `INDEX.md` stay consistent (reconcile “19 vs 20” CORE rows when editing). |

---

## 3. Skill + rule routing by prompt theme

Use these **in addition to** `mdeai-tasks` when verifying content quality.

| Theme / epic area | Load | Also read |
|-------------------|------|-----------|
| **Edge functions, JWT, CORS, Zod** | `.claude/skills/supabase/supabase-edge-functions/SKILL.md` | `.cursor/rules/supabase/writing-supabase-edge-functions.mdc`, `tasks/prompts/reference/VERIFY-supabase-postgres-edge.md` |
| **Postgres, RLS, migrations** | Use **supabase-postgres-best-practices** (Cursor rule: `supabase-postgres-best-practices.mdc` if present) | Same **VERIFY** doc § Postgres |
| **Gemini / AI edge** | `.claude/skills/gemini/SKILL.md` | `core/13E-gemini-g1g5-edge-acceptance-audit.md` for G1–G5 alignment |
| **Rentals, CRM, pipeline, leads** | `.claude/skills/real-estate/SKILL.md` | `tasks/prd-real-estate.md` sections referenced by the prompt |
| **Hermes** | `.claude/skills/hermes/SKILL.md` | Disambiguate CLI vs edge ranking in prose |
| **OpenClaw / WhatsApp** | `.claude/skills/open-claw/SKILL.md` | `advanced/08F-whatsapp-ingress-architecture.md` and Infobip vs OpenClaw ADRs |
| **Paperclip** | `.claude/skills/paper-clip/SKILL.md` | Only for **advanced/05\*** tasks; do not assume Paperclip is wired in prod |
| **Roadmap / sequencing** | `.claude/skills/roadmap/SKILL.md` | `tasks/roadmap.md` Now/Next vs prompt priority |
| **Diagrams referenced in prompt** | `.claude/skills/mermaid-diagrams/SKILL.md` | `tasks/mermaid/*.mmd` named in the prompt |
| **PRD-style scope** | `.claude/skills/prd/SKILL.md` | When a prompt is missing outcomes or acceptance tests |

**Agents skills (optional):** `.agents/skills/` mirrors some of the above (e.g. `supabase-edge-functions`, `real-estate-expert`, `roadmap-planning`) — use the same **topic**, either `.claude/skills/*` or `.agents/skills/*`, not both for the same review unless you are diffing them.

---

## 4. Quick “correctness” rubric by file type

| File pattern | Must have |
|--------------|-----------|
| `01E-*`, `02E-*`, `03E-*` | Data model / pipeline / security tied to migrations or `supabase/`; **03E** cites JWT + Zod + rate limits |
| `04E-*`, `04A-*`, `14A-*` | UI routes/components named or discoverable in `src/` |
| `08*` WhatsApp | Webhook/signature story; **no** production WA without **03E** gate if the prompt implies production |
| `10*` CRM | Envelope shape (`src/lib/p1-crm-*`) and dashboard routes; deploy smoke steps |
| `13*` docs / hygiene | **Real** paths; RICE/DoD templates that match `tasks/` layout |
| `advanced/05*`, `06*`, `08*` | Trio / Hermes / OpenClaw language matches **current** wiring (see audits — often **aspirational**; label clearly) |
| `reference/*` | **VERIFY** and search stack: used as **checklists**, not duplicated epic tasks |

---

## 5. What NOT to do

- Treat **PRD prose** as the only source of truth when the prompt has a **diagram_id** — **diagram** wins per `system.md`.
- Mark **(done)** in `INDEX.md` without a **link** to commit, PR, or checklist evidence (see audit `11-system-audit.md`).
- Leave **two truths** between `tasks/prompts/core/*` and `tasks/prompts/originals/*` — **phase folder is source of truth** per `INDEX.md`.

---

## 6. Product success (goals → shippable features)

“Correct” (§2) is necessary but not sufficient. A prompt should also make it **likely the work becomes a successful feature**: travelers or ops get a **clear win**, and the team can **prove** it without debate.

| Layer | What to require in the prompt | Why |
|--------|-------------------------------|-----|
| **Goal** | One **outcome** sentence: *who* (renter, host, ops), *what* changes in the world (not “add endpoint”). | Stops implementation that technically passes AC but misses the point. |
| **Journey** | **Happy path** in 3–5 steps (UI, API, or WA message sequence) from open task to done. | Catches scope that stops halfway (e.g. DB row with no UI). |
| **Proof** | **Evidence** tied to ACs: command + expected output, screenshot path, table row shape, or E2E name — plus **failure** behavior (empty, 401, 500). | “Successful” = demonstrable, not “merged.” |
| **Gates** | Explicit **blockers** when relevant: 03E before prod WA, seed before listings, idempotency on money (cite `tasks/audit/*` or `CLAUDE.md`). | Avoids shipping features on a hollow or unsafe base (see `tasks/audit/11-system-audit.md`). |
| **Done = done** | Rollout note: feature flag, kill switch, or “internal only until X.” | Separates **code complete** from **safe to expose**. |

**Authoring shortcut:** Under **Acceptance Criteria**, prefix 1–2 items with **Goal:** and **Proof:** so agents don’t optimize for the wrong bar.

**Review shortcut (stop-time / Codex):** If a task touches user-visible flows, ask: *Would a PM agree this prompt, if executed fully, delivers the named outcome with evidence?* If not, tighten Goal + Proof before merge.

---

## 7. Minimal automation (optional)

- Run link checker on **Read first** paths in a prompt file.
- Grep for `diagram_id:` and verify IDs exist under `tasks/mermaid/`.
- For Edge prompts: confirm every named function still exists under `supabase/functions/`.

---

*This doc is the **verification layer** for `tasks/prompts/`; it does not replace running tests or migrations.*
