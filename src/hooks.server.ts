// See https://kit.svelte.dev/docs/types#app
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { getConfig, initializeConfiguration } from '$lib/utils/config';

// --- Initialize Configuration --- START
try {
	initializeConfiguration();
} catch (err) {
	console.error('Failed to initialize application on server startup:', err);
	// Decide if the application should exit or handle the error gracefully
	// process.exit(1); // Example: Exit if config is critical
}
// --- Initialize Configuration --- END

// Extend the Locals interface (Standard SvelteKit practice)

declare global {
	/* trunk-ignore(eslint/@typescript-eslint/no-namespace) */
	namespace App {
		interface Locals {
			user: {
				user: string;
				name: string;
				email: string;
				groups: string[];
			};
		}
		// Potentially add interface Error { message: string; stack?: string; code?: string } if needed
	}
}

/** @type {Handle} */
export const handle: Handle = async ({ event, resolve }) => {
	// Get headers
	const headers = event.request.headers;
	const config = getConfig();

	// Check if testHeader is set in config
	let userData: App.Locals['user'] = {
		user: '',
		name: '',
		email: '',
		groups: []
	};

	// Use test headers in dev mode if present in config
	if (config && config['Remote-User'] && process.env.NODE_ENV === 'development') {
		console.log('Using test headers for user authentication.');
		userData = {
			user: config['Remote-User'] || '',
			name: config['Remote-Name'] || '',
			email: config['Remote-Email'] || '',
			groups: config['Remote-Groups']?.split(',').map((g) => g.trim()) || []
		};
	} else {
		// Extract user info from actual headers
		userData = {
			user: headers.get('remote-user') || '',
			name: headers.get('remote-name') || '',
			email: headers.get('remote-email') || '',
			groups:
				headers
					.get('remote-groups')
					?.split(',')
					.map((g) => g.trim()) || []
		};
	}

	// Make user data available to the rest of the app
	event.locals.user = userData;

	const response = await resolve(event);

	// Add cache-control headers to prevent browser caching
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	response.headers.set('Pragma', 'no-cache'); // HTTP 1.0 backward compatibility
	response.headers.set('Expires', '0'); // Proxies
	response.headers.set('Surrogate-Control', 'no-store'); // CDN caching control

	return response;
};

/** @type {HandleServerError} */
export const handleError: HandleServerError = ({ error, event }) => {
	// Log a concise error message
	console.error(
		`🚨 Server Error: ${(error as Error)?.message ?? 'Unknown error'} (URL: ${event.request.url})`
	);

	// Optionally log the full error in development for debugging
	if (process.env.NODE_ENV === 'development') {
		console.error('Full error details:', error);
	}

	// Basic error information to return (optional, customize error page via $error.svelte)
	return {
		message: `An unexpected error occurred: ${(error as Error)?.message ?? 'Unknown error'}`
		// You could add an error code or ID here if needed
	};
};
