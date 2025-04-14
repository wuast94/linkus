import type { Service } from '$lib/types';

interface SabnzbdSlot {
	filename: string;
	size: string;
	sizeleft: string;
	percentage: string;
	status: string;
	timeleft: string;
}

interface SabnzbdResponse {
	queue: {
		slots: SabnzbdSlot[];
		speed: string;
		sizeleft: string;
		size: string;
		kbpersec: string;
		status: string;
	};
}

export function formatSpeed(kbps: number): string {
	if (kbps >= 1024 * 1024) {
		return `${(kbps / (1024 * 1024)).toFixed(2)} GB/s`;
	} else if (kbps >= 1024) {
		return `${(kbps / 1024).toFixed(2)} MB/s`;
	}
	return `${Math.round(kbps)} KB/s`;
}

export async function fetchSabnzbdData(service: Service) {
	try {
		const config = service.config ?? {};

		// Validate required config keys
		const apiKey = typeof config.api_key === 'string' ? config.api_key : undefined;
		const baseUrl = typeof config.base_url === 'string' ? config.base_url : undefined;

		if (!apiKey || !baseUrl) {
			throw new Error(
				'Sabnzbd API key or base URL is missing or invalid in service configuration.'
			);
		}

		// Construct API URL using validated config
		const apiUrl = new URL(`${baseUrl}/sabnzbd/api`);
		apiUrl.searchParams.set('mode', 'queue');
		apiUrl.searchParams.set('output', 'json');
		apiUrl.searchParams.set('apikey', apiKey);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

		let response: Response;
		try {
			response = await fetch(apiUrl.toString(), { signal: controller.signal });
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Sabnzbd request timed out after 15 seconds');
			} else {
				throw error; // Re-throw other fetch errors
			}
		} finally {
			clearTimeout(timeoutId);
		}

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const text = await response.text();
		try {
			const data = JSON.parse(text) as SabnzbdResponse;
			return {
				queue: data.queue.slots.map((slot) => ({
					name: slot.filename,
					size: slot.size,
					remaining: slot.sizeleft,
					progress: parseInt(slot.percentage, 10),
					status: slot.status,
					timeLeft: slot.timeleft
				})),
				speed: formatSpeed(parseFloat(data.queue.kbpersec)),
				remaining: data.queue.sizeleft
			};
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to parse JSON response: ${message}`);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to fetch Sabnzbd data: ${message}`);
	}
}
