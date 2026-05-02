# Strict PRD schema (executive / stakeholder-ready)

Use when the output must look like a classic product PRD: exec summary, personas, phased rollout, risks.

## PRD quality

Use concrete, measurable criteria. Avoid "fast", "easy", or "intuitive".

```diff
# Vague (BAD)
- The search should be fast and return relevant results.

# Concrete (GOOD)
+ The search must return results within 200ms for a 10k record dataset.
+ Precision@10 >= 85% on the agreed benchmark set.
```

## Output structure (required)

### 1. Executive summary

- **Problem statement**: 1–2 sentences.
- **Proposed solution**: 1–2 sentences.
- **Success criteria**: 3–5 measurable KPIs.

### 2. User experience and functionality

- **User personas**
- **User stories**: `As a [user], I want to [action] so that [benefit].`
- **Acceptance criteria** per story
- **Non-goals**

### 3. AI system requirements (if applicable)

- **Tools / APIs**
- **Evaluation strategy** (quality, safety, cost)

### 4. Technical specifications

- **Architecture overview** (data flow, components)
- **Integration points** (APIs, DB, auth)
- **Security and privacy**

### 5. Risks and roadmap

- **Phased rollout** (MVP → v1 → v2)
- **Technical risks** (latency, cost, dependencies)

## DO / DON'T

- **DO**: define how AI features are tested; iterate with section-level review.
- **DON'T**: skip discovery; invent stack constraints — mark **TBD** and ask.

## Short example (search)

**Problem**: Users cannot find docs in large repos.  
**Solution**: NL Q&A with citations.  
**Success**: −50% time to answer; citation accuracy ≥ 95%.

**Story**: As a developer, I want to ask questions in plain language so I skip keyword guessing.  
**AC**: multi-turn clarification; code blocks with copy; citations on every answer.

**AI**: tools `codesearch`, `grep`, `fetch`. **Eval**: 50-question benchmark, 90% citation match.
