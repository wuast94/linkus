import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0' // Keep this for dev server accessibility in Docker
	},
	// Add build options for SSR
	build: {
		rollupOptions: {
			external: ['ping'] // Treat 'ping' as external during build
		}
	}
});
