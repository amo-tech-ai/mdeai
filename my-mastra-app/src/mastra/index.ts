import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { DuckDBStore } from '@mastra/duckdb';
import { Observability, DefaultExporter, SensitiveDataFilter } from '@mastra/observability';
import { createPostgresStore } from './storage/config';
import { weatherWorkflow } from './workflows/weather-workflow';
import { rentalSearchWorkflow } from './workflows/rental-search-workflow';
import { eventDiscoveryWorkflow } from './workflows/event-discovery-workflow';
import { weatherAgent } from './agents/weather-agent';
import { pingAgent } from './agents/ping';
import { routerAgent } from './agents/router';
import { conciergeAgent } from './agents/concierge';
import { evaluationAgent } from './agents/evaluation';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';

const storage = createPostgresStore();

export const mastra = new Mastra({
  workflows: { weatherWorkflow, rentalSearchWorkflow, eventDiscoveryWorkflow },
  agents: { weatherAgent, pingAgent, routerAgent, conciergeAgent, evaluationAgent },
  scorers: { toolCallAppropriatenessScorer, completenessScorer, translationScorer },
  storage,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
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
