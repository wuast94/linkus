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
	<div class="rounded bg-dark p-4 shadow-lg border border-red">
		<p class="text-dracula-red">{service.plugin}: {error}</p>
	</div>
{:else if PluginComponent}
	<div class="rounded bg-dark shadow-lg border transition-colors {internalErrorActive ? 'border-red' : 'border-transparent'}">
		<svelte:component
			this={PluginComponent}
			{service}
			on:errorState={handleErrorState}
			on:clearErrorState={handleClearErrorState}
		/>
	</div>
{:else}
	<div class="rounded bg-dark p-4 shadow-lg border border-dracula">
		<p class="text-nosferatu">Loading plugin {service.plugin}...</p>
	</div>
{/if}
