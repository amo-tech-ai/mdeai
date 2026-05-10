---
task_id: MASTRA-010
title: Mastra Memory And RAG MVP
phase: MVP
priority: P1
status: Not Started
estimated_effort: 3 days
area: mastra-memory-rag
skill: [mde-task-lifecycle, mastra, pgvector]
subagents: [backend, supabase-auditor]
edge_function: null
schema_tables: [conversations, messages, ai_memory_facts, listing_embeddings, ai_tool_audit_events]
depends_on: [MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-013, VDB-02]
blocks: []
---

<!-- task-summary -->
> **What:** Add safe Mastra memory and RAG for mdeAI concierge knowledge, user preferences, and domain context.
> **Why:** Users should not repeat rental, event, and restaurant preferences, but PII-heavy memory must stay controlled by Supabase/RLS.
> **Delivers:** Memory/RAG plan, safe memory tools, Mastra Core `examples/rag-*` adaptation notes, and retrieval tests.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `pgvector`
> **MVP · P1 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-013, VDB-02

# Mastra Memory And RAG MVP

## Easy Summary

**Purpose:** let Mastra remember useful preferences and retrieve trusted mdeAI knowledge.

**Goals:** use Supabase pgvector/RLS for memory, adapt **Mastra Core RAG primitives** from [`mastra-ai/mastra/examples/rag-*`](https://github.com/mastra-ai/mastra/tree/main/examples) (chunking, embedding, retrieval), and avoid storing sensitive raw transcripts. Do **not** use `docs-chatbot-example` or `template-docs-chatbot` as the RAG source — both are MCP/CopilotKit integrations, not pgvector RAG (verified in [23-doc §A](../notes/23-mastra-modules-verified.md#a-verification-findings-the-corrections-that-matter)).

**Success criteria:** chat can recall safe preferences and cite retrieved knowledge without leaking PII or hallucinating sources.

**Production-ready checklist:**

- Supabase remains memory source of truth.
- User memory is RLS-scoped.
- Raw sensitive transcripts are not stored as long-term memory by default.
- RAG answers cite source records or docs.
- Memory expiry/delete path is documented.

## Description

Implement the first safe memory/RAG layer for Mastra. Pull RAG primitives (chunking, embedding, retrieval) from the official Mastra Core `examples/rag-*` directory and Mastra's RAG/memory docs. Adapt storage to Supabase pgvector and mdeAI's privacy requirements. The earlier reference to `docs-chatbot-example` was retired on 2026-05-10 — that repo is a Next.js + CopilotKit integration sample, not a pgvector RAG reference.

## Acceptance Criteria

- [ ] Verify current Mastra memory/RAG docs before implementation.
- [ ] Create a memory design note at `/home/sk/mde/tasks/mastra/mastra-memory-rag-design.md`.
- [ ] Add safe memory tools for reading/writing user preferences and conversation summaries.
- [ ] Add RAG retrieval for mdeAI docs/domain knowledge with citations.
- [ ] Ensure memory writes use audit events from MASTRA-003.
- [ ] Add tests for preference recall, RLS-safe user isolation, no raw PII memory, and cited retrieval.
- [ ] Add fixture queries for rentals, events, and restaurants.
- [ ] Document when to use memory, when to forget, and how to delete.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Design | `tasks/mastra/mastra-memory-rag-design.md` | Create architecture note |
| Mastra tools | `my-mastra-app/src/mastra/tools/memory.ts` | Add safe memory tools |
| Mastra RAG | `my-mastra-app/src/mastra/rag/**` | Add retrieval helpers based on Mastra Core `examples/rag-*` patterns |
| Supabase | VDB-02 memory tables/RPCs | Reuse or block until present |
| Tests | `my-mastra-app/**` | Add memory and retrieval tests |

## Verification

Run:

```bash
npm run test -- --run
npm run build
test -f /home/sk/mde/tasks/mastra/mastra-memory-rag-design.md
rg -n "memory|RAG|citation|ai_memory_facts" my-mastra-app supabase tasks/mastra
```
