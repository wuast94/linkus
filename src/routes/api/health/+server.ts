import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * Simple health check endpoint.
 * Returns 200 OK if the server is running.
 */
export const GET: RequestHandler = async () => {
	// You could add more complex checks here if needed (e.g., database connection)
	return json({ status: 'ok' }, { status: 200 });
};

/**
 * Allow HEAD requests for efficient checks.
 */
export const HEAD: RequestHandler = async () => {
	// Respond with 200 OK but no body for HEAD requests
	return new Response(null, { status: 200 });
};
