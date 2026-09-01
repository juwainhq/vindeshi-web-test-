# AI Rules - Tech Stack & Library Guidelines

## Tech Stack

- **React 18** with **TypeScript** – primary UI framework, strictly typed components and hooks
- **Vite** – build tool and development server for fast HMR and production builds
- **Tailwind CSS** – utility-first styling; all UI components use Tailwind classes for layout, spacing, colors, and responsive design
- **shadcn/ui** – prebuilt, accessible UI components (buttons, dialogs, forms, etc.) are the default; always import from the library rather than writing custom-styled alternatives
- **@supabase/supabase-js** – backend services: authentication, realtime database, storage, and server-side functions
- **lucide-react** – icon library; all SVGs imported from this package for consistency and small bundle size
- **React Router** – client-side routing; keep all route definitions in `src/App.tsx`

## Library Usage Rules

| Library | When to Use | How to Import/Use |
|---------|-------------|-------------------|
| **React** | All UI logic, state, and rendering | `import something from 'react'` or `import { something } from 'react'` |
| **React DOM** | Rendering into the DOM (only in `main.tsx`) | `import { createRoot } from 'react-dom/client'` |
| **Vite plugins** (`@vitejs/plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`) | Build setup and linting – never import these in source code |
| **Tailwind CSS** | All styling, including custom components, layouts, and utilities | Use Tailwind class names directly in JSX; never write CSS files for layout/spacing (use `src/index.css` only for global styles) |
| **shadcn/ui components** | Buttons, inputs, dialogs, tables, forms, and any reusable UI | Import from `~/components/ui/` (auto-generated) or `components/ui/`; customize via Tailwind overrides, not CSS overrides |
| **lucide-react** | All icons (buttons, headers, illustrations) | `import { IconName } from 'lucide-react'; <IconName className="h-4 w-4" />` |
| **@supabase/supabase-js** | Authentication, database queries, storage, and server functions | Import from `./lib/supabase` or `@supabase/supabase-js`; use Row-level Security (RLS) for database access; never expose service_role key to the client |
| **TypeScript** | Type safety for all props, state, and API shapes | Enable strict mode; define interfaces/types in `src/lib/types.ts`; never use `any` unless absolutely necessary – prefer `unknown` + narrowing |
| **ESLint** | Code quality and React Hooks rules | Run `npm run lint` before committing; never disable rules without a very strong reason documented in a comment |

## Component Organization

- **Pages** → `src/pages/` (e.g., `Index.tsx` is the default/main page)
- **Components** → `src/components/` (feature‑specific; group related UI together)
- **UI primitives** → `src/components/ui/` (shadcn/ui primitives – do not edit these files directly)
- **Hooks** → `src/lib/` (custom hooks like `useAuth`, `useSiteContent`, `useUpload`)
- **Libraries/utilities** → `src/lib/` (Supabase client, types, upload helpers, etc.)

## Styling Guidelines

- **Always use Tailwind CSS** for any presentational change.
- Colors, spacing, typography, and responsive breakpoints must come from the Tailwind config (`tailwind.config.cjs` or `tailwind.config.ts`).
- Do not add custom CSS files for layout or spacing; use `@apply` in rare cases where a component needs a specific class bundle, but prefer inline Tailwind classes.
- Global CSS (animations, CSS variables) goes into `src/index.css` only.

## Authentication & Authorization

- All auth flow is handled via **Supabase** (`src/lib/useAuth.ts`, `src/lib/supabase.ts`).
- Check `session` status before rendering protected routes/components.
- Use the `useAuth` hook to get `session`, `loading`, `signIn`, and `signOut`.
- Never manually manage auth tokens or cookies – Supabase handles JWT renewal and session storage.
- For role‑based access, protect routes in `src/App.tsx` based on the `session` object returned by `useAuth`.

## State Management

- Prefer **React state** (`useState`, `useReducer`) for local component data.
- Use **custom hooks** (`src/lib/`) for shared logic (e.g., `useAuth`, `useSiteContent`).
- Keep URL‑related state in **React Router** location state or query params, not in Redux or context unless truly global.
- Never lift state up unnecessarily; keep it as close to the source as possible.

## Form Handling

- Use **React Hook Form** patterns if forms are complex, but the codebase currently uses simple `useState` + Supabase calls.
- Always validate on the server (Supabase RLS or edge functions) – never trust client‑side only validation.
- Keep form schemas in `src/lib/types.ts` when possible, and reuse them for both validation and type safety.

## Performance

- Use **dynamic imports** (`import()`) for code‑splitting large components or pages if profiling shows a benefit.
- Memoize pure components with `React.memo` only when rendering is expensive and props are stable.
- Keep icon imports from `lucide-react` tree‑shakable – import only the icons you use: `import { Home, User } from 'lucide-react'`.
- Avoid large inline styles; use Tailwind utilities instead.

## Accessibility

- All shadcn/ui components are accessible by default – do not remove `aria-*` attributes unless you have a very good reason.
- Ensure color contrast meets WCAG AA using Tailwind’s `contrast-*` utilities if needed.
- Provide meaningful `alt` text for all images; decorative images can have `alt=""`.
- Use semantic HTML (`<button>` for actions, `<nav>` for navigation, etc.).

## Development Workflow

- Run `npm run dev` for local development with HMR.
- Run `npm run typecheck` before committing to catch TypeScript errors.
- Run `npm run lint` to enforce code style and Hook rules.
- Commit frequently; use descriptive commit messages.
- If adding a new dependency, check if an existing library can fulfill the same purpose before adding a new one.