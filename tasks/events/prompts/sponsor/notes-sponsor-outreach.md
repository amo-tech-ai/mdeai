> ⚠️ **PHASE 3+ DESIGN NOTES ONLY** — Not for immediate implementation. References to Cloudinary below should be replaced with **Supabase Storage** for MVP (Phase 1–2). Cloudinary may be adopted in Phase 3+ if complex per-platform image transforms are needed. See task 064 for the full campaign system spec.

Here’s a **concrete, step‑by‑step example workflow** for **sponsor outreach using mdeai + Postiz + OpenClaw + AI** in Medellín.

---

## 🎯 Goal

Convert a **Medellín nightlife / fashion brand** into a sponsor for an upcoming mdeai event using:

- **OpenClaw** for outreach + automation.
    
- **Postiz** for social promotion.
    
- **Cloudinary** for creatives.
    
- **mdeai** as the event + data layer.
    

---

## 1. Trigger: new event + “cold” prospect list

- **Event created in mdeai**
    
    - Name: `mdeai x Poblado Night 2026`
        
    - Date: `2026‑06‑12`
        
    - Audience: 25–35 y/o, nightlife‑oriented, fashion‑aware, Medellín + LATAM.
        
- **Prospect list**
    
    - 80 brands mined via sponsorship‑discovery engine (websites + Instagram + LinkedIn + event‑directories).
        
    - Ranked by **sponsor‑fit‑score** (audience_match + local_presense + sponsorship_history).
        

---

## 2. OpenClaw – AI‑generated sponsor proposal

OpenClaw runs an **Outreach Agent** that:

1. **Reads mdeai + brand data**
    
    - Event details.
        
    - Estimated reach (Instagram + TikTok + WhatsApp, past‑event history).
        
    - Brand’s website + Instagram + past sponsorships.
        
2. **Generates AI‑proposal**
    
    - Types:
        
        - PDF proposal (Google Docs / Notion style → export as PDF).
            
        - Pitch deck bullets for WhatsApp.
            
    - Content:
        
        - “Your brand fits because:”
            
            - “Your audience = 25–35, fashion‑focused, nightlife‑driven — same as mdeai.”
                
        - Package tiers:
            
            - Bronze: logo + 3 posts + 100 tickets.
                
            - Silver: VIP lounge + 5 posts + 1 TikTok + WhatsApp feature.
                
            - Gold: “Sponsor‑of‑the‑night” + 8 posts + AR filter + influencer collab.
                
        - Estimated exposure:
            
            - “~15,000 views + 1,200 WhatsApp clicks.”
                
3. **Uploads assets to Cloudinary**
    
    - Converts:
        
        - Logo + event graphic → Cloudinary.
            
        - Posts previews (IG + TikTok thumbnails) → stored for later use by Postiz.
            

---

## 3. OpenClaw – WhatsApp + email outreach

Outreach Agent does a **multi‑channel** push:

## Step 1: First touch (WhatsApp + email)

- **Message to WhatsApp (verified business account)**
    
    - To: `Marketing Director`, `Brand Manager` (highest‑ranking contacts).
        
    - Template:
        
        - “Hola [Nombre],\n\nSomos mdeai, la plataforma de eventos nocturnos y moda en Medellín. Estamos buscando marcas como [Tu Marca] para ser `Sponsor‑of‑the‑Night` en el evento `[mdeai x Poblado Night 2026]` con unos **15,000 views estimados** y presencia en Instagram + TikTok + WhatsApp.\n\nTe enviamos un breve PDF + link a la campaña propuesta: [mdeai.link/prop‑poblado‑2026]\n\n¿Te interesa un call rápido esta semana?”
            
- **Email via OpenClaw + Instantly / Lemlist**
    
    - Same core message + attachment:
        
        - `mdeai_poblado_2026_proposal.pdf` (Cloudinary‑hosted preview).
            

## Step 2: If no reply in 48h

- **OpenClaw triggers follow‑up**
    
    - WhatsApp:
        
        - “Hola [Nombre], solo quería cerciorarme de que recibiste el correo con la propuesta para ser Sponsor‑of‑the‑Night en mdeai. ¿Te interesaría hablar en 10 minutos esta semana?”
            
    - If email + WhatsApp both untouched:
        
        - Lower priority in the queue → “warm‑later” campaign instead of aggressive push.
            

## Step 3: If “sí” / “me interesa”

- OpenClaw:
    
    - Logs response in mdeai + CRM.
        
    - Triggers:
        
        - “Proposal approved” → moves to next phase.
            
    - Automatically books 15‑minute calendar event via Google Calendar + sends confirmation.
        

---

## 4. Approval + campaign finalization

For each **approved brand**:

1. **Campaign Planner Agent** (AI) generates:
    
    - A 7‑day plan:
        
        - Day‑1–3: Teaser + “coming soon” + behind‑the‑scenes.
            
        - Day‑4–6: “VIP lounge by [Brand]” + countdown.
            
        - Day‑7: “Only 2 hours left → scan QR” + last‑minute urgency.
            
