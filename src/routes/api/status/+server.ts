import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import nodeFetch from 'node-fetch';
import https from 'https';
import http from 'http';
import process from 'process'; // Import process for NODE_ENV
import { getConfig } from '$lib/utils/config'; // Import getConfig

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		return json({ online: false, error: 'No URL provided' }, { status: 400 });
	}

	// --- Server-Side Validation --- 
	try {
		const config = getConfig();
		const allowedUrls = config.services.map(service => service.url);

		if (!allowedUrls.includes(targetUrl)) {
			console.warn(`🚨 Blocked attempt to check unauthorized URL: ${targetUrl}`);
			return json({ online: false, error: 'Unauthorized URL' }, { status: 403 }); // Forbidden
		}
	} catch (configError) {
		console.error("🚨 Failed to load configuration for URL validation:", configError);
		return json({ online: false, error: 'Internal Server Error (Config)' }, { status: 500 });
	}
	// --- End Validation ---

	const isHttps = targetUrl.startsWith('https://');
	const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

	try {
		const controller = new AbortController();
		// Increase timeout to 10 seconds (10000 ms)
		const timeout = setTimeout(() => controller.abort(), 10000);

		const response = await nodeFetch(targetUrl, {
			method: 'GET',
			signal: controller.signal,
			agent
		});

		clearTimeout(timeout);
		return json({
			online: response.ok,
			status: response.status,
			statusText: response.statusText,
			responseTime: null // We don't calculate this server-side currently
		});
	} catch (error) {
		// Log concise error - This should now only log for *validated* URLs
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error(`🚨 HTTP Check Error: ${errorMessage} (Validated Target URL: ${targetUrl})`);

		// Log full details only in development
		if (process.env.NODE_ENV === 'development') {
			console.error('Full ping error details:', error);
		}

		return json({
			online: false,
			error: errorMessage // Use the extracted message
			// Removed details: error.stack
		});
	}
};
