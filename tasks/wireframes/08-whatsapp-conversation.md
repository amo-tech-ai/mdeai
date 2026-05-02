# 08 — WhatsApp Rental Chat

Phone-style wireframe showing WhatsApp conversation with AI concierge.

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ ◀  mdeai AI Concierge  ✓  │ │
│ │    online                  │ │
│ │    (verified business)     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ─ ─ ─ Today, 10:32 AM ─ ─ ─ ─  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ 👋 Hey John! I'm your    │     │
│ │ Medellín rental AI       │     │
│ │ concierge. I can help    │     │
│ │ you find apartments,     │     │
│ │ schedule showings, and   │     │
│ │ apply — all right here   │     │
│ │ in WhatsApp.             │     │
│ │                          │     │
│ │ What are you looking     │     │
│ │ for?                     │     │
│ └─────────────────────────┘     │
│  10:32 AM ✓✓                    │
│                                 │
│     ┌─────────────────────────┐ │
│     │ Looking for a 2BR       │ │
│     │ apartment in Laureles   │ │
│     │ or Poblado              │ │
│     └─────────────────────────┘ │
│                    10:33 AM ✓✓  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Great choice! Both are   │     │
│ │ popular with expats.     │     │
│ │                          │     │
│ │ What's your monthly      │     │
│ │ budget?                  │     │
│ └─────────────────────────┘     │
│  10:33 AM ✓✓                    │
│                                 │
│ ┌───────────┐┌────────────┐     │
│ │ Under $800││ $800-$1200 │     │
│ └───────────┘└────────────┘     │
│ ┌────────────┐┌───────────┐     │
│ │ $1200-$1800││  $1800+   │     │
│ └────────────┘└───────────┘     │
│ (WhatsApp quick reply buttons)  │
│                                 │
│     ┌─────────────────────────┐ │
│     │ $800 per month          │ │
│     └─────────────────────────┘ │
│                    10:34 AM ✓✓  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Got it — $800/mo budget, │     │
│ │ 2BR in Laureles or       │     │
│ │ Poblado.                 │     │
│ │                          │     │
│ │ Any must-have amenities? │     │
│ └─────────────────────────┘     │
│  10:34 AM ✓✓                    │
│                                 │
│ ┌────────┐┌──────┐┌──────┐     │
│ │Fast WiFi││ Pool ││ Gym  │     │
│ └────────┘└──────┘└──────┘     │
│ ┌─────────┐┌─────────────┐     │
│ │ Parking ││ All good ✓  │     │
│ └─────────┘└─────────────┘     │
│                                 │
│     ┌─────────────────────────┐ │
│     │ Need fast WiFi for      │ │
│     │ remote work             │ │
│     └─────────────────────────┘ │
│                    10:35 AM ✓✓  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Perfect! I found 3       │     │
│ │ apartments that match.   │     │
│ │ Here are your top picks: │     │
│ └─────────────────────────┘     │
│  10:35 AM ✓✓                    │
│                                 │
│ ┌─────────────────────────┐     │
│ │ ┌───────────────────┐   │     │
│ │ │                   │   │     │
│ │ │   PROPERTY IMAGE  │   │     │
│ │ │                   │   │     │
│ │ └───────────────────┘   │     │
│ │                         │     │
│ │ 1️⃣ Modern Loft          │     │
│ │ 📍 Poblado              │     │
│ │ 💰 $800/mo              │     │
│ │ 🛏 2 bed · 🚿 1 bath     │     │
│ │ 📶 120 Mbps WiFi        │     │
│ │ ✨ Listed 2 days ago     │     │
│ │                         │     │
│ │ [View Details]          │     │
│ └─────────────────────────┘     │
│  10:35 AM ✓✓                    │
│                                 │
│ ┌─────────────────────────┐     │
│ │ ┌───────────────────┐   │     │
│ │ │   PROPERTY IMAGE  │   │     │
│ │ └───────────────────┘   │     │
│ │                         │     │
│ │ 2️⃣ Laureles Hideaway    │     │
│ │ 📍 Laureles             │     │
│ │ 💰 $750/mo              │     │
│ │ 🛏 2 bed · 🚿 1 bath     │     │
│ │ 📶 80 Mbps WiFi         │     │
│ │ ✨ Listed 5 days ago     │     │
│ │                         │     │
│ │ [View Details]          │     │
│ └─────────────────────────┘     │
│  10:35 AM ✓✓                    │
│                                 │
│ ┌─────────────────────────┐     │
│ │ ┌───────────────────┐   │     │
│ │ │   PROPERTY IMAGE  │   │     │
│ │ └───────────────────┘   │     │
│ │                         │     │
│ │ 3️⃣ Cozy Poblado Studio  │     │
│ │ 📍 Poblado              │     │
│ │ 💰 $780/mo              │     │
│ │ 🛏 2 bed · 🚿 1 bath     │     │
│ │ 📶 100 Mbps WiFi        │     │
│ │ ✨ Listed 1 week ago     │     │
│ │                         │     │
│ │ [View Details]          │     │
│ └─────────────────────────┘     │
│  10:36 AM ✓✓                    │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Reply with the number   │     │
│ │ (1, 2, or 3) to see     │     │
│ │ more details, or tell   │     │
│ │ me what to adjust!      │     │
│ └─────────────────────────┘     │
│  10:36 AM ✓✓                    │
│                                 │
│     ┌─────────────────────────┐ │
│     │ 1                       │ │
│     └─────────────────────────┘ │
│                    10:37 AM ✓✓  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ 🏠 Modern Loft — Full    │     │
│ │ Details                  │     │
│ │                          │     │
│ │ 📍 Calle 10 #43-12,     │     │
│ │    El Poblado            │     │
│ │ 💰 $800/month            │     │
│ │ 📐 65 m² · Floor 8      │     │
│ │ 🛏 2 bedrooms            │     │
│ │ 🚿 1 bathroom            │     │
│ │ 📶 120 Mbps fiber WiFi   │     │
│ │                          │     │
│ │ Amenities: WiFi, Pool,   │     │
│ │ Gym, Parking, AC,        │     │
│ │ Balcony, 24/7 Security   │     │
│ │                          │     │
│ │ 🌟 This is the best WiFi │     │
│ │ match for remote work!   │     │
│ │                          │     │
│ │ Available: June 1, 2026  │     │
│ └─────────────────────────┘     │
│  10:37 AM ✓✓                    │
│                                 │
│ ┌─────────────────────────┐     │
│ │ Want to schedule a       │     │
│ │ showing?                 │     │
│ └─────────────────────────┘     │
│  10:37 AM ✓✓                    │
│                                 │
│ ┌───────────────┐┌────────────┐ │
│ │ Yes, schedule!││ More info  │ │
│ └───────────────┘└────────────┘ │
│ ┌───────────────┐               │
│ │ Show me others│               │
│ └───────────────┘               │
│                                 │
│     ┌─────────────────────────┐ │
│     │ Yes, schedule!          │ │
│     └─────────────────────────┘ │
│                    10:38 AM ✓✓  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ 📅 Great! Here are       │     │
│ │ available times this     │     │
│ │ week:                    │     │
│ │                          │     │
│ │ Thu Jun 11 — 10am, 2pm,  │     │
│ │              4pm         │     │
│ │ Fri Jun 12 — 9am, 11am,  │     │
│ │              3pm         │     │
│ │ Sat Jun 13 — 10am, 12pm  │     │
│ │                          │     │
│ │ Which works best?        │     │
│ └─────────────────────────┘     │
│  10:38 AM ✓✓                    │
│                                 │
│     ┌─────────────────────────┐ │
│     │ Thursday at 2pm        │ │
│     └─────────────────────────┘ │
│                    10:39 AM ✓✓  │
│                                 │
│ ┌─────────────────────────┐     │
│ │ ✅ Showing Confirmed!    │     │
│ │                          │     │
│ │ 🏠 Modern Loft           │     │
│ │ 📍 Calle 10 #43-12,     │     │
│ │    El Poblado            │     │
│ │ 📅 Thu, June 11 at 2:00  │     │
│ │    PM                    │     │
│ │ 👤 Host: María García    │     │
│ │                          │     │
│ │ I'll send you a reminder │     │
│ │ the day before. Need     │     │
│ │ directions?              │     │
│ └─────────────────────────┘     │
│  10:39 AM ✓✓                    │
│                                 │
│ ┌──────────────┐┌─────────────┐ │
│ │Get Directions││ All set! 👍│ │
│ └──────────────┘└─────────────┘ │
│                                 │
│ ┌───────────────────────────┐   │
│ │ Type a message...    [📎] │   │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

