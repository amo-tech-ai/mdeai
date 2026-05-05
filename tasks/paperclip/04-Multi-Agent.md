# How to Build a Multi-Agent Company with Paperclip and Claude Code

Step-by-step guide to setting up Paperclip with Claude Code to create an AI-run company with CEO, marketer, designer, and researcher agents.

MindStudio Team·March 30, 2026

![How to Build a Multi-Agent Company with Paperclip and Claude Code](https://i.mscdn.ai/70cbb1ad-08d7-4fdc-ab31-e343780966a6/generated-images/a138e20d-7071-4e96-90ab-7610184d3cab.png?fm=auto&w=1200&fit=cover?fm=auto&w=1200&fit=cover)

## Setting Up Your AI-Run Company

Running a company where multiple AI agents handle distinct roles — research, design, marketing, strategic oversight — isn’t a thought experiment anymore. With Paperclip and Claude Code, you can spin up a coordinated team of AI agents that communicate, delegate tasks, and produce real outputs.

This guide covers everything you need to get that system running: what each tool does, how to define your agents, how to configure inter-agent communication, and how to run your first multi-agent workflow. The keywords here are **multi-agent** and **practical** — this isn’t an overview, it’s a build.

## What Paperclip Actually Does

Paperclip is an open-source orchestration framework designed for running teams of AI agents that work together like a company. Instead of one agent that tries to do everything, Paperclip lets you define multiple agents with distinct roles — each with its own system prompt, toolset, and area of responsibility.

At its core, Paperclip manages:

- **Agent definitions** — Each agent’s role, persona, and allowed capabilities
- **Task routing** — Which agent handles which type of request
- **Inter-agent communication** — How agents hand off work to each other
- **Output aggregation** — Collecting results from multiple agents into usable deliverables

The framework doesn’t generate outputs on its own. It orchestrates agents that do. That distinction matters for setting expectations.

## How Claude Code Fits the Picture

[Claude Code](https://docs.anthropic.com/claude/docs/claude-code) is Anthropic’s terminal-based agentic tool. Unlike a standard chat interface, Claude Code operates autonomously in your environment. It can:

- Read and write files on your local system
- Execute shell commands and run scripts
- Search the web and retrieve information
- Interact with GitHub, databases, and external APIs
- Spawn subprocesses and handle long-running tasks

In a multi-agent company setup, Claude Code is the execution layer. When your CEO agent decides a marketing campaign needs a landing page, it delegates that task through Paperclip to the marketer agent, which uses Claude Code to actually write and save the files. The orchestration is Paperclip. The action is Claude Code.

## Prerequisites

Before building, you’ll need a few things in place.

**Accounts and credentials:**

- An Anthropic account with API access
- Claude Code installed and authenticated

**System requirements:**

- Node.js 18+ or Python 3.10+
- Git
- Comfort working in a terminal

**Install Claude Code:**

bashCopy

`npm install -g @anthropic-ai/claude-code claude auth login`

**Install and initialize Paperclip:**

bashCopy

`npm install -g paperclip-agents paperclip init my-ai-company cd my-ai-company`

The `init` command creates a project scaffold with directories for agent configurations, a shared workspace, and logging. Check Paperclip’s official documentation for the most current install options — the framework is actively maintained and package names may update.

## Defining Your Agent Roles

The whole point of a multi-agent system is specialization. Generalist agents that try to cover everything produce mediocre results and are hard to debug. Tight, well-scoped agents are better in every way.

For a standard AI company setup, you need four agents: CEO, researcher, marketer, and designer.

### The CEO Agent

The fastest way to learn AI

Build a working AI agent in under an hour — live, with expert guidance.

[Join a Bootcamp →](https://luma.com/mindstudiocommunity?tag=bootcamps)

The CEO receives high-level goals, breaks them into tasks, and delegates to the right specialist. It also reviews outputs and decides when a workflow is complete.

yamlCopy

`agents:   - name: ceo     model: claude-opus-4     system_prompt: |       You are the CEO of a digital products company. Receive high-level        business objectives and break them into specific tasks for your team.              You have a researcher, marketer, and designer available.              When given a goal:       1. Analyze what work is needed       2. Delegate research first — other work depends on it       3. Assign creative and copy tasks to the marketer       4. Give visual work to the designer       5. Review all outputs before marking a task complete              Be specific when delegating. Vague instructions produce vague results.     capabilities:       - delegate_task       - review_output       - approve_deliverable`

### The Researcher Agent

The researcher handles information gathering: web searches, competitive analyses, source summarization, and structured research reports.

yamlCopy

  `- name: researcher     model: claude-sonnet-4     system_prompt: |       You are a research specialist. Gather accurate, relevant information        and produce clear, structured reports.              For every research task:       - Check multiple sources before drawing conclusions       - Cite sources in the body of your report       - Lead with a summary of key findings       - Flag conflicting data or knowledge gaps explicitly     capabilities:       - web_search       - read_file       - write_report`

### The Marketer Agent

The marketer produces campaign strategy, copy, email sequences, and social content. It works from the researcher’s reports and CEO briefs.

yamlCopy

  `- name: marketer     model: claude-sonnet-4     system_prompt: |       You are a senior marketing strategist with strong copywriting skills.              Deliverables include:       - Marketing strategy documents       - Ad copy and email sequences         - Social media content calendars       - Landing page copy              Ground every deliverable in the research provided. Don't make        unverified claims about the product or market.     capabilities:       - write_file       - generate_copy       - create_campaign`

### The Designer Agent

The designer creates visual assets and design briefs. Depending on your setup, this agent can generate images using image generation models, write detailed prompts for external tools, or produce structured brand guidelines.

yamlCopy

  `- name: designer     model: claude-sonnet-4     system_prompt: |       You are a digital designer specializing in brand identity and        marketing visuals.              Your responsibilities:       - Create detailed design briefs       - Generate visual assets using available image generation tools       - Maintain brand consistency across all outputs       - Explain design decisions clearly              When generating images, always specify dimensions, style direction,        color palette, and key visual elements.     capabilities:       - generate_image       - write_file       - create_brief`

## Configuring Agent Communication

Defining agents is only half the work. You also need to configure how they pass tasks to each other.

### Setting Up the Task Router

The task router determines which agent handles incoming requests. Configure this in `routing.yaml`:

yamlCopy

`routing:   default_agent: ceo   rules:     - condition: task_type == "research"       agent: researcher     - condition: task_type == "marketing"       agent: marketer     - condition: task_type == "design"       agent: designer     - condition: task_type == "review"       agent: ceo`

For more flexible systems, route everything through the CEO and let it make delegation decisions dynamically. This adds latency but produces better task decomposition on complex goals.

### Enabling Agent-to-Agent Delegation

Paperclip supports direct task passing between agents. When the CEO needs research done, it calls something like:

javascriptCopy

`await agent.delegate({   from: "ceo",   to: "researcher",   task: "Research the top 5 competitors in project management software. Focus on pricing, key features, and customer reviews from the past 12 months.",   priority: "high" });`

Go from idea to AI agent in one session

Our bootcamps are fast, focused, and free. Join hundreds of builders shipping AI tools every week.

[Save Your Spot →](https://luma.com/mindstudiocommunity?tag=bootcamps)

The researcher completes the task, writes a report to the shared workspace, and signals completion. The CEO reads the report and delegates the next task.

### Setting Up a Shared Workspace

All agents need read/write access to a shared directory. Configure this in `paperclip.config.js`:

javascriptCopy

`module.exports = {   workspace: "./shared-workspace",   agents: [     "./agents/ceo.yaml",     "./agents/researcher.yaml",     "./agents/marketer.yaml",     "./agents/designer.yaml"   ],   communication: {     method: "file-based",     polling_interval: 2000   } }`

File-based communication is the simplest approach. Agents write outputs to specific subdirectories and poll those directories for new work. It’s transparent — you can open the shared workspace at any point and see exactly what each agent has produced.

## Running Your First Multi-Agent Workflow

With agents defined and communication configured, you’re ready to run something real.

### Start All Agents

bashCopy

`paperclip start --all`

This starts each agent as a separate process. With the `--verbose` flag, you get real-time logs from every agent.

### Assign a Goal to the CEO

bashCopy

`paperclip task --agent ceo "We're launching a productivity app for remote teams. I need a competitive analysis, a go-to-market strategy, landing page copy, and a visual identity concept."`

### Watch the Workflow

With verbose logging enabled:

plaintextCopy

`[CEO] Received task: Launch strategy for productivity app [CEO] Delegating to researcher: Competitive analysis of remote work tools [RESEARCHER] Starting web search... [RESEARCHER] Found 14 relevant sources [RESEARCHER] Writing report → /shared-workspace/research/competitive-analysis.md [CEO] Research complete. Delegating to marketer: Go-to-market strategy [MARKETER] Reading competitive analysis... [MARKETER] Writing GTM strategy → /shared-workspace/marketing/gtm-strategy.md [CEO] Delegating to designer: Visual identity concept [DESIGNER] Generating brand brief... [DESIGNER] Writing brief → /shared-workspace/design/brand-brief.md [CEO] All deliverables received. Running final review... [CEO] Review complete. Marking task done.`

By the end of a run, your shared workspace contains a competitive analysis, a go-to-market strategy document, landing page copy, and a visual identity brief — all cross-referenced because each agent read what the previous ones produced.

### Iterating on Outputs

After reviewing, you can push revision tasks directly to individual agents:

bashCopy

`paperclip task --agent marketer "The landing page copy is too generic. Rewrite the hero section to focus specifically on async communication for distributed teams. Reference the competitive analysis."`

The marketer revises the file in place. Loop in the CEO for a review pass before finalizing.

## Patterns That Actually Work

A few things separate well-functioning multi-agent systems from frustrating ones.

### Match Model Capability to Task Complexity

The CEO agent — which needs to reason about complex trade-offs, decompose ambiguous goals, and evaluate multi-part outputs — benefits from Claude Opus. Specialist agents doing more routine work can use Claude Sonnet, which is faster and cheaper. Faster models keep the workflow moving. A five-step workflow where each agent call takes 45 seconds feels broken, even if the outputs are good.

### Write Tight System Prompts

The most common failure in multi-agent systems is agents that do too much or too little. Good system prompts:

- Define exactly what the agent is responsible for
- Explicitly list what the agent should **not** do
- Specify the exact output format (Markdown, JSON, structured text)
- Include at least one concrete example of expected behavior

If you find an agent consistently doing the wrong thing, the fix is usually in the system prompt, not the routing logic.

Stop watching tutorials, start building

MindStudio bootcamps are live and hands-on. Walk away with a working AI agent.

[Register Now →](https://luma.com/mindstudiocommunity?tag=bootcamps)

### Build in Human Checkpoints

For workflows producing customer-facing content, require human approval before moving to the next phase. Without checkpoints, one bad research output can cascade into a pile of work that all needs to be redone.

bashCopy

`paperclip task --agent ceo "After the competitive analysis is complete, pause and request human approval before proceeding to the marketing phase."`

### Start Small

Don’t try to run six agents with complex interdependencies on your first build. Get the CEO and one specialist working reliably, then add agents one at a time. Each addition introduces new failure modes — it’s easier to debug them in isolation.

## Expanding Beyond the Core Four

Once the core four agents are stable, these are the most useful additions:

**Developer agent** — Writes, tests, and debugs code. Particularly valuable if your company is building software. Pair with Claude Code’s execution capabilities for a functional development loop.

**QA agent** — Reviews outputs from other agents against defined quality standards. Acts as a filter before anything reaches your review queue.

**Finance agent** — Handles budgeting, cost tracking, and financial modeling. Give it access to spreadsheet tools and it can maintain running cost reports across projects.

**Customer support agent** — Handles inbound queries and drafts responses. Connect via webhook to email or a ticketing system and it can triage in real time.

Each follows the same pattern: YAML definition, system prompt, capabilities, routing rule.

## How MindStudio Fits If You’re Not Writing Config Files

Paperclip with Claude Code is a strong technical setup, but it requires comfort with terminal commands, YAML configuration, and local development environments. If that’s not how you want to spend your time, [MindStudio](https://mindstudio.ai/) is a direct alternative.

MindStudio’s visual no-code builder lets you define agents with specific roles, connect them into multi-step workflows, and deploy without touching a terminal. The platform includes [over 200 AI models](https://mindstudio.ai/) — including Claude Opus and Sonnet — so you can replicate the same model-per-role strategy described above. You build the equivalent of your CEO, researcher, marketer, and designer agents by configuring individual AI workers with focused system prompts, then chain them using the workflow builder.

For teams that want to combine both approaches, MindStudio’s [Agent Skills Plugin](https://mindstudio.ai/) is worth looking at. It’s an npm SDK that lets Claude Code or other external agents call MindStudio’s 120+ capabilities as simple method calls — `agent.searchGoogle()`, `agent.sendEmail()`, `agent.generateImage()`. This means you can use Paperclip for orchestration while routing specific infrastructure tasks (image generation, email delivery, database writes) to MindStudio as a capabilities layer.

MindStudio handles rate limiting, retries, and authentication. Your agents focus on reasoning, not plumbing.

You can start free at [mindstudio.ai](https://mindstudio.ai/).

## Frequently Asked Questions

### What is Paperclip in the context of multi-agent AI?

Learn to build AI agents — live

Join a MindStudio bootcamp and go from zero to deployed AI agent in one session.

[Browse Bootcamps →](https://luma.com/mindstudiocommunity?tag=bootcamps)

Paperclip is an open-source orchestration framework for building and running teams of AI agents that work together with defined roles. It manages task routing between agents, inter-agent communication, and output coordination. On its own, Paperclip is an orchestrator — it becomes an execution system when combined with Claude Code, which gives agents the ability to take real action (write files, run code, call APIs) rather than just generate text.

### How is a multi-agent setup different from a single AI agent?

A single agent handling everything — research, copywriting, design decisions, strategic planning — stretches its context window and degrades output quality on complex tasks. A multi-agent system assigns each specialized task to a dedicated agent with a focused system prompt and the right toolset. The result is better quality on individual tasks and a workflow that’s significantly easier to debug and improve. It also lets you use different models for different roles, matching cost and speed to task requirements.

### Do I need to know how to code to set this up?

You need comfort with terminal commands, YAML configuration files, and basic JavaScript or Python. You don’t need to be a software engineer, but you do need to be comfortable working in a command-line environment. If you want to build equivalent workflows without configuration files, [MindStudio’s no-code builder](https://mindstudio.ai/) handles the same setup through a visual interface.

### Which Claude model should each agent use?

A common pattern: Claude Opus for the CEO or orchestrator agent, since it handles complex goal decomposition and multi-part evaluation. Claude Sonnet for specialist agents doing more routine work — drafting copy, formatting research reports, producing design briefs. Sonnet is faster and more cost-efficient, which keeps the overall workflow moving. Match model capability to task complexity, not to the agent’s perceived importance.

### How do Paperclip agents communicate with each other?

File-based communication is the simplest method: agents write outputs to a shared directory, and other agents read from that directory. Paperclip also supports a message-passing API where agents send structured task objects directly. File-based communication is easier to inspect and debug — you can open the shared workspace at any point and read exactly what each agent has produced. For production systems with strict latency requirements, the message-passing approach is faster.

### Can I connect my agents to external tools and APIs?

Yes. Claude Code natively supports interactions with external APIs, GitHub, databases, and local file systems. Paperclip agents can be configured with custom capabilities that call any API you have credentials for. Common integrations include Slack for notifications, Google Drive for document storage, Airtable for structured data, and web scraping libraries for research agents. MindStudio’s Agent Skills Plugin extends this further with 120+ pre-built typed capabilities that handle authentication and error handling automatically.

## Key Takeaways

Building a multi-agent company with Paperclip and Claude Code comes down to a few principles that hold true regardless of how complex the system gets:

- **Specialize your agents** — Tight roles with focused system prompts consistently outperform generalist agents trying to cover everything
- **Match model to task** — Claude Opus for complex reasoning and orchestration, Claude Sonnet for faster specialist work
- **Start with two agents** — Get the CEO and one specialist reliable before adding more
- **File-based communication first** — It’s slower but transparent and easy to debug
- **Log everything** — When an output goes wrong, logs tell you which agent produced it and what context it was working from
- **Build in human checkpoints** — Especially for anything customer-facing