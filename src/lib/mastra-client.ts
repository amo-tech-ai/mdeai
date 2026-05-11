import { MastraClient } from '@mastra/client-js';

const baseUrl = import.meta.env.VITE_MASTRA_SERVER_URL ?? 'http://localhost:4111';

export const mastraClient = new MastraClient({
  baseUrl,
  retries: 2,
  backoffMs: 300,
  maxBackoffMs: 3000,
});

export type MastraStreamCallbacks = {
  onText: (chunk: string) => void;
  onDone: () => void;
  onError: (err: unknown) => void;
};

export type MastraStreamOptions = {
  threadId?: string;
  resourceId?: string;
};

export type MastraMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Stream a message to the concierge agent and receive text chunks via callbacks.
 *
 * Uses processDataStream() — the official @mastra/client-js streaming API.
 * Streaming continues until the agent finishes; callers must not call onDone manually.
 */
export async function streamConcierge(
  messages: string | MastraMessage[],
  options: MastraStreamOptions,
  callbacks: MastraStreamCallbacks,
): Promise<void> {
  try {
    const agent = mastraClient.getAgent('concierge-agent');

    const streamOptions: Record<string, unknown> = {};
    if (options.threadId && options.resourceId) {
      streamOptions.memory = {
        thread: options.threadId,
        resource: options.resourceId,
      };
    }

    const response = await agent.stream(messages, streamOptions);

    await response.processDataStream({
      onTextPart: (text: string) => {
        callbacks.onText(text);
      },
    });

    callbacks.onDone();
  } catch (err) {
    callbacks.onError(err);
  }
}

/**
 * One-shot generate (no streaming). Returns the full text response.
 */
export async function generateConcierge(
  messages: string | MastraMessage[],
  options: MastraStreamOptions = {},
): Promise<string> {
  const agent = mastraClient.getAgent('concierge-agent');

  const genOptions: Record<string, unknown> = {};
  if (options.threadId && options.resourceId) {
    genOptions.memory = {
      thread: options.threadId,
      resource: options.resourceId,
    };
  }

  const response = await agent.generate(messages, genOptions);
  return response.text;
}
