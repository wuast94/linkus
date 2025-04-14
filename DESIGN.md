# Web Application Project Overview

## Introduction

We aim to develop a **single-page web application** that serves as a homepage hub for various services. The application will be built using **Svelte** and should be user-friendly, modular, and secure.

## Core Features

### Modules

- **Service Representation:** Each module represents a service, displays its status via ping and ms in the upper right corner, and acts as a link to the service.
- **Dynamic Display:** Modules are displayed based on the user's group membership.

### Plugins

- **Custom Content Display:** Plugins differ from modules as they display custom content, such as a calendar or a downloader showing actual progress.
- **Easy Integration:** Plugins should be easy to add and fully self-contained within their own folders, without affecting the main codebase.
- **Configuration-Based Display:** The application dynamically checks the `config.yaml` in an extra config folder to determine which plugins to display. the extra folder is important becouse it should lader be run with docker and an extra config folder makes it easier to setup and use with volume mappings.

## Architecture

### Frontend

- **Framework:** Built with **Svelte**.
- **Styling:** Utilizes **Tailwind CSS** with the official **Dracula Theme** plugin. Avoid using static hex colors; instead, use available CSS variables.
- **Theme Integration example:**

  ```html
  <div class="bg-buffy">
  	<p class="text-nosferatu">I vant to suck your blood...</p>
  </div>
  ```

- **Theme Colors:**
  - **Color Names:** `darker`, `dark`, `light`, `blue`, `cyan`, `green`, `orange`, `pink`, `purple`, `red`, `yellow`, `nosferatu`, `aro`, `cullen`, `vonCount`, `vanHelsing`, `blade`, `morbius`, `buffy`, `dracula`, `marcelin`, `lincoln`.
  - **Shades:** `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`.

### Backend

- **Data Fetching:** The backend periodically fetches data required by the frontend. The data fetching will be plugin specific, some plugins might poll date or gets them pushed, also they may poll them on diffrent intervals.
- **Security:** Only data that the user is authorized to see is sent to the frontend.
- **Technologies:** Choose appropriate technologies that integrate well with **Svelte** for backend operations.

## Security

- **User Groups:** Display content based on user groups, ensuring users only see what they are permitted to.
- **Authentication:** Integrate with existing authentication mechanisms, such as **Traefik** with **Authelia**.
- **Data Protection:** We will never send data to the frontend/client that it doesnt need, so we send only visbile data to the frontend/client.

## Logging

- Logging is extremely important for debugging. Use defaults or a special libary as you want.
- Never flood with logs, only use them where they are needed, and add them for debugging as needed. but make always sure to only log what we really need, we dont want to get all headers, only the ones we intrested in for example. when we get api data dont thtough the whole response, only the data we need as another example.

## Development Guidelines

- **Modular Design:** Keep plugins and modules decoupled from the main codebase to facilitate easy additions and maintenance. So we can develop new plugins or modules without affecting the main codebase.

## Conclusion

This project focuses on creating a **modular** and **secure** web application that serves as a **central hub** for various services. By utilizing **Svelte** and following best practices in web development, we aim to build a **scalable** and **maintainable** application. We dont need any settings in the app, everything is handled by the config file.
