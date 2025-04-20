import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit'; // Import directly from kit
import { getConfig } from '$lib/utils/config';
import type { PingCheck, WebCheckJson, WebCheckText } from '$lib/types'; // Removed CriticalAlertConfig
import ping from 'ping';
import { JSONPath } from 'jsonpath-plus';

interface AlertStatus {
	name: string;
	status: 'ok' | 'error';
	message?: string;
}

// --- Check Functions ---

async function performPingCheck(alert: PingCheck): Promise<AlertStatus> {
	try {
		const res = await ping.promise.probe(alert.target, {
			timeout: 5, // 5 second timeout
			min_reply: 1
		});
		if (res.alive) {
			return { name: alert.name, status: 'ok' };
		} else {
			return { name: alert.name, status: 'error', message: res.output || 'Host unreachable' };
		}
	} catch (e: unknown) {
		// Use unknown
		console.error(`Ping check failed for ${alert.name} (${alert.target}):`, e);
		const message = e instanceof Error ? e.message : 'Ping execution failed';
		return { name: alert.name, status: 'error', message };
	}
}

async function performWebCheckJson(alert: WebCheckJson): Promise<AlertStatus> {
	try {
		const response = await fetch(alert.target, { signal: AbortSignal.timeout(10000) }); // 10s timeout
		if (!response.ok) {
			return {
				name: alert.name,
				status: 'error',
				message: `HTTP Error: ${response.status} ${response.statusText}`
			};
		}
		const responseData = await response.json();

		const result = JSONPath({ path: alert.json_path, json: responseData });

		if (result && result.length > 0) {
			// Compare the first result found
			// Note: JSONPath can return multiple matches. We check the first one.
			// Comparison logic might need refinement based on expected types (string, number, boolean)
			if (String(result[0]) === String(alert.expected_value)) {
				return { name: alert.name, status: 'ok' };
			} else {
				return {
					name: alert.name,
					status: 'error',
					message: `Expected '${alert.expected_value}' at '${alert.json_path}', but got '${result[0]}'`
				};
			}
		} else {
			return {
				name: alert.name,
				status: 'error',
				message: `JSONPath '${alert.json_path}' not found in response`
			};
		}
	} catch (e: unknown) {
		// Use unknown
		// Log less verbosely for common network/DNS errors
		if (
			e instanceof Error &&
			e.cause &&
			typeof e.cause === 'object' &&
			'code' in e.cause &&
			(e.cause.code === 'ENOTFOUND' || e.cause.code === 'ECONNREFUSED')
		) {
			console.warn(`Web JSON check failed for ${alert.name} (${alert.target}): ${e.cause.code}`);
		} else {
			console.error(`Web JSON check failed for ${alert.name} (${alert.target}):`, e);
		}
		const message = e instanceof Error ? e.message : 'Web JSON check execution failed';
		return { name: alert.name, status: 'error', message };
	}
}

async function performWebCheckText(alert: WebCheckText): Promise<AlertStatus> {
	try {
		const response = await fetch(alert.target, { signal: AbortSignal.timeout(10000) }); // 10s timeout
		if (!response.ok) {
			return {
				name: alert.name,
				status: 'error',
				message: `HTTP Error: ${response.status} ${response.statusText}`
			};
		}
		const responseText = await response.text();

		if (alert.text_present && !responseText.includes(alert.text_present)) {
			return {
				name: alert.name,
				status: 'error',
				message: `Expected text '${alert.text_present}' not found`
			};
		}

		if (alert.text_absent && responseText.includes(alert.text_absent)) {
			return {
				name: alert.name,
				status: 'error',
				message: `Unexpected text '${alert.text_absent}' found`
			};
		}

		return { name: alert.name, status: 'ok' };
	} catch (e: unknown) {
		// Use unknown
		// Log less verbosely for common network/DNS errors
		if (
			e instanceof Error &&
			e.cause &&
			typeof e.cause === 'object' &&
			'code' in e.cause &&
			(e.cause.code === 'ENOTFOUND' || e.cause.code === 'ECONNREFUSED')
		) {
			console.warn(`Web Text check failed for ${alert.name} (${alert.target}): ${e.cause.code}`);
		} else {
			console.error(`Web Text check failed for ${alert.name} (${alert.target}):`, e);
		}
		const message = e instanceof Error ? e.message : 'Web Text check execution failed';
		return { name: alert.name, status: 'error', message };
	}
}

// --- GET Handler ---

export const GET: RequestHandler = async ({ url }: { url: URL }) => {
	// Explicitly type url
	try {
		const config = getConfig();
		const alertName = url.searchParams.get('name');

		if (!alertName) {
			throw error(400, 'Missing required query parameter: name');
		}

		const alertConfig = config.critical_alerts?.find((a) => a.name === alertName);

		if (!alertConfig) {
			// IMPORTANT: Do not reveal that the alert doesn't exist vs access denied.
			// If we implement user filtering later, this needs refinement.
			throw error(404, `Alert configuration not found: ${alertName}`);
		}

		let result: AlertStatus;

		switch (alertConfig.type) {
			case 'ping':
				result = await performPingCheck(alertConfig as PingCheck);
				break;
			case 'web_json':
				result = await performWebCheckJson(alertConfig as WebCheckJson);
				break;
			case 'web_text':
				result = await performWebCheckText(alertConfig as WebCheckText);
				break;
			default:
				throw error(500, 'Internal server error: Unknown alert type');
		}

		return json(result);
	} catch (e: unknown) {
		// Use unknown
		// Handle errors specifically thrown by `error()` or other unexpected errors
		// Basic check if it looks like a SvelteKit HttpError
		if (typeof e === 'object' && e !== null && 'status' in e && 'body' in e) {
			// Re-throw SvelteKit errors
			throw e;
		} else {
			console.error('Unexpected error in /api/alerts/status:', e);
			// Try to get a message, default otherwise
			const message = e instanceof Error ? e.message : 'Internal Server Error';
			throw error(500, message);
		}
	}
};
