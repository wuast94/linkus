<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import type { Service } from '$lib/types';

	export let service: Service;

	let PluginComponent: typeof SvelteComponent | null = null;
	let error: string | null = null; // Error loading the plugin component itself
	let internalErrorActive = false; // Track if the loaded component has an internal error

	// Use onMount to dynamically import the plugin
	import { onMount } from 'svelte';

	// Event handlers for state changes from the loaded plugin
	function handleErrorState() {
		internalErrorActive = true;
	}

	function handleClearErrorState() {
		internalErrorActive = false;
	}

	onMount(async () => {
		try {
			// Assuming plugins are in 'src/lib/plugins'
			const module = await import(`../plugins/${service.plugin}/index.svelte`);
			PluginComponent = module.default;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load plugin';
			console.error(`Failed to load plugin ${service.plugin}:`, err);
		}
	});
</script>

{#if error}
	<div class="block border border-error bg-base-200 shadow-md rounded p-4">
		<p class="text-error">{service.plugin}: {error}</p>
	</div>
{:else if PluginComponent}
	<svelte:component
		this={PluginComponent}
		{service}
		on:errorState={handleErrorState}
		on:clearErrorState={handleClearErrorState}
	/>
{:else}
	<!-- Loading state with consistent container style (removed redundant 'block') -->
	<div class="border border-base-300 bg-base-200 shadow-md rounded p-4 flex items-center gap-2">
		<span class="loading loading-spinner loading-sm"></span>
		<p class="opacity-75">Loading plugin {service.plugin}...</p>
	</div>
{/if}
