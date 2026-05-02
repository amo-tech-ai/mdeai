# Mermaid Diagram Index — mdeai Real Estate Vertical

> Generated from: `tasks/prd-real-estate.md` (PRD v2, April 5 2026)
> Phase system per: `system.md` (PRD → Diagrams → Tasks → Roadmap → Milestones)

---

## Diagram Registry

| ID | File | Type | Phase | PRD Section | Description |
|----|------|------|-------|-------------|-------------|
| MERM-01 | `01-user-journeys.mmd` | journey | CORE | 3. Personas & journeys | Renter satisfaction scores per step (discover → book → move-in) |
| MERM-02 | `02-system-architecture.mmd` | C4Container | CORE | 5, 7. Architecture | Full system: frontend → backend → agents → data → external services |
| MERM-03 | `03-rental-pipeline.mmd` | flowchart | CORE | 6. Automations | Lead-to-lease pipeline with 3 Paperclip approval gates, color-coded |
| MERM-04 | `04-chat-flow.mmd` | sequence | CORE | 5. Agent architecture | Message lifecycle: user → router → chat → Gemini → SSE (web + WhatsApp) |
| MERM-05 | `05-intake-wizard-flow.mmd` | flowchart | CORE | 3. Journey 1, Step 1 | Wizard steps: NL input → Gemini parse → criteria badges → search |
| MERM-06 | `06-data-model.mmd` | erDiagram | CORE | 7. Technical specs | All tables: 28 existing + 6 P1 + 3 P2 + 2 P3 with relationships |
| MERM-07 | `07-agent-architecture.mmd` | flowchart | MVP | 5. Agent architecture | Paperclip org chart, adapters, task lifecycle, approval gates, heartbeats |
| MERM-08 | `08-frontend-components.mmd` | classDiagram | CORE | 4. Feature inventory | Component hierarchy: existing + P0 + P1 new components with props |
| MERM-09 | `09-edge-function-map.mmd` | flowchart | CORE | 7. New edge functions | All 16 edge functions with I/O specs, auth, models, external deps |
| MERM-10 | `10-deployment-architecture.mmd` | flowchart | PRODUCTION | 7. Deploy | Production topology: Vercel + Supabase + agents + external services |

---

## Phase Summary

| Phase | Diagrams | IDs | Milestone |
|-------|----------|-----|-----------|
| **CORE** | 8 | MERM-01 through 06, 08, 09 | Users can complete the basic rental flow end-to-end |
| **MVP** | 1 | MERM-07 | Agent trio orchestrates operations reliably |
| **ADVANCED** | 0 | — | (Add as P2/P3 features are diagrammed) |
| **PRODUCTION** | 1 | MERM-10 | System is stable under real-world usage |

---

## Traceability

| Diagram | Generates Tasks For |
|---------|-------------------|
| MERM-01 | UX flows, acceptance criteria for each journey step |
| MERM-02 | Infrastructure setup, service wiring, integration points |
| MERM-03 | Pipeline implementation: lead capture → showing → application → payment → booking |
| MERM-04 | Chat edge function enhancements, OpenClaw channel integration |
| MERM-05 | Intake wizard improvements, Gemini parsing, lead creation |
| MERM-06 | Database migrations, RLS policies, seed data, indexes |
| MERM-07 | Paperclip agent config, Hermes adapter wiring, heartbeat setup |
| MERM-08 | React component development, props interfaces, page composition |
| MERM-09 | Edge function implementation, Zod schemas, auth patterns |
| MERM-10 | Deploy pipeline, env vars, monitoring setup, VPS provisioning |

---

## Usage

Render any diagram:
```bash
# Mermaid CLI
npx -p @mermaid-js/mermaid-cli mmdc -i tasks/mermaid/03-rental-pipeline.mmd -o tasks/mermaid/03-rental-pipeline.png

# Or view in: GitHub, Obsidian, VS Code (Mermaid extension), mermaid.live
```

Next step per `system.md`: Generate task files from these diagrams, then build the roadmap.
