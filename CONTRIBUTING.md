# Contributing to Linkus

Thank you for your interest in contributing to Linkus! We appreciate your help in making this project better. To ensure a smooth collaboration, please follow these guidelines.

## Getting Started

1.  **Fork & Clone:** Fork the repository and clone it locally.
2.  **Dependencies:** Install dependencies with `npm install`.
3.  **Configuration:** Copy `config.example.yaml` to `config/config.yaml` and adjust it for your local services.
4.  **Development Tools:**
    - **Just:** We use `just` (a command runner) for common tasks. See the `Justfile` for available commands. The main command is `just`, which builds and runs the Docker container.
    - **Trunk:** We use `trunk` for linting and formatting. Please install it ([https://trunk.io/](https://trunk.io/)). Ensure your code passes `trunk check --all -y` before committing. The Trunk VS Code extension can be configured for format-on-save functionality.

## Development Workflow

1.  Create a new branch for your feature or bug fix: `git checkout -b feat/my-new-feature` or `git checkout -b fix/issue-123`.
2.  Make your changes. Ensure code passes linting (`trunk check --all -y`).
3.  Commit your changes following the Conventional Commits format (see below).
4.  Push your branch to your fork: `git push origin feat/my-new-feature`.
5.  Open a Pull Request (PR) against the `main` branch of the original repository.

## Conventional Commits

We strictly follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This allows for automated changelog generation and semantic versioning.

**Format:**

- **`<type>`:** feat | fix | docs | style | refactor | perf | chore | build | ci (Mandatory)
- **`(<scope>)`:** Module/area affected (e.g., core, ui, config, plugin/arrCalendar) (Optional)
- **`<description>`:** Short summary in present tense. Not capitalized. No period. (Mandatory)

**Types:**

- **feat**: A new feature for the user (bumps `MINOR` version).
- **fix**: A bug fix for the user (bumps `PATCH` version).
- **docs**: Documentation only changes.
- **style**: Code style changes (formatting, whitespace).
- **refactor**: Code changes that neither fix a bug nor add a feature.
- **perf**: Performance improvements.
- **chore**: Build process, dependency updates, etc.
- **build**: Changes impacting the build system or external dependencies.
- **ci**: Changes to CI configuration and scripts.

**Breaking Changes (`!`):**

Append `!` **before the colon** in the header to indicate a breaking change (bumps `MAJOR` version). A `BREAKING CHANGE:` footer note is also required.

```
refactor(auth)!: switch JWT library
BREAKING CHANGE: User sessions are invalidated. Users must log in again.
```

**Linkus Examples:**

```
feat(plugin/sabnzbd): display download speed
```

```
fix(core): handle missing API key in config gracefully
```

```
refactor(ui): extract Module component logic
```

```
docs(plugin/arrCalendar): add setup instructions
```

```
chore(deps): update SvelteKit to latest version
```

```
style(plugin/clock): adjust text alignment
```

## Adding New Plugins

Plugins are designed to be self-contained modules dynamically loaded by the application.

1.  **Directory:** Create a new directory under `src/lib/plugins/your-plugin-name`.
2.  **Frontend Component:** Add an `index.svelte` file. This is the main Svelte component for your plugin's UI.
3.  **Backend Logic (Optional):** If your plugin needs to fetch data from an external API, add an `api.ts` file exporting a `GET` function (following SvelteKit endpoint conventions). This function will be dynamically imported and called by `src/routes/api/plugins/[plugin]/[service]/+server.ts`.
4.  **Styling:**
    - Use Tailwind CSS utility classes where possible.
    - For custom styles, use a `<style>` block within your `index.svelte`.
    - Adhere to the application's theme variables defined in `src/lib/styles/theme.css`. Use `var(--variable-name)`.
    - If styling third-party components (like FullCalendar), use `:global()` selectors and map their styles to the theme variables.
    - **Adding Colors:** If your plugin _requires_ a new color not present in the theme, you **must** add the corresponding variable to **all** theme definitions within `src/lib/styles/theme.css` to maintain consistency. Document the new variable.
5.  **Configuration:** Plugins are typically associated with services defined in `config/config.yaml`. Your plugin's frontend and backend logic will receive the relevant service configuration.

## Code Style & Linting

- We use **Trunk** for code formatting and linting.
- Please run `trunk check --all -fix` before committing to ensure your code meets the project standards.
- Trunk integrates with Git hooks to check code automatically before commits.

Thank you again for contributing!
