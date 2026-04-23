import { ChatCanvas } from '@/components/chat/ChatCanvas';

/**
 * The root page at `mdeai.co/` — chat-first landing canvas.
 *
 * Users arrive on the chat, not a marketing page. Marketing content moved to
 * `/welcome` for linking; SEO-indexable pages (`/apartments`, `/events`, etc.)
 * stay for crawlers but point users back to chat via "Ask mdeai →" CTAs.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Mon.
 */
export default function Home() {
  return <ChatCanvas defaultTab="concierge" />;
}
