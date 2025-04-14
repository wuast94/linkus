import { json } from '@sveltejs/kit';
import { getConfig } from '$lib/utils/config';
import type { Service, User } from '$lib/types';

export async function handlePluginRequest(
	plugin: string,
	serviceName: string,
	user: User,
	handler: (service: Service) => Promise<unknown>
) {
	const config = getConfig();
	const service = config.services.find((s) => s.name === serviceName && s.plugin === plugin);

	if (!service) {
		return json({ error: 'Service not found' }, { status: 404 });
	}

	const hasAccess =
		// If no groups and no user whitelist, it's public
		((!service.groups || service.groups.length === 0) &&
			(!service.user || service.user.length === 0)) ||
		// Check user whitelist
		(service.user && service.user.includes(user.user)) ||
		// Check group membership
		(service.groups && service.groups.some((group) => user.groups.includes(group)));

	if (!hasAccess) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const data = await handler(service);
		return json(data);
	} catch (error) {
		console.error(`Plugin ${plugin} error:`, error);
		return json(
			{ error: error instanceof Error ? error.message : 'Unknown error occurred' },
			{ status: 500 }
		);
	}
}
