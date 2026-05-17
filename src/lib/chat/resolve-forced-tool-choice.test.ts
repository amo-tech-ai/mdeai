import { describe, expect, it } from 'vitest';
import {
  buildToolChoice,
  resolveForcedToolName,
} from '../../../supabase/functions/_shared/chat-tool-choice.ts';

describe('resolveForcedToolName (MAPS-SEE-ALL rental routing)', () => {
  it('routes "Show me 5 rentals in Laureles with map pins" to search_apartments', () => {
    const prompt = 'Show me 5 rentals in Laureles with map pins';
    expect(resolveForcedToolName(prompt)).toBe('search_apartments');
    const choice = buildToolChoice(prompt) as {
      type: string;
      function: { name: string };
    };
    expect(choice.function.name).toBe('search_apartments');
  });

  it('does not force events for bare "show" in rental phrasing', () => {
    expect(resolveForcedToolName('Show me 5 rentals in Laureles')).toBe(
      'search_apartments',
    );
  });

  it('still forces events for explicit event queries', () => {
    expect(resolveForcedToolName('What events are on this weekend?')).toBe(
      'search_events',
    );
  });
});
