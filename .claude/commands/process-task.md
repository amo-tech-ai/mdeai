Process and execute a task from the project backlog.

## Arguments

- `$ARGUMENTS` — A task ID (e.g., `MDEAI-42`), a description (e.g., `"add freshness badge"`), or `latest` to pick up the most recent incomplete task.

## Workflow

1. **Identify the task**
   - If `$ARGUMENTS` is `latest`: scan `docs/tasks/00-progress-tracker.md` and `docs/NEXT-STEPS.md` for the next incomplete item
   - If `$ARGUMENTS` is a description: match against known tasks or treat as a new ad-hoc task
   - If `$ARGUMENTS` is an ID: look up in task tracker

2. **Analyze scope**
   - Read relevant source files to understand current state
   - Identify which files need changes (components, hooks, types, edge functions, migrations)
   - Check for dependencies or blockers

3. **Plan the implementation**
   - Break into discrete steps (max 5)
   - Flag any risks: breaking changes, migration needs, new env vars
   - Estimate blast radius (how many files touched)

4. **Execute**
   - Implement changes following rules in `.claude/rules/`
   - Run `npm run lint` after changes
   - Run `npm run build` to verify no type errors
   - Run `npm run test` if tests exist for affected areas

5. **Report**
   - Summarize what was done
   - List files changed
   - Note any follow-up tasks created
   - Update progress tracker if applicable

## Constraints

- Follow the 4-state pattern for any new data components (loading, error, empty, success)
- Follow AI propose-only pattern for any AI features
- Never modify `.env` — flag missing env vars for manual addition
- All Supabase schema changes need migration files
