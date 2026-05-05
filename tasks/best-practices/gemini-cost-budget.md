# Gemini API Cost Budget & Monitoring

> **Scope:** All 7 AI edge functions calling Google Gemini.
> **Owner:** TBD | **Last updated:** 2026-04-05

---

## Current Model Usage

| Edge Function | Model | Cost Tier | Calls/Day (est.) | Tokens/Call (est.) |
|--------------|-------|-----------|-------------------|-------------------|
| `ai-chat` (x3 calls) | gemini-3-flash-preview | Low | 50-200 | ~2,000 in + ~1,000 out |
| `ai-search` (x2 calls) | gemini-3-flash-preview | Low | 30-100 | ~1,500 in + ~500 out |
| `ai-router` | gemini-3.1-flash-lite-preview | Cheapest | 50-200 | ~500 in + ~100 out |
| `ai-optimize-route` | gemini-3-flash-preview | Low | 10-30 | ~1,000 in + ~500 out |
| `ai-suggest-collections` | gemini-3-flash-preview | Low | 5-20 | ~1,000 in + ~500 out |
| `ai-trip-planner` | gemini-3.1-pro-preview | High | 5-15 | ~3,000 in + ~2,000 out |
| `rentals` | gemini-3.1-pro-preview | High | 10-30 | ~2,000 in + ~1,500 out |

---

## Budget Caps

| Metric | Soft Limit (alert) | Hard Limit (action) |
|--------|-------------------|---------------------|
| **Monthly spend** | $30 | $50 |
| **Daily tokens** | 100,000 | 200,000 |
| **Per-user daily AI calls** | 50 | Rate limited at 10/min (E3-004) |
| **Pro model daily calls** | 30 (trip-planner + rentals) | 50 |

---

## Cost Estimation Formula

```
Monthly cost ≈ (flash_tokens × $0.10/1M) + (lite_tokens × $0.05/1M) + (pro_tokens × $1.25/1M)
```

At estimated usage (200 DAU):
- Flash: ~300k tokens/day × 30 = 9M tokens/month ≈ $0.90
- Lite: ~40k tokens/day × 30 = 1.2M tokens/month ≈ $0.06
- Pro: ~60k tokens/day × 30 = 1.8M tokens/month ≈ $2.25
- **Estimated total: ~$3.20/month at 200 DAU**

At scale (2,000 DAU): multiply by ~10x → **~$32/month** (still well under $50 cap)

---

## Monitoring Implementation

### Via ai_runs table (E9-003)
Query daily spend from `ai_runs`:
```sql
SELECT
  DATE(created_at) AS day,
  agent_name,
  SUM(input_tokens + output_tokens) AS total_tokens,
  COUNT(*) AS calls
FROM ai_runs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY day, agent_name
ORDER BY day DESC;
```

### Alert Triggers (implement in E9-006)
1. **Daily token alert:** If sum(tokens) > 100,000 in a day → email admin
2. **Monthly spend alert:** If estimated spend > $30 → email admin
3. **Pro model overuse:** If pro model calls > 30/day → log warning
4. **Error spike:** If ai_runs error rate > 10% in 1 hour → alert

### Admin Dashboard (E9-006)
The `/admin/ai-monitoring` page should display:
- Daily token usage (stacked bar chart by model)
- Estimated cost (line chart, 30-day rolling)
- Top users by AI usage
- Error rate by function
- Cache hit rate (from `ai_cache` table)

---

## Cost Optimization Strategies

1. **Use cheapest model possible:** ai-router uses lite (good). Consider flash for rentals intake if quality is acceptable.
2. **Cache aggressively:** ai-search and ai-suggest-collections results are highly cacheable. Target 50%+ cache hit rate.
3. **Truncate context:** Send only last 10 conversation turns to ai-chat, not full history.
4. **Batch where possible:** ai-search can batch multiple listing descriptions in one call.
5. **Rate limit:** Already planned in E3-004 (10 AI req/min/user).
