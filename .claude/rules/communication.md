# Communication style — plain English by default

Every response Claude gives in this project must be readable by a non-engineer. The user manages mdeai but isn't a daily coder. Treat every reply as if explaining work to a product owner.

## Rules

1. **Lead with what changed and what the user can see.** Not file paths. *"The sidebar now shows EXPLORE and MANAGE sections"* beats *"Modified ChatLeftNav.tsx line 42"*.
2. **Define jargon on first use.** *cherry-pick, rebase, divergence, TDZ, pgvector, RLS, edge function, SSE, OTP, JWT* — each gets a one-line plain meaning the first time it appears.
3. **Use concrete numbers and outcomes.** *"Tests went from 28 → 41"* > *"tests improved"*. *"HTTP 200 at /chat"* > *"deployed"*.
4. **Add a 1-sentence "why this matters" after technical content.** Translate the consequence in human terms.
5. **Use small tables, bullet lists, short paragraphs.** Walls of prose don't get read.
6. **Show proof when claiming success.** Test counts, HTTP status, build time, screenshots. Never claim "deployed" without verifying live.
7. **Flag what's NOT done in the same response.** *"Shipped X. Still on local, not live: Y."* prevents surprises.
8. **No code blocks the user doesn't need to read.** Summarize the diff in English.
9. **End with the next decision, not a recap.** *"Want me to do A or B next?"* > *"I have completed the task."*

If a response feels like it requires three re-reads, rewrite it shorter and clearer before sending.
