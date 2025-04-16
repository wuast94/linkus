<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import type { Service } from '$lib/types';

	export let service: Service;

	let PluginComponent: typeof SvelteComponent | null = null;
	let error: string | null = null;

	// Use onMount to dynamically import the plugin
	import { onMount } from 'svelte';

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
	<div class="card bg-base-200 p-4 shadow-md border border-error">
		<p class="text-error">Error: {error}</p>
	</div>
{:else if PluginComponent}
	<svelte:component this={PluginComponent} {service} />
{:else}
	<div class="card bg-base-200 p-4 shadow-md border border-base-300 flex items-center gap-2">
		<span class="loading loading-spinner loading-sm"></span>
		<p class="opacity-75">Loading plugin {service.plugin}...</p>
	</div>
{/if}
