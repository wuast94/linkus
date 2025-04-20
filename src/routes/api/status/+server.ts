import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import nodeFetch, { Headers } from 'node-fetch';
import https from 'https';
import http from 'http';
import process from 'process'; // Import process for NODE_ENV
import { getConfig } from '$lib/utils/config'; // Import getConfig

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url'); // This is the USER-FACING URL
	if (!targetUrl) {
		return json({ online: false, error: 'No URL provided' }, { status: 400 });
	}

	// --- Server-Side Validation & Header Retrieval --- START
	let urlToPing: string | undefined;
	let serviceHeaders: Record<string, string> | undefined; // Keep headers logic

	try {
		const config = getConfig();
		// Find the specific service config matching the USER-FACING URL
		const service = config.services.find((s) => s.url === targetUrl);

		if (!service) {
			console.warn(
				`🚨 Blocked attempt to check status for unconfigured user-facing URL: ${targetUrl}`
			);
			return json({ online: false, error: 'Unconfigured Service URL' }, { status: 404 }); // Not Found or Forbidden?
		}

		// Determine the actual URL to ping
		urlToPing = service.check_url || service.url; // Use check_url if present, else fallback to url

		// Validate that we have a URL to ping for http_check types
		if (service.type === 'http_check' && !urlToPing) {
			console.error(
				`🚨 Misconfiguration: Service '${service.name}' is type http_check but has no url or check_url defined.`
			);
			return json(
				{ online: false, error: 'Service Misconfigured (Missing Check URL)' },
				{ status: 500 }
			);
		}

		// Get headers (if defined) - this logic remains the same
		if (service.type === 'http_check' && service.headers) {
			serviceHeaders = service.headers;
		}
	} catch (configError) {
		console.error('🚨 Failed to load configuration for URL validation:', configError);
		return json({ online: false, error: 'Internal Server Error (Config)' }, { status: 500 });
	}
	// --- Server-Side Validation & Header Retrieval --- END

	// If urlToPing is somehow still undefined (e.g., not an http_check type service was requested?), error out.
	if (!urlToPing) {
		// This case should ideally be caught earlier if the service type necessitates a URL.
		console.error(`🚨 Could not determine a URL to ping for user-facing URL: ${targetUrl}`);
		return json({ online: false, error: 'Cannot determine ping target' }, { status: 500 });
	}

	const isHttps = urlToPing.startsWith('https://');
	const agent = isHttps ? new https.Agent({ rejectUnauthorized: false }) : new http.Agent();

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);

		const startTime = performance.now(); // Start timing
		const response = await nodeFetch(urlToPing, {
			// Use urlToPing here
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
		const errorMessage = error instanceof Error ? error.message : String(error);
		// Log both the user-facing URL and the URL that was actually checked
		console.error(
			`🚨 HTTP Check Error: ${errorMessage} (User URL: ${targetUrl}, Checked URL: ${urlToPing})`
		);

		if (process.env.NODE_ENV === 'development') {
			console.error('Full ping error details:', error);
		}

		return json({
			online: false,
			error: errorMessage
		});
	}
};
