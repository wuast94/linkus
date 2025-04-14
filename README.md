# Linkus

A modern web application built with SvelteKit, featuring a Dracula-themed design system.

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Styling Guide

The application uses a custom Dracula theme implementation with Tailwind CSS. The styling system is built around consistent color usage and component styling.

### Color Palette

The Dracula theme colors are available as CSS variables and Tailwind classes:

```css
/* Base Colors */
--background: #282a36 /* Main background */ --current-line: #44475a /* Secondary background */
	--foreground: #f8f8f2 /* Primary text */ --comment: #6272a4 /* Secondary text */ --cyan: #8be9fd
	/* Accents, links */ --green: #50fa7b /* Success states */ --orange: #ffb86c /* Warnings */
	--pink: #ff79c6 /* Hover states */ --purple: #bd93f9 /* Primary buttons */ --red: #ff5555
	/* Error states */ --yellow: #f1fa8c /* Highlights */;
```

### Using the Theme

#### Tailwind Classes

```html
<div class="bg-dracula-background text-dracula-foreground">
	<button class="bg-dracula-purple hover:bg-dracula-pink"></button>
</div>
```

#### Predefined Components

1. Cards:

```html
<div class="card"><!-- Card content --></div>
```

2. Buttons:

```html
<!-- Primary Button -->
<button>Click Me</button>
<!-- Secondary Button -->
<button class="secondary">Click Me</button>
```

3. Typography:

```html
<h1>Large Purple Heading</h1>

<h2>Medium Cyan Heading</h2>

<h3>Small Pink Heading</h3>
```

4. Form Elements:

```html
<input type="text" /> <textarea></textarea>
<select></select>
```

### Best Practices

1. Use semantic color variables for consistent theming
2. Utilize the card component for contained content
3. Follow the button hierarchy (primary/secondary) for clear user actions
4. Maintain consistent spacing using Tailwind's spacing utilities
5. Use provided text colors for proper contrast and readability

## Development

To modify the theme, edit the following files:

- `src/lib/styles/theme.css`: CSS variables and theme definitions
- `src/app.css`: Global styles and component definitions
- `tailwind.config.ts`: Tailwind configuration and color palette

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
