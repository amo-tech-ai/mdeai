import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const pingTool = createTool({
  id: 'ping',
  description: 'Returns ok — used for health checks only.',
  inputSchema: z.object({}),
  outputSchema: z.object({ ok: z.boolean(), ts: z.string() }),
  execute: async () => ({ ok: true, ts: new Date().toISOString() }),
});

export const pingAgent = new Agent({
  id: 'ping-agent',
  name: 'Ping Agent',
  instructions: 'You are a health check agent. When asked to ping, call the ping tool and return its result.',
  model: 'google/gemini-3.1-flash-lite',
  tools: { pingTool },
});
