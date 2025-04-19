<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Service } from '$lib/types';

	let { service } = $props<{ service: Service }>(); // Add service prop

	let currentTime = $state('');
	let error = $state<string | null>(null);

	function updateTime() {
		const now = new Date();
		const formatSetting = service.config?.format as '12H' | '24H' | undefined;

		try {
			if (formatSetting === '12H') {
				currentTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			} else if (formatSetting === '24H') {
				currentTime = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false }); // en-GB is commonly 24h
			} else {
				// Default to client's locale default time format
				currentTime = now.toLocaleTimeString();
			}
			error = null; // Clear error on success
		} catch (e) {
			// Should be less likely now, but keep basic error handling
			console.error('Clock format error:', e);
			error = 'Error formatting time';
			currentTime = now.toLocaleTimeString(); // Fallback to default
		}
	}

	onMount(() => {
		updateTime(); // Initial update
		const interval = setInterval(updateTime, 1000);

		// Clear interval on component destroy
		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="block border border-base-300 bg-base-200 shadow-md rounded p-4">
	{#if error}
		<p class="text-error text-center text-sm">Clock: {error}</p>
	{:else}
		<p class="text-2xl font-bold text-center text-base-content">{currentTime}</p>
	{/if}
</div>
