<script lang="ts">
	import { onMount } from 'svelte';
	import type { Service } from '$lib/types';

	let { service } = $props<{ service: Service }>();

	let currentDate = $state(''); // Separate state for date
	let currentTime = $state(''); // State for time
	let error = $state<string | null>(null);

	function updateTime() {
		const now = new Date();
		const formatSetting = service.config?.format as '12H' | '24H' | undefined;

		// Format Date using Intl.DateTimeFormat for localization
		const dateFormatter = new Intl.DateTimeFormat(undefined, { // Use default locale
			day: '2-digit',
			month: 'long', // 'long' for full month name
			year: 'numeric'
		});
		const dateString = dateFormatter.format(now);
		currentDate = dateString; // Update date state

		// Format Time (HH:MM:SS)
		let timeString = '';
		try {
			if (formatSetting === '12H') {
				timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
			} else {
				timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
			}

			currentTime = timeString; // Update time state
			error = null;
		} catch (e) {
			console.error('Clock format error:', e);
			error = 'Error formatting time';
			// Fallback might only show time if date formatting is complex/fails
			timeString = now.toLocaleTimeString();
			currentTime = timeString; // Fallback to just time on error
			currentDate = ''; // Clear date on error maybe?
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
		<div class="flex flex-col items-center justify-center">
			<div class="text-l opacity-75">{currentDate}</div>
			<div class="text-2xl font-bold">{currentTime}</div>
		</div>
	{/if}
</div>
