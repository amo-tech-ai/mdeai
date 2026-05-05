# Instagram Command Map

Use this file when the user request is specific enough that you need to choose between similar Instagram commands.

## Account-Level Commands

| Command | Use when | Typical input | What it achieves | Typical follow-up |
| --- | --- | --- | --- | --- |
| `instagram profiles get` | Inspect an account as a whole | Handle | Fetch the main profile view for a creator or brand account | `instagram posts`, `instagram reels`, `instagram highlights`, `instagram embed` |
| `instagram profiles basic` | Revisit a known account cheaply after another step returned `user-id` | User ID | Fetch a lighter profile response when the workflow already knows the account ID | Another account-level command that accepts `--user-id` |
| `instagram embed` | Produce embed-oriented output instead of analysis | Handle | Retrieve embeddable profile markup | Pass markup downstream to a web or content workflow |

## Content Collection Commands

| Command | Use when | Typical input | What it achieves | Typical follow-up |
| --- | --- | --- | --- | --- |
| `instagram posts` | Collect a creator's regular feed posts | Handle, optional `next_max_id` | Page through posts from an account | `instagram posts get`, `instagram comments` |
| `instagram reels` | Collect a creator's reels library | Handle or user ID, optional `max_id` | Page through reels from an account | `instagram posts get`, `instagram comments`, `instagram transcript` |
| `instagram highlights` | See which story highlights an account exposes | Handle or user ID | List highlight groups for an account | `instagram highlights detail` |
| `instagram highlights detail` | Open one highlight after the list step | Highlight ID | Fetch the contents of a specific highlight | Media-specific downstream processing |

## Single-Item Commands

| Command | Use when | Typical input | What it achieves | Typical follow-up |
| --- | --- | --- | --- | --- |
| `instagram posts get` | Inspect one post or reel deeply | Post or reel URL | Fetch detailed information for a single piece of content | `instagram comments`, `instagram transcript` |
| `instagram comments` | Measure reactions on one post or reel | Post or reel URL, optional `cursor` | Fetch comments and paginate deeper if needed | Sentiment analysis, FAQ extraction, audience research |
| `instagram transcript` | Extract spoken text from video content | Post or reel URL | Return transcript data for media with speech | Quoting, summarization, topic extraction |

## Discovery Commands

| Command | Use when | Typical input | What it achieves | Typical follow-up |
| --- | --- | --- | --- | --- |
| `instagram reels search` | Find reels about a topic, keyword, or niche | Query, optional page number | Discover reels beyond a single account | `instagram posts get`, `instagram comments` |

## Selection Heuristics

- Use `--trim` first on commands that support it when speed and compact output matter more than full payload shape.
- Use URL-based commands when the user already supplied a specific Instagram link.
- Use ID-based commands only after another command has surfaced the ID; do not force that shape up front.
- Reuse pagination fields exactly as returned by the API. Do not invent cursor names across commands.
- Start broad, then narrow: account command first, single-item command second, comments or transcript third.

## Example Request Routing

- "Summarize this creator's Instagram presence" -> `instagram profiles get`, then `instagram posts` or `instagram reels`
- "Give me details for this reel" -> `instagram posts get`
- "Pull the comments from this giveaway post" -> `instagram comments`
- "Find reels about cold plunge routines" -> `instagram reels search`
- "What are this creator's story highlights?" -> `instagram highlights`, then `instagram highlights detail`
- "Get the spoken lines from this reel" -> `instagram transcript`
