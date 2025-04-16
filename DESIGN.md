# Linkus Project Overview

## Introduction

Linkus is a **single-page web application** designed as a customizable homepage hub. It provides quick access and status updates for various services and integrates specialized plugins for richer content display. Built with **SvelteKit**, it prioritizes user-friendliness, modularity, and security.

## Core Features

### Modules

- **Service Representation:** Each module represents a configured service (e.g., Sonarr, Radarr). It displays the service's status (via ping) and response time in the upper right corner and acts as a direct link to the service interface.
- **Dynamic Display:** Modules are displayed based on the user's group membership, controlled by the authentication proxy (e.g., Authelia via Traefik).

### Plugins

- **Custom Content Display:** Plugins extend functionality beyond simple links and status checks. They display dynamic, service-specific content directly within the Linkus interface. Examples include:
  - `arrCalendar`: Shows upcoming releases from Sonarr/Radarr calendars.
  - `sabnzbd`: Displays the current download queue status.
  - `Clock`: A simple clock display.
- **Self-Contained:** Plugins are designed to be self-contained within their respective folders (`src/lib/plugins/`), minimizing impact on the core application. Adding new plugins involves creating a new folder and ensuring the backend API handler is registered.
- **Configuration-Based Display:** The frontend dynamically renders plugins based on the services defined in `config/config.yaml`. Each plugin typically interacts with one or more configured services.

## Architecture

### Frontend

- **Framework:** Built with **SvelteKit**, leveraging Svelte for reactive UI components.
- **Styling:**
  - **Tailwind CSS:** Used for utility-first styling and layout. Configuration is in `tailwind.config.ts`.
  - **CSS Variables:** A custom theme, inspired by Dracula, is defined using CSS variables in `src/lib/styles/theme.css`. This file is the single source of truth for colors, fonts, and other style constants.
  - **Usage:** Apply styles using Tailwind utility classes (configured to respect the theme variables) or directly use CSS variables in `<style>` blocks (e.g., `color: var(--text-primary);`). Avoid hardcoding color values.
  - **Component/Plugin Styling:** Individual components or plugins can define their own styles within `<style>` tags. For styling third-party libraries (like FullCalendar in `arrCalendar`), use `:global()` selectors and map the library's CSS variables to the application's theme variables (e.g., `--fc-border-color: var(--border-primary);`).

### Backend (SvelteKit Endpoints)

- **API Endpoints:** SvelteKit server routes (`src/routes/api/...`) handle backend logic, including:
  - Fetching data for plugins from external service APIs.
  - Proxying requests where necessary.
- **Plugin API Handling:** A dynamic routing system (`src/routes/api/plugins/[plugin]/[service]/+server.ts`) dispatches requests to the correct plugin's API handler (`api.ts`).
- **Security:** Backend endpoints ensure users only receive data for services they are authorized to access, based on group membership provided by the authentication proxy. Sensitive information like API keys are stored server-side in the configuration and never exposed to the client.

## Security

- **Authentication & Authorization:** Relies on an external authentication proxy like **Traefik** with **Authelia**. User identity and group memberships are expected in request headers.
- **Group-Based Access:** Content (Modules and Plugin data) is filtered based on the user's groups defined in `config/config.yaml`.
- **Data Minimization:** Only necessary data is fetched and sent to the frontend. Sensitive configuration details remain on the server.

## Logging

- **Importance:** Logging is crucial for debugging service interactions and application behavior.
- **Implementation:** Uses standard `console.log`, `console.warn`, `console.error` within SvelteKit endpoints and component logic.
- **Best Practices:** Log meaningful information, especially for API requests/responses and errors. Avoid logging excessively large objects or sensitive data. Focus on what's needed for troubleshooting.

## Development Guidelines

- **Modular Design:** Keep plugins and modules decoupled. Plugins should ideally function independently, relying only on the core framework and their specific service interactions.
- **Configuration Driven:** Functionality is primarily driven by `config/config.yaml`. Avoid hardcoding service details or URLs.
- **Theme Consistency:** Adhere to the defined theme variables in `src/lib/styles/theme.css` for a consistent look and feel.

## Conclusion

Linkus aims to be a **modular**, **secure**, and **user-friendly** web application serving as a **central hub** for services. By leveraging **SvelteKit**, **Tailwind CSS**, and a **CSS variable-based theme**, the project focuses on **scalability** and **maintainability**. All user-facing configuration is managed centrally in `config/config.yaml`.
