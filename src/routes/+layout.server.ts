import type { LayoutServerLoad } from './$types';
import { getConfig } from '$lib/utils/config';
import type { User, CriticalAlertConfig, Config } from '$lib/types';

/**
 * Represents the sanitized critical alert data passed to the client.
 * Only includes properties safe for browser exposure.
 */
export interface ClientSafeCriticalAlert {
	name: string;
	type: 'ping' | 'web_json' | 'web_text';
	interval?: number; // Default interval will be handled client-side if needed
}

export const load: LayoutServerLoad = ({ request }) => {
	try {
		// --- Get Config --- Correctly load config
		const config: Config = getConfig();

		// --- Get User Info --- Extract user from headers
		// Get header names from config, falling back to defaults
		const userHeader = config['Remote-User'] || 'Remote-User';
		const nameHeader = config['Remote-Name'] || ''; // Optional, might not be present
		const groupsHeader = config['Remote-Groups'] || 'Remote-Groups';

		const userIdentifier = request.headers.get(userHeader.toLowerCase()) || 'anonymous';
		const userName = nameHeader
			? request.headers.get(nameHeader.toLowerCase()) || userIdentifier
			: userIdentifier; // Fallback name to identifier
		const groupsHeaderValue = request.headers.get(groupsHeader.toLowerCase()) || '';
		const userGroups = groupsHeaderValue ? groupsHeaderValue.split(',').map((g) => g.trim()) : [];

		const user: User = {
			user: userIdentifier, // Use the identifier from Remote-User
			name: userName,
			groups: userGroups
		};

		// Return essential config and user info
		return {
			configTitle: config.app?.title,
			// Filter and sanitize critical alerts
			criticalAlerts: (config.critical_alerts || [])
				.filter((alert: CriticalAlertConfig) => {
					// Check access control
					const userAllowed = !alert.allowed_users || alert.allowed_users.includes(user.name);
					const groupAllowed =
						!alert.allowed_groups ||
						alert.allowed_groups.some((group) => user.groups.includes(group));
					return userAllowed && groupAllowed;
				})
				.map(
					(alert): ClientSafeCriticalAlert => ({
						// Return ONLY client-safe properties
						name: alert.name,
						type: alert.type,
						interval: alert.interval
					})
				),
			user: user
		};
	} catch (error: unknown) {
		console.error('Error in +layout.server.ts load function:', error);
		// Optionally re-throw or return an error structure for the UI
		// For now, just log it and return defaults/empty to avoid crashing the layout
		return {
			configTitle: 'Linkus Error',
			criticalAlerts: [],
			user: { user: 'error', name: 'Error', groups: [] }
		};
	}
};