## Conversation State Machine

```
┌──────────┐    ┌───────────────┐    ┌───────────────┐    ┌──────────────┐
│ GREETING │───▶│ AWAITING      │───▶│ AWAITING      │───▶│ AWAITING     │
│          │    │ LOCATION      │    │ BUDGET        │    │ BEDROOMS     │
└──────────┘    └───────────────┘    └───────────────┘    └──────────────┘
                                                                │
                ┌───────────────┐    ┌───────────────┐          │
                │ PRESENTING    │◀───│ AWAITING      │◀─────────┘
                │ RESULTS       │    │ AMENITIES     │
                └───────────────┘    └───────────────┘
                        │
                        ▼
                ┌───────────────┐    ┌───────────────┐    ┌──────────────┐
                │ SHOWING       │───▶│ AWAITING      │───▶│ CONFIRMED    │
                │ DETAIL        │    │ SCHEDULE      │    │              │
                └───────────────┘    └───────────────┘    └──────────────┘
                        │                                        │
                        ▼                                        ▼
                ┌───────────────┐                        ┌──────────────┐
                │ HUMAN         │                        │ FOLLOW-UP /  │
                │ HANDOVER      │                        │ REMINDER     │
                └───────────────┘                        └──────────────┘
```

## Annotations

| Element | Format | Notes |
|---------|--------|-------|
| AI messages | Left-aligned bubbles (gray) | Sent from verified WhatsApp Business account |
| User messages | Right-aligned bubbles (green) | Natural language or quick reply taps |
| Quick reply buttons | WhatsApp interactive buttons | Max 3 buttons per message, or list with 10 items |
| Property cards | WhatsApp media message + text | Image + structured text. "View Details" is a button |
| Confirmation card | Structured text message | All showing details in one message |
| Directions link | WhatsApp URL button | Opens Google Maps with coordinates |
| State persistence | Server-side in `conversations` table | Conversation state tracked so user can resume later |
| Human handover | Triggered by "talk to a person" | Routes to live agent in CRM, AI provides context summary |
| Reminder | Automated message | Sent 24h before showing via Infobip scheduled message |

## Integration

- WhatsApp Business API via Infobip (`INFOBIP_API_KEY`, `INFOBIP_BASE_URL`)
- Webhook receives incoming messages at `/api/whatsapp/webhook`
- State machine logic in `rentals` edge function (extended for WhatsApp)
- Property cards use WhatsApp template messages (pre-approved by Meta)
- Quick replies map to the same intake wizard steps as the web UI
- All messages logged to `messages` table with `channel: 'whatsapp'`
