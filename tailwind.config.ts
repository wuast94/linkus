import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				dracula: {
					background: '#282a36',
					'current-line': '#44475a',
					foreground: '#f8f8f2',
					comment: '#6272a4',
					cyan: '#8be9fd',
					green: '#50fa7b',
					orange: '#ffb86c',
					pink: '#ff79c6',
					purple: '#bd93f9',
					red: '#ff5555',
					yellow: '#f1fa8c'
				},
				dark: {
					DEFAULT: '#282a36', // dracula background
					900: '#21222c', // slightly darker than background
					800: '#282a36', // dracula background
					700: '#44475a' // dracula current-line
				},
				primary: {
					DEFAULT: '#bd93f9', // dracula purple
					light: '#ff79c6', // dracula pink
					dark: '#6272a4' // dracula comment
				},
				success: {
					DEFAULT: '#50fa7b', // dracula green
					light: '#69ff94', // lighter green
					dark: '#41c462' // darker green
				},
				error: {
					DEFAULT: '#ff5555', // dracula red
					light: '#ff6e6e', // lighter red
					dark: '#cc4444' // darker red
				},
				warning: {
					DEFAULT: '#ffb86c', // dracula orange
					light: '#ffd285', // lighter orange
					dark: '#cc9356' // darker orange
				},
				text: {
					DEFAULT: '#f8f8f2', // dracula foreground
					secondary: '#6272a4', // dracula comment
					muted: '#44475a' // dracula current-line
				},
				border: {
					DEFAULT: '#44475a', // dracula current-line
					light: '#6272a4', // dracula comment
					dark: '#282a36' // dracula background
				}
			}
		}
	},
	plugins: []
} satisfies Config;
