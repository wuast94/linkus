<script lang="ts">
	import { onMount } from 'svelte';
	import type { Service } from '$lib/types';

	let { service } = $props<{ service: Service }>();

	let currentTime = $state('');
	let error = $state<string | null>(null);

	function updateTime() {
		const now = new Date();
		const formatSetting = service.config?.format as '12H' | '24H' | undefined;

		try {
			if (formatSetting === '12H') {
				currentTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			} else if (formatSetting === '24H') {
				currentTime = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: false });
			} else {
				currentTime = now.toLocaleTimeString();
			}
			error = null;
		} catch (e) {
			console.error('Clock format error:', e);
			error = 'Error formatting time';
			currentTime = now.toLocaleTimeString();
		}
	}

	onMount(() => {
		updateTime();
		const interval = setInterval(updateTime, 1000);

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
