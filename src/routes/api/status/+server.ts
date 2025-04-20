import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import nodeFetch, { Headers } from 'node-fetch';
import https from 'https';
import http from 'http';
import process from 'process'; // Import process for NODE_ENV
import { getConfig } from '$lib/utils/config'; // Import getConfig

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		return json({ online: false, error: 'No URL provided' }, { status: 400 });
	}

	// --- Server-Side Validation & Header Retrieval ---
	let serviceHeaders: Record<string, string> | undefined;
	try {
		const config = getConfig();
		// Find the specific service config matching the URL
		const service = config.services.find((s) => s.url === targetUrl);

		if (!service) {
			console.warn(`🚨 Blocked attempt to check unauthorized URL: ${targetUrl}`);
			return json({ online: false, error: 'Unauthorized URL' }, { status: 403 }); // Forbidden
		}

		// Get headers from the specific service config if type is http_check and headers exist
		if (service.type === 'http_check' && service.headers) {
			serviceHeaders = service.headers;
		}
	} catch (configError) {
		console.error('🚨 Failed to load configuration for URL validation:', configError);
		return json({ online: false, error: 'Internal Server Error (Config)' }, { status: 500 });
	}
	// --- End Validation ---

	const isHttps = targetUrl.startsWith('https://');
	const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);

		const startTime = performance.now(); // Start timing
		const response = await nodeFetch(targetUrl, {
			method: 'GET',
			signal: controller.signal,
			agent,
			headers: serviceHeaders ? new Headers(serviceHeaders) : undefined // Pass headers if defined
		});
		const endTime = performance.now(); // End timing

		clearTimeout(timeout);
		const responseTime = Math.round(endTime - startTime); // Calculate response time

		return json({
			online: response.ok,
			status: response.status,
			statusText: response.statusText,
			responseTime: responseTime // Return calculated response time
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error(`🚨 HTTP Check Error: ${errorMessage} (Validated Target URL: ${targetUrl})`);

		if (process.env.NODE_ENV === 'development') {
			console.error('Full ping error details:', error);
		}

		return json({
			online: false,
			error: errorMessage
		});
	}
};
