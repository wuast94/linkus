# Linkus

Linkus is a dynamic and configurable homepage dashboard designed specifically for **self-hosters who use an external authentication proxy (like Traefik + Authelia) for Single Sign-On (SSO)**. It provides a central hub for accessing your services and viewing their status.

The key feature of Linkus is its ability to **dynamically display services and plugins based on the logged-in user's group membership**, provided by the authentication proxy. This makes it ideal for sharing services with friends and family, as each user only sees the services they are authorized to access.

Built with SvelteKit. Linkus is modular, themeable, and extensible.

![Linkus Screenshot (Placeholder)](placeholder.png) _<!-- TODO: Add a real screenshot -->_

## Features

- **Dynamic Visibility:** Automatically shows/hides services and plugins based on user group memberships obtained from authentication proxy headers.
- **Service Modules:** Displays configured services with status checks and direct links.
- **Plugin System:** Allows adding custom components (e.g., calendar, download queue) linked to services, also respecting group permissions. Current plugins include `arrCalendar`, `sabnzbd`, `clock`.
- **Configurable:** All services, categories, and user access mappings are managed via `config/config.yaml`.
- **Theming:** Uses Tailwind CSS with [DaisyUI](https://daisyui.com/) components and its themes.
- **SSO Integration:** Designed to work seamlessly behind an authentication proxy.

## Getting Started

### Running with Docker Compose

This is the recommended method for deployment using the pre-built image from Docker Hub.

1.  **Get the Compose File:**
    - Use the [**`docker-compose.yml`**](./docker-compose.yml) file included in this repository.
2.  **Run:**
    - Place the `docker-compose.yml` file in your desired deployment directory.
    - Run `docker compose up -d` from that directory.
3.  **Configure:**
    - Linkus will be available at `http://localhost:3000` (or the host port you mapped in the compose file).
    - On the first run, Linkus will create an example `config.yaml` inside a `linkus-config` directory (relative to your compose file location).
    - **Edit `linkus-config/config.yaml`** with your services, categories, and user groups.
    - Restart the container after editing the config: `docker compose restart linkus`

### Local Development / Building Locally

If you want to modify the Linkus code itself:

1.  **Prerequisites:**
    - [Docker](https://www.docker.com/)
    - [Node.js](https://nodejs.org/)
    - [`just`](https://github.com/casey/just) (Command runner)
2.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/linkus.git # Replace with actual repo URL
    cd linkus
    ```

3.  **Install dependencies:**

    Only needed if using an IDE that requires dependencies to be installed.

    ```bash
    just update
    ```

4.  **Configure:**

    - Create `config/config.yaml` based on `config.example.yaml` and edit it.

5.  **Build Local Docker Image (using Just):**
    To test a production-like build locally using Docker, use the `just` command. This builds the image from your local source code.
    ```bash
    just # Builds the image and runs the container
    ```

## Configuration

All application settings, including services, categories, plugin visibility, and user access control (group mappings), are managed in `config/config.yaml`. Please refer to `config.example.yaml` for detailed structure and comments.

## Contributing

Contributions are welcome! Please read our [**Contributing Guidelines**](./CONTRIBUTING.md) for details on the development workflow, coding standards (including Trunk linting), and commit message conventions.

For insights into the project's architecture and design decisions, please see the [**Design Document**](./Design.md).

---

🤖 Note: This project was completly developed with the assistance of AI language models.
