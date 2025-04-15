import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Backgrounds
				background: 'var(--bg-primary)',
				'background-secondary': 'var(--bg-secondary)',
				'background-tertiary': 'var(--bg-tertiary)',

				// Text
				foreground: 'var(--text-primary)',
				'foreground-secondary': 'var(--text-secondary)',
				'foreground-tertiary': 'var(--text-tertiary)',
				'foreground-accent': 'var(--text-on-accent)',

				// Accents
				primary: 'var(--accent-primary)',
				'primary-hover': 'var(--accent-primary-hover)',
				secondary: 'var(--accent-secondary)',
				'secondary-hover': 'var(--accent-secondary-hover)',

				// Borders
				border: 'var(--border-primary)',
				'border-secondary': 'var(--border-secondary)',
				'border-focus': 'var(--border-focus)',

				// Status
				success: 'var(--status-success)',
				error: 'var(--status-error)',
				warning: 'var(--status-warning)',
				info: 'var(--status-info)',

				// Links
				link: 'var(--link-primary)',
				'link-hover': 'var(--link-hover)'
			},
			borderRadius: {
				sm: 'var(--radius-sm)',
				DEFAULT: 'var(--radius-md)', // Default border radius
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				full: 'var(--radius-full)'
			}
		}
	},
	plugins: []
} satisfies Config;
