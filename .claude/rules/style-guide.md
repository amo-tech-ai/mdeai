# Style Guide

## TypeScript

- Strict mode always (`strict: true` in tsconfig)
- No `any` — use `unknown` and narrow, or define proper types
- All component props must have explicit interfaces (not inline)
- Prefer `type` over `interface` unless extending
- Use `as const` for literal unions

## React

- Functional components only — no class components
- Named exports for components, default export only for pages
- Push `'use client'`-equivalent interactivity as far down the tree as possible
- Hooks at the top of the component body, never conditionally called
- Extract complex logic into custom hooks in `src/hooks/`

## File Naming

- Components: `PascalCase.tsx` (e.g., `ApartmentCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useBookings.ts`)
- Types: `camelCase.ts` (e.g., `listings.ts`)
- Utils/lib: `camelCase.ts` (e.g., `utils.ts`)
- Pages: `PascalCase.tsx` matching the route (e.g., `Dashboard.tsx`)

## Imports

- Always use `@/` path alias (maps to `src/`)
- Group imports: react → third-party → @/ components → @/ hooks → @/ types → @/ lib
- No relative imports that go up more than one level (`../../` is a smell)

## Styling

- Use Tailwind utility classes via shadcn/ui components
- Use `cn()` from `@/lib/utils` for conditional classes
- All colors via CSS custom properties — never hardcoded hex/rgb
- Design tokens live in `index.css` and `tailwind.config.ts`
- Font stack: `font-sans` (DM Sans) for body, `font-display` (Playfair Display) for headings

## Component Patterns

- Every data-fetching component handles 4 states: loading, error, empty, success
- Forms use react-hook-form + Zod schemas — no uncontrolled forms
- Toast notifications via Sonner (`sonner`) for success, `useToast` for complex
- Use shadcn/ui primitives — don't rebuild buttons, dialogs, selects from scratch
