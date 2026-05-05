# Gemini API Setup

> Merged from: api-key.md, quickstart.md, libraries.md

## SDK Installation

### JavaScript/TypeScript (Deno Edge Functions)

```typescript
// Deno import (pinned version)
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";
```

### JavaScript/TypeScript (Node.js)

```bash
npm install @google/genai
```

### Python

```bash
pip install -q -U google-genai
```

## API Key Setup

### Environment Variable (Recommended)

Set `GEMINI_API_KEY` or `GOOGLE_API_KEY`. If both are set, `GOOGLE_API_KEY` takes precedence.

```bash
# Linux/macOS
export GEMINI_API_KEY=<YOUR_API_KEY>
```

### Explicit API Key

**JavaScript SDK:**
```typescript
const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });
```

**Deno Edge Function:**
```typescript
const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });
```

**Python SDK:**
```python
from google import genai
client = genai.Client(api_key="YOUR_API_KEY")
```

### REST API (Header Authentication)

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{ "contents": [{ "parts": [{ "text": "Hello" }] }] }'
```

**IMPORTANT:** Always pass the API key via the `x-goog-api-key` header, NOT as a query parameter (`?key=`). Query parameters expose the key in server logs and referrer headers.

## Security Rules

- **Never commit API keys to source control**
- **Never expose API keys client-side** in web or mobile apps
- **Use server-side calls** (Edge Functions) to keep keys confidential
- **Restrict access** to specific IPs or APIs where possible
- **Rotate keys** periodically

## SDK Libraries (GA as of May 2025)

| Language | Package | Install |
|----------|---------|---------|
| Python | `google-genai` | `pip install google-genai` |
| JavaScript/TS | `@google/genai` | `npm install @google/genai` |
| Go | `google.golang.org/genai` | `go get google.golang.org/genai` |
| Java | `google-genai` | Maven dependency |
| C# | `Google.GenAI` | `dotnet add package Google.GenAI` |

### Legacy Libraries (Deprecated Nov 2025)

| Language | Legacy | Replacement |
|----------|--------|-------------|
| Python | `google-generativeai` | `google-genai` |
| JS/TS | `@google/generativeai` | `@google/genai` |
| Go | `google.golang.org/generative-ai` | `google.golang.org/genai` |

### Code Generation Tips

AI code generators may produce code using deprecated libraries. When prompting for Gemini code, include:
- Use `@google/genai` (not `@google/generativeai`)
- Use `npm:@google/genai@^1.0.0` for Deno
- Python: `google-genai` (not `google-generativeai`)

## First Request

### JavaScript SDK

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "Explain how AI works in a few words",
});
console.log(response.text);
```

### REST

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{ "text": "Explain how AI works in a few words" }]
    }]
  }'
```

### Python SDK

```python
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain how AI works in a few words"
)
print(response.text)
```
