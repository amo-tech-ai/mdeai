import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const intentSchema = z.enum(['rental_search', 'event_discovery', 'chitchat', 'unknown']);

const classifyIntentTool = createTool({
  id: 'classify-intent',
  description: 'Pick exactly one intent label that matches the user message.',
  inputSchema: z.object({
    intent: intentSchema,
    confidence: z.number().min(0).max(1),
    reason: z.string().describe('one short sentence'),
  }),
  outputSchema: z.object({
    intent: intentSchema,
    confidence: z.number().min(0).max(1),
    reason: z.string(),
  }),
  execute: async (input: { intent: z.infer<typeof intentSchema>; confidence: number; reason: string }) => input,
});

export const routerAgent = new Agent({
  id: 'router-agent',
  name: 'Router Agent',
  instructions: `You classify mdeAI user messages into exactly one intent so the right downstream agent can handle them.

Intents:
- rental_search: user wants to find/book a Medellín apartment ("2BR in Poblado under 100", "where can I stay")
- event_discovery: user wants to find/buy a Medellín event ticket ("salsa night", "what's on this weekend")
- chitchat: greeting, thanks, vague help request
- unknown: anything you cannot map confidently to the three labels above

Always call classify-intent with one label and a short reason. Never invent a fifth intent.`,
  model: 'google/gemini-2.5-flash-lite',
  tools: { classifyIntentTool },
});
