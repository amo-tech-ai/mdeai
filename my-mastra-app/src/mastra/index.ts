import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { Observability, DefaultExporter, SensitiveDataFilter } from '@mastra/observability';
import { MastraAuthSupabase } from '@mastra/auth-supabase';
import { createPostgresStore } from './storage/config';
import { workspace } from './workspaces';
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

const auth =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? new MastraAuthSupabase({
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        mapUserToResourceId: (user) => user.id,
      })
    : undefined;

export const mastra = new Mastra({
  workflows: { weatherWorkflow, rentalSearchWorkflow, eventDiscoveryWorkflow, conciergeRoutingWorkflow },
  agents: { weatherAgent, pingAgent, routerAgent, conciergeAgent, rentalAgent, eventAgent, evaluationAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage,
  workspace,
  ...(auth ? { server: { auth } } : {}),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mdeai-mastra',
        exporters: [new DefaultExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});

export { storage, workspace };

export { workspaceBasePath } from './workspaces';