2. **Content Generator Agent** (AI + Cloudinary)
    
    - Produces:
        
        - Instagram Reel + Story + TikTok hook + X caption.
            
    - Cloudinary:
        
        - Auto‑resizes for:
            
            - Reel (1080x1920).
                
            - Story (1080x1920).
                
            - TikTok (1080x1350).
                
        - Applies sponsor watermark + branded gradient overlay.
            
    - Generates UTM links:
        
        - `mdeai.link/event_poblado_2026_sponsor_x_instagram`
            
3. **Postiz scheduling** (via OpenClaw)
    
    - OpenClaw calls **Postiz API** (Postiz‑MCP / CLI):
        
        - `media:upload` → `media_url` = Cloudinary asset.
            
        - `posts:create` → schedule each post on:
            
            - Instagram feed + Story + TikTok + X.
                
    - Stores:
        
        - `post_id` + `channel` + `scheduled_at` + `campaign_type` in mdeai DB.
            

---

## 5. On‑event activation + WhatsApp boosts

While the campaign runs:

- **OpenClaw** monitors:
    
    - Ticket sales + WhatsApp clicks + UTM queries.
        
- **If ticket sales drop below target:**
    
    - OpenClaw:
        
        - Instructs Campaign Planner → add 2 extra TikTok + Instagram Stories.
            
        - Calls Postiz:
            
            - `posts:create` new urgency posts.
                
        - Sends WhatsApp blast:
            
            - “Quedan pocos cupos VIP para esta noche. Aquí tienes el link directo: [mdeai.link/ultimo_30_minutos]”
                
- **Event‑near (48h before)**
    
    - OpenClaw:
        
        - Sends 3‑tier push:
            
            1. Email + WhatsApp:
                
                - “Solo 48h para comprar entradas VIP con [Brand].”
                    
            2. TikTok + Instagram:
                
                - “Last chance” clips generated by Content Generator + Cloudinary.
                    
            3. X:
                
                - “Only 100 VIP tickets left” + countdown image.
                    

---

## 6. Post‑event: AI‑generated ROI report

After the event:

1. **Performance Analyst Agent** runs:
    
    - Joins:
        
        - Postiz `post_id` + `impressions`.
            
        - mdeai ticket + WhatsApp + UTM data.
            
    - Computes:
        
        - Clicks per post.
            
        - Cost per ticket for sponsor.
            
        - “Top‑performing content” (e.g., 1 TikTok drove 35% of all ticket sales).
            
2. **OpenClaw auto‑generates report**
    
    - PDF + email to sponsor:
        
        - “Tu campaña con mdeai generó 1,240 impresiones, 320 clicks y 85 entradas pagas.”
            
        - “Tu mejor contenido fue este TikTok: [link]”
            
    - Includes:
        
        - Winners from UGC / voting campaigns.
            
        - AI‑generated 15‑s highlight reel (Cloudinary‑hosted) sent via WhatsApp + email.
            
3. **Renewal / upsell workflow**
    
    - OpenClaw:
        
        - If “good‑performance” (CTR + ticket sales above threshold):
            
            - Triggers:
                
                - “Quieres ser Sponsor‑of‑the‑Season 2026?” message + new PDF tailored.
                    
        - If “medium‑performance”:
            
            - Sends lighter‑tier upsell (“Solo 3 eventos en el trimestre”) + WhatsApp.
                

---

## 7. What this looks like in practice (for Medellín)

For a **Poblado nightlife bar / spirits brand**:

- **Day 1–2**
    
    - OpenClaw + AI send WhatsApp + email proposal.
        
    - Brand replies “Sí, pero quiero más presencia en TikTok”.
        
- **Day 3**
    
    - OpenClaw tweaks plan → adds 2 extra TikToks, auto‑generates script + Cloudinary visuals.
        
    - Postiz schedules:
        
        - 3 IG + 3 TikTok + 1 X + 2 WhatsApp broadcasts.
            
- **Day 5–7**
    
    - OpenClaw:
        
        - Monitors ticket sales → increases TikTok frequency as needed.
            
        - Sends “última llamada” WhatsApp + last‑minute stories.
            
- **Post‑event**
    
    - OpenClaw sends:
        
        - ROI PDF + highlight video.
            
        - Follow‑up:
            
            - “¿Quieres repetir para mdeai x Feria de Flores?”
                

---

This is a **production‑ready, Medellín‑optimized** sponsor‑outreach workflow that:

- Uses **OpenClaw** for end‑to‑end automation + outreach.
    
- Uses **Postiz** for clean, multi‑channel + multi‑platform scheduling.
    
- Uses **Cloudinary** for AI‑ready, auto‑formatted creatives.
    
- Stays **WhatsApp‑first**, UTM‑driven, and performance‑measured for sponsors.