import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import nodeFetch from 'node-fetch';
import https from 'https';
import http from 'http';
import process from 'process'; // Import process for NODE_ENV

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		return json({ online: false, error: 'No URL provided' });
	}

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
			responseTime: null
		});
	} catch (error) {
		// Log concise error
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error(`🚨 HTTP Check Error: ${errorMessage} (Target URL: ${targetUrl})`);

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
