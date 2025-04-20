import { json, error } from '@sveltejs/kit';
import { handlePluginRequest } from '$lib/server/pluginUtils';
import type { RequestHandler } from './$types';
import type { Service } from '$lib/types';

// Define the expected signature for plugin fetch functions
type PluginFetchFunction = (service: Service) => Promise<unknown>;

// Use import.meta.glob to find all potential api.ts modules at build time.
// The keys will be the relative paths from the project root (e.g., /src/lib/plugins/sabnzbd/api.ts)
// The values will be functions that return the module promise when called.
const pluginApiModules = import.meta.glob('/src/lib/plugins/**/api.ts');

// List known client-side plugins that don't have an api.ts
const CLIENT_SIDE_PLUGINS = ['clock'];

export const GET: RequestHandler = async ({ params, locals }) => {
	const { plugin, service: serviceName } = params;

	if (!plugin || !serviceName) {
		throw error(400, 'Plugin and service parameters are required');
	}

	// If it's a known client-side plugin, return success immediately
	if (CLIENT_SIDE_PLUGINS.includes(plugin)) {
		return json({}); // Empty success response
	}

	try {
		// Construct the expected key for the glob map
		const moduleKey = `/src/lib/plugins/${plugin}/api.ts`;

		// Find the corresponding module loader function
		const moduleLoader = pluginApiModules[moduleKey];

		if (!moduleLoader) {
			throw new Error(`API module for plugin '${plugin}' not found via glob.`);
		}

		// Load the module and assert its type to match the expected structure
		const pluginModule = (await moduleLoader()) as Record<string, PluginFetchFunction>;

		// Get the fetch function name based on the plugin
		const fetchFunctionName = `fetch${plugin.charAt(0).toUpperCase() + plugin.slice(1)}Data`;
		const fetchFunction = pluginModule[fetchFunctionName];

		if (!fetchFunction) {
			throw new Error(`Plugin ${plugin} does not have a fetch function`);
		}

		// Pass locals.user directly without casting
		return handlePluginRequest(plugin, serviceName, locals.user, fetchFunction);
	} catch (error) {
		console.error(`Failed to load plugin ${plugin}:`, error);
		return json(
			{
				error: `Plugin ${plugin} not found or failed to load`,
				details: (error as Error).message
			},
			{ status: 500 }
		);
	}
};
