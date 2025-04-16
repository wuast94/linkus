import daisyui from 'daisyui';

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
	plugins: [daisyui],
	daisyui: {
		themes: true, // true: all themes | false: only light + dark | array: specific themes like ['light', 'dark', 'cupcake']
		darkTheme: 'dark', // name of one of the included themes for dark mode
		base: true, // applies background color and foreground color for root element by default
		styled: true, // include daisyUI colors and design decisions for all components
		utils: true, // adds responsive and modifier utility classes
		logs: true // Shows info about daisyUI version and used config in the console when building your CSS
	}
};
