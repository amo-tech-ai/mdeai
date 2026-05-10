import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

export function createMemory(storage: PostgresStore): Memory {
  return new Memory({ storage });
}
