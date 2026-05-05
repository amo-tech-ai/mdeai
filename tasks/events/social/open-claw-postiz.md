# How I Fully Automated My TikTok Account **With Openclaw** (And What Everyone Gets Wrong)

[

![Civil Learning](https://miro.medium.com/v2/resize:fill:32:32/1*C7yKQA2alY8DVjVu35-fCg.png)





](https://medium.com/@civillearning?source=post_page---byline--fd6fd5187cfe---------------------------------------)

[Civil Learning](https://medium.com/@civillearning?source=post_page---byline--fd6fd5187cfe---------------------------------------)

Follow

5 min read

·

Apr 9, 2026

10

1

[

](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2Fplans%3Fdimension%3Dpost_audio_button%26postId%3Dfd6fd5187cfe&operation=register&redirect=https%3A%2F%2Fmedium.com%2Fcoding-nexus%2Fhow-i-fully-automated-my-tiktok-account-with-openclaw-and-what-everyone-gets-wrong-fd6fd5187cfe&source=---header_actions--fd6fd5187cfe---------------------post_audio_button------------------)

When someone claims “my AI agent runs my TikTok,” they overlook the tough part. Most are automating around 70%, while the remaining 30% involves manual effort; they tend to omit quietly.

This article covers that 30%. Specifically, there’s one step near the end that I’ve never seen documented elsewhere. Don’t skip to it; the context matters.

Press enter or click to view image in full size

![](https://miro.medium.com/v2/resize:fit:700/1*2tJvt_Jl7oTCpRS4Fu-lww.png)

## The Stack

- **Openclaw (or any agent you prefer)** — the brain
- **Postiz.com** — social media scheduling, but built for agents, not humans
- **Google Gemini API with Nano Banana 2** — image generation
- **A $50 Android phone** — and I’ll explain why this isn’t optional

## Step 1: Build Your Image Stockpile

TikTok slideshows are low-lift marketing. No AI influencers, no UGC shoots. Just photos that tell a small story.

Each post needs at least 3 slides:

- **Slide 1** — the hook. Why should anyone stop scrolling?
- **Slide 2** — the point. What are you actually saying?
- **Slide 3** — the resolution + CTA. What do you want them to do?

For 3 posts a day, that’s 9 images a day. I generate a full week’s worth in one session.

Here’s the exact prompt I give my agent:

Using our Gemini API Key and Nano Banana 2, we're going to be making   
sets of images to do some TikTok Slideshow marketing for [Project Name].  
  
We're going to be making sets of [3] images per post that tell a story   
that invites users to our product and page.  
Our first slide is the hook and introduces the concept   
[what are we talking about and why should they care]  
Our second slide expands on the hook and gives the main piece of   
information to the user [what is the main point of this post]  
Our third slide is the resolution, which is what you want the user to be   
left with, and a potential CTA [download app/visit site/etc]  
So, let's brainstorm and perfect what a good set of photos looks like   
for [Project Name], make me three variations of Slide 1 based on what   
you know about what we're building here (reference memory, github, etc   
where needed for full context)  
Then, let's do Slide 2, then Slide 3, then let's start doing them   
set by set.  
When we're done, we'll make the approved method into a skill file to be   
used whenever needed.

The agent also handles text overlays. I once approved a template, added it to a skill file, and never touched it again.

## Step 1.5: Warm Up Your Account First

Before you schedule a single post, **warm up the account for at least three days**.

Create a brand-new TikTok on your Android device. Then, as a real human would:

- Scroll through your niche
- Like, bookmark, comment
- Follow accounts in your space

This trains TikTok’s algorithm to understand your profile. Skipping this step causes TikTok to flag your account as a bot immediately. This shadowban impacts not just one post but the entire account, forcing you to start fresh.

I cannot stress this enough. I’ve watched people build entire automations only to fail here.

## Step 2: Schedule With Postiz

Postiz differs from tools like Buffer or Later because it operates around an API key, allowing your agent to schedule posts without needing to open a browser.

## Get Civil Learning’s stories in your inbox

Join Medium for free to get updates from this writer.

Subscribe

Remember me for faster sign in

Get your API key from Postiz, then give your agent this:

Here's an API key for Postiz [API KEY], store it and use for anything   
we do moving forward for post scheduling for [Project Name].  
  
The TikTok slideshow marketing creation that we did earlier is going to   
be directly linked to this. Any of the sets of images you created are   
going to be posted via this API key onto TikTok with Postiz.  
For every single post that you make, follow these rules:  
1. Nothing is to be posted directly onto TikTok by you. They should   
   only be sent to the DRAFTS of the TikTok account. You are ONLY   
   sending posts to Drafts on the TikTok page.  
2. Audio should always be set to none. We will manually pick an   
   audio later.  
3. Maximum number of hashtags to be used is 5, and they should be   
   the following [5 trending relevant hashtags]  
4. The caption should never be longer than 1,000 characters, but it   
   should be relevant to each post and as natural as possible.  
5. Our posting schedule is X times a day at X times, so every single   
   post should be scheduled for those times.  
6. Each post should have X attachments. If they don't, something went   
   wrong and it is not ready to ship.  
7. Titles should be relevant and created per post based on the caption.

Notice rule #1. Drafts only. This is critical and connects directly to the next step.

## Step 3: The Secret Human Touch

Here’s what no one talks about.

**Posting directly to Tiktok via any scheduling API will result in a shadowban on your account.** This applies not only to individual posts but to the whole account, even if it's a well-established profile with quality content. TikTok identifies API-based posts as bot activity and codifies it as a violation.

The fix is simple, but nobody documents it properly.

You purchase an inexpensive Android device, such as a $50 Samsung from Amazon. You enable ADB over Wi-Fi on the device and place it on your desk connected to your home network.

Your agent connects to the phone, opens TikTok, selects an audio, and posts the draft directly from the screen — mimicking a human tapping through the app.

TikTok sees a real device, a real session, and real behaviour. The skill file that makes this work is free:

https://github.com/clothbun1/device-takeover

Insert that into your agent, and it guides you through the whole setup. It’s simpler than it sounds, just ensure your phone is on the same Wi-Fi with one setting turned on.

## The CRON That Ties It Together

Once everything is live, your maintenance job is:

1. CRON: Agent monitors phone for Postiz drafts   
   (+5 mins after each scheduled post time)  
  
2. Agent opens TikTok → selects audio → posts  
3. You check the output log it sends you  
4. Once a month: generate a new image stockpile

That’s it. That’s the whole job.

## What Your Content Should Actually Look Like

Quick note on the content itself, because the format only works if the slides are right.

- **AI wrapper app?** Show before and after results. Easy win.
- **Lifestyle product?** Build a specific, aspirational identity around a character. Not generic — specific.
- **Health or fitness?** Show one person’s measurable progression over time.
- **Religious or educational?** This is harder (it’s what I do), but lead with questions people already have. Don’t sell. Spark curiosity.

The goal isn’t always a direct CTA. Much of TikTok slideshow marketing works to build brand awareness, the right person sees it, recognises the value, and comes back later. That still converts.

## The Honest Summary

The stack: Openclaw handles creation and scheduling. Postiz sends drafts to TikTok. A cheap Android device posts them like a human.

The common mistake: posting directly from API, skipping account warmup, or letting the agent choose audio- since TikTok’s audio matching is more important than many realise.

The part nobody talks about: the phone. That’s the real unlock.

Set this up once. Replenish the stockpile monthly. Everything else runs on its own.
# How I automated posting across 4 social media platforms using AI agents (OpenClaw + Postiz)

got tired of manually scheduling posts across twitter, linkedin, instagram every day so i set up an automation that does it all through telegram. heres exactly how it works

the stack:

- openclaw (the AI brain, open source)

- postiz (open source social media scheduler)

- claude API (for writing the actual content)

- easeclaw (for hosting openclaw so i didnt have to deal with servers)

how it works step by step:

1. every morning i message my openclaw bot on telegram something like "write me 3 tweets about [topic], 1 linkedin post, and 1 instagram caption"
    
2. openclaw uses claude to write all of them in my voice because it has context from my previous posts and writing style
    
3. i review them in telegram, tweak if needed, and reply "post these"
    
4. openclaw sends the content to postiz through its API which schedules them across all platforms at optimal times
    
5. postiz handles the actual posting to twitter, linkedin, instagram, threads, whatever you have connected
    

the whole thing takes me about 5 minutes in the morning instead of the 45+ minutes i used to spend writing and scheduling manually

what makes this actually useful vs just using chatgpt:

- openclaw remembers everything. my brand voice, topics i already covered, what performed well. i dont have to re-explain context every time

- its on telegram so i can do it from bed, on the bus, wherever

- postiz is free and open source so no $50/mo hootsuite or buffer subscription

- the whole thing runs 24/7 so if i tell it "post something about [trending topic] when you see it" it actually can

my setup cost:

- easeclaw for openclaw hosting: $29/mo (picks your model, handles all server stuff, took me 1 min to set up)

- claude API: ~$15-20/mo for my usage

- postiz: free (self hosted on same server) or they have a cloud version

- total: ~$45-50/mo to completely automate social media across 4 platforms

results after 3 weeks:

- posting consistently every day (was doing maybe 3x/week before)

- engagement up about 40% just from consistency alone

- saving roughly 5-6 hours per week

- content actually sounds like me because openclaw learns my style

if you want to set this up yourself the main steps are:

1. get openclaw running (i used easeclaw so it was literally pick claude, pick telegram, done)
    
2. set up postiz (postiz - connect your social accounts)
    
3. create an openclaw skill that formats content and sends it to postiz API
    
4. tell your bot what kind of content you want and how often
    

happy to answer questions about the setup

Upvote10Downvote35Go to comments
[](https://medium.com/tag/tiktok-app?source=post_page-----fd6fd5187cfe---------------------------------------)