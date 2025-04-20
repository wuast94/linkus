import { getConfig } from '$lib/utils/config';
import type { PageServerLoad } from './$types';
import type { Service } from '$lib/types';

export const load: PageServerLoad = ({ locals }) => {
	const config = getConfig();
	const user = locals.user;

	// Filter services based on user groups and user whitelist (reintroduced)
	const services = config.services.filter((service: Service) => {
		// If service has no groups and no user whitelist, it's public
		if (
			(!service.groups || service.groups.length === 0) &&
			(!service.user || service.user.length === 0)
		) {
			return true;
		}

		// If user is not logged in (no user object), they only see public services
		if (!user) {
			return false;
		}

		// Check if user is in the whitelist
		if (service.user && service.user.length > 0) {
			if (service.user.includes(user.user)) {
				return true;
			}
		}

		// Check if user has access to any of the service's groups
		if (service.groups && service.groups.length > 0) {
			// Ensure user.groups exists and is an array before checking
			return (
				user.groups &&
				Array.isArray(user.groups) &&
				service.groups.some((group) => user.groups.includes(group))
			);
		}

		// If user is not in whitelist and doesn't match any group, deny access
		return false;
	});

	// Sanitize services: Remove sensitive fields like check_url before sending to client
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Destructuring to omit check_url intentionally
	const sanitizedServices = services.map(({ check_url, ...rest }) => rest);

	return {
		services: sanitizedServices, // Send the sanitized list to the client
		categories: config.categories,
		user
	};
};
