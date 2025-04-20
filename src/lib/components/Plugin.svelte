<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import type { Service } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';

	export let service: Service;

	let PluginComponent: typeof SvelteComponent | null = null;
	let componentLoadError: string | null = null; // Error loading the plugin component itself

	// --- Plugin Data Fetching State ---
	let pluginStatus: 'unknown' | 'online' | 'warning' | 'error' = 'unknown';
	let pluginData: any = null;
	let lastGoodData: any = null;
	let pluginError: string | null = null; // Error from plugin's API call
	let loading: boolean = true;
	let failureCount: number = 0;
	let intervalId: number | null = null;

	// --- Fetch Logic ---
	async function fetchPluginData() {
		if (pluginStatus === 'unknown') {
			loading = true; // Show loading only on initial fetch
		}

		try {
			const response = await fetch(
				`/api/plugins/${service.plugin}/${encodeURIComponent(service.name)}`
			);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status} ${response.statusText}`);
			}

			const responseData = await response.json();

			if (responseData.error) {
				throw new Error(responseData.error);
			}

			// Success
			pluginData = responseData;
			lastGoodData = responseData; // Store last good data
			pluginStatus = 'online';
			pluginError = null;
			failureCount = 0;

		} catch (err) {
			if (
				err instanceof Error &&
				err.message.includes('API module for plugin') &&
				err.message.includes('not found')
			) {
				// Expected for client-side plugins like 'clock', not a real failure
				pluginStatus = 'online';
				failureCount = 0;
				pluginError = null;
				// Keep lastGoodData if available, though clock won't use it
				pluginData = lastGoodData;
			} else {
				// Handle genuine fetch/API errors
				failureCount++;
				pluginError = err instanceof Error ? err.message : 'Unknown plugin error';

				// Update status based on failure count
				if (failureCount >= 3) {
					pluginStatus = 'error';
				} else if (failureCount > 0) {
					pluginStatus = 'warning';
				} else {
					// Should not happen here as failureCount > 0
					pluginStatus = 'unknown'; // Fallback
				}

				// Keep showing the last good data during warning/error states
				pluginData = lastGoodData;
			}
			console.warn(`Plugin ${service.plugin} fetch error (${failureCount}):`, err);
		} finally {
			loading = false;
		}
	}

	// --- Component Lifecycle ---
	onMount(async () => {
		// 1. Load the plugin component
		try {
			const module = await import(`../plugins/${service.plugin}/index.svelte`);
			PluginComponent = module.default;
		} catch (err) {
			componentLoadError = err instanceof Error ? err.message : 'Failed to load plugin component';
			console.error(`Failed to load plugin ${service.plugin} component:`, err);
			loading = false;
			pluginStatus = 'error'; // Set status to error if component fails to load
			pluginError = componentLoadError;
			return; // Stop further execution if component fails
		}

		// 2. Start data fetching if component loaded
		await fetchPluginData(); // Initial fetch

		// 3. Set up interval
		const updateIntervalMs = service.config?.update_interval ?? 60000; // Default 60s
		if (updateIntervalMs > 0) { // Only set interval if > 0
			intervalId = window.setInterval(fetchPluginData, updateIntervalMs);
		}
	});

	onDestroy(() => {
		if (intervalId !== null) {
			clearInterval(intervalId);
		}
	});

</script>

{#if componentLoadError}
	<div class="block border border-error bg-base-200 shadow-md rounded p-4">
		<p class="text-error">{service.plugin} Load Error: {componentLoadError}</p>
	</div>
{:else if !PluginComponent || (loading && pluginStatus === 'unknown')}
	<!-- Loading state -->
	<div class="border border-base-300 bg-base-200 shadow-md rounded p-4 flex items-center gap-2 min-h-[6rem]">
		<span class="loading loading-spinner loading-sm"></span>
		<p class="opacity-75">Loading {service.plugin}...</p>
	</div>
{:else if PluginComponent}
	<!-- Render the loaded plugin, passing managed state -->
	<svelte:component
		this={PluginComponent}
		{service}
		pluginData={pluginData}
		pluginStatus={pluginStatus}
		pluginError={pluginError}
	/>
{/if}
