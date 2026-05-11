import { Mastra } from '@mastra/core/mastra';
import { MastraEditor } from '@mastra/editor';
import { PinoLogger } from '@mastra/loggers';
import { Observability, DefaultExporter, SensitiveDataFilter } from '@mastra/observability';
import { chatRoute } from '@mastra/ai-sdk';
import { MastraAuthSupabase } from '@mastra/auth-supabase';
import { VercelDeployer } from '@mastra/deployer-vercel';
import { createPostgresStore } from './storage/config';
import { weatherWorkflow } from './workflows/weather-workflow';
import { rentalSearchWorkflow } from './workflows/rental-search-workflow';
import { eventDiscoveryWorkflow } from './workflows/event-discovery-workflow';
import { conciergeRoutingWorkflow } from './workflows/concierge-routing-workflow';
import { weatherAgent } from './agents/weather-agent';
import { pingAgent } from './agents/ping';
import { routerAgent } from './agents/router';
import { conciergeAgent } from './agents/concierge';
import { rentalAgent } from './agents/rental-agent';
import { eventAgent } from './agents/event-agent';
import { evaluationAgent } from './agents/evaluation';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';

const storage = createPostgresStore();

// chatRoute() exposes POST /chat for the official AI SDK useChat hook pattern.
// Frontend: useChat({ transport: new DefaultChatTransport({ api: 'http://localhost:4111/chat' }) })
// Passes memory via prepareSendMessagesRequest: { body: { messages: [last], memory: { thread, resource } } }
const conciergeChat = chatRoute({
  path: '/chat',
  agent: 'concierge-agent',
});

// Auth: production-only so local Mastra Studio and smoke tests work without a JWT.
// authorizeUser: any verified Supabase session is accepted — no isAdmin requirement.
// Set SUPABASE_URL + SUPABASE_ANON_KEY in Vercel env vars to activate.
const auth =
  process.env.NODE_ENV === 'production' &&
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_ANON_KEY
    ? new MastraAuthSupabase({
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        authorizeUser: async (user) => !!user?.id,
        mapUserToResourceId: (user) => user.id,
      })
    : undefined;

export const mastra = new Mastra({
  workflows: { weatherWorkflow, rentalSearchWorkflow, eventDiscoveryWorkflow, conciergeRoutingWorkflow },
  agents: { weatherAgent, pingAgent, routerAgent, conciergeAgent, rentalAgent, eventAgent, evaluationAgent },
  editor: new MastraEditor(),
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage,
  server: {
    ...(auth ? { auth } : {}),
    apiRoutes: [conciergeChat],
    cors: {
      origin: ['https://www.mdeai.co', 'http://localhost:8080', 'http://localhost:5173'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type'],
      credentials: true,
    },
    mcpOptions: { serverless: true },
  },
  // VercelDeployer: used by `mastra build` only — no effect on local `mastra dev`.
  deployer: new VercelDeployer({
    studio: true,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  // DefaultExporter uses the PostgresStore (ObservabilityPG domain) — no DuckDB involved.
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mdeai-mastra',
        exporters: [
          new DefaultExporter(),
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(),
        ],
      },
    },
  }),
});

export { storage };
