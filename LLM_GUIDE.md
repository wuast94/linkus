# Linkus LLM Contributor Guide

This guide provides context and guidelines for AI assistants contributing to the Linkus project.

## 1. Application Purpose & Architecture

- **Purpose:** Linkus is a dynamic, customizable web dashboard designed to:
  - Display links to user-defined services.
  - Show the status of services via HTTP checks.
  - Integrate with other applications through a plugin system to display relevant information (e.g., download queues, calendars).
  - Control visibility of services and plugins based on user identity and group memberships obtained from forward authentication proxy headers (`Remote-User`, `Remote-Groups`).
- **Architecture:**
  - **Framework:** SvelteKit with TypeScript.
  - **Backend:** Node.js (via `@sveltejs/adapter-node`).
  - **Frontend:** Svelte, Tailwind CSS, DaisyUI and Lucide icons for styling and components.
  - **Configuration:** Driven entirely by `config.yaml` located in a mounted volume (`/app/config` in Docker).
  - **Containerization:** Runs as a Docker container (see `Dockerfile`).

## 2. Key Development Principles

- **Security First:**
  - **NEVER** expose sensitive configuration details (like internal `check_url`s, API keys) to the client-side/browser. Sanitize data in server-side load functions (`+page.server.ts`, `+layout.server.ts`) before returning it.
  - **Always** validate API requests on the server-side (e.g., ensure status checks are only performed for URLs configured in `config.yaml`).
  - Handle authentication headers from the proxy correctly and securely (`src/hooks.server.ts`).
  - Validate and sanitize user inputs if interactive features are added.
- **Configuration Driven:** All services, categories, themes, and plugin settings should be managed via `config.yaml`. Avoid hardcoding values in the application code. Refer to `src/lib/types.ts` for configuration structures.
- **Linting & Formatting:** Adhere strictly to linting rules. Use `just lint` (which runs `trunk check --all --fix -y`) to check and fix issues. Code must pass linting checks.
- **Testing:** Currently relies primarily on manual testing using `just run`. Ensure changes are tested locally. Aim for clear, maintainable, and testable code.
- **Modularity:** Keep components and plugins focused on specific tasks.

## 3. Important Files & Directories

- **Configuration:**
  - `config.example.yaml`: **Master example file.** Use this to document configuration options.
  - `config/` (Runtime): Directory mounted into Docker containing `config.yaml` and `icons/`. **DO NOT EDIT FILES HERE DIRECTLY.**
- **Core Logic & Types:**
  - `src/lib/types.ts`: Defines the core TypeScript interfaces (`Config`, `Service`, `Category`, `PluginConfig`, `User`). **Crucial reference.**
  - `src/lib/utils/config.ts`: Handles loading, parsing, validating, and accessing the runtime `config.yaml`.
- **SvelteKit Structure:**
  - `src/routes/`: Application pages and API endpoints.
    - `+page.svelte` & `+page.server.ts`: Main dashboard UI and its server-side data loading (including service filtering based on auth).
    - `+layout.svelte` & `+layout.server.ts`: Main page layout and its server data loading.
    - `api/`: Backend API endpoints.
      - `api/status/+server.ts`: Handles HTTP status checks for services.
      - `api/plugins/`: Endpoints for plugin data fetching.
  - `src/lib/components/`: Reusable Svelte components (e.g., `Module.svelte` which displays a single service/plugin).
  - `src/lib/plugins/`: Contains the logic for each individual plugin (e.g., `clock`, `sabnzbd`).
  - `src/hooks.server.ts`: Server-side request hooks, primarily for reading auth headers and initializing configuration.
- **Build & Task Management:**
  - `Dockerfile`: Defines the Docker image build process.
  - `Justfile`: Task runner script (`just run`, `just lint`, `just docker-build`).
- **Documentation:**
  - `README.md`: General project overview for users.
  - `ROADMAP.md`: Planned features and improvements.
  - `LLM_GUIDE.md`: This file.

## 4. Do's and Don'ts for AI Contributions

- **Do:**
  - ✅ Follow SvelteKit/TypeScript best practices.
  - ✅ Prioritize security; sanitize data sent to the client, validate API calls.
  - ✅ Keep code clean, readable, and add comments where necessary.
  - ✅ Run `just lint` and fix all errors/warnings.
  - ✅ Update `config.example.yaml` and `README.md` when adding/changing configuration or features.
  - ✅ **Keep this guide (`LLM_GUIDE.md`) updated with significant architectural changes, new dependencies, core components, or updated guidelines.**
  - ✅ Use the provided tools (`edit_file`, `write_to_file`, `run_command` via `just`).
  - ✅ Work incrementally and explain the purpose of changes clearly.
  - ✅ Refer to `src/lib/types.ts` as the source of truth for configuration structure.
- **Don't:**
  - ❌ **NEVER** expose sensitive configuration or internal URLs/API keys to the client.
  - ❌ Hardcode configuration values that should be in `config.yaml`.
  - ❌ Introduce code that fails linting (`just lint`).
  - ❌ Make large, complex changes without breaking them down.
  - ❌ Modify the user's runtime `config/config.yaml` directly. Only suggest changes or modify `config.example.yaml`.
  - ❌ Guess the configuration structure; always check `types.ts` and `config.ts`.

## 5. Styling Guide

To maintain visual consistency and leverage the theme capabilities, please adhere to the following styling principles:

- **Foundation:** Use [Tailwind CSS](https://tailwindcss.com/) utility classes for general layout and styling.
- **Component Library:** Utilize [DaisyUI](https://daisyui.com/) components and theme variables (`bg-base-100`, `text-primary`, etc.) extensively. Avoid custom CSS that overrides theme colors unless absolutely necessary. Use DaisyUI components like `card`, `btn`, `input`, `badge` where appropriate.
- **Layout:**
  - Use Flexbox (`flex`, `gap`, `justify-*`, `items-*`) for most layout tasks.
  - Follow the established padding and gap conventions (e.g., `p-4` for modules, `gap-4` for main sections).
- **Modules/Cards:**
  - Base new plugin displays on the structure of `src/lib/components/Module.svelte`.
  - Use `bg-base-200` or `bg-base-100` for card backgrounds, `border-base-300` for borders, and standard padding/rounding.
- **Typography:**
  - Use relative text sizes (`text-xs`, `text-sm`, `text-base`, `text-lg`, etc.).
  - Use `font-medium` or `font-bold` for emphasis (e.g., titles).
  - Use `opacity-75` or `text-neutral-content` / `text-base-content` variants for secondary information.
  - Employ `truncate` or `line-clamp-*` utilities to handle potential text overflow gracefully.
- **Icons:**
  - Prefer [Lucide Icons](https://lucide.dev/) (`lucide-svelte`) specified by name in `config.yaml`. Refer to `Module.svelte` for the implementation.
  - Maintain consistent icon sizing (around `h-5 w-5` or `size="20"`).
- **Responsiveness:** Ensure components adapt reasonably to different screen sizes. Test layouts on typical desktop widths.
- **Color & Theming:** Rely on DaisyUI theme colors. Use semantic colors like `text-success`, `text-error`, `text-warning` for status indicators.

By following these guidelines, we ensure Linkus remains visually cohesive and easy to theme.
