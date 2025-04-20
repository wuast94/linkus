<script lang="ts">
	import type { Service } from '$lib/types';

	// Define types for the data structure
	interface QueueItem {
		name: string;
		size: string;
		remaining: string;
		progress: number;
		status: string;
		timeLeft: string;
	}

	interface SabnzbdData {
		queue: QueueItem[];
		speed: string; // Formatted speed (e.g., '1.23 MB/s')
		remaining: string; // Formatted remaining size (e.g., '10.5 GB')
	}

	// Define the type for the props
	interface Props {
		service: Service;
		pluginData: SabnzbdData | null; // Expecting SabnzbdData structure or null
		pluginStatus: 'unknown' | 'online' | 'warning' | 'error';
		pluginError: string | null;
	}

	// Use $props() - Types are inferred from the Props interface with lang="ts"
	let { service, pluginData, pluginStatus, pluginError } = $props();

	function formatTime(timeStr: string) {
		const parts = timeStr.split(':').slice(0, -1);
		const hours = parts.length > 1 ? parts[0] + 'h ' : '';
		const minutes = parts.length > 0 ? parts[parts.length - 1] + 'm' : '';
		return hours + minutes;
	}

	function calculateDoneSize(total: string, remaining: string) {
		const totalGB = parseFloat(total.replace(' GB', ''));
		const remainingGB = parseFloat(remaining.replace(' GB', ''));
		return (totalGB - remainingGB).toFixed(1) + ' GB';
	}
</script>

<div class="block border border-base-300 bg-base-200 shadow-md rounded p-4">
	{#if pluginStatus === 'error'}
		<div class="alert alert-error shadow-sm">
			<div>
				<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				<span>Error: {pluginError ?? 'Unknown Error'}</span>
			</div>
		</div>
	{:else if (pluginStatus === 'online' || pluginStatus === 'warning') && pluginData}
		{#if pluginData.queue.length === 0}
			<div class="text-sm opacity-75">No active downloads</div>
		{:else}
			{@const maxItemsToShow = typeof service.config?.max_items === 'number' && service.config.max_items > 0 ? service.config.max_items : 3}
			<div class="flex flex-col gap-2 {pluginStatus === 'warning' ? 'opacity-75' : ''}">
				{#if pluginStatus === 'warning'}
					<div class="text-xs text-warning text-center opacity-100">Showing stale data...</div>
				{/if}
				{#each pluginData.queue.slice(0, maxItemsToShow) as item}
					<div class="relative h-8 w-full overflow-hidden rounded bg-base-200">
						<div
							class="absolute left-0 top-0 h-full bg-primary"
							style="width: {item.progress}%"
						></div>
						<div
							class="absolute left-0 top-0 flex h-full w-full items-center justify-between px-2 text-primary-content"
						>
							<div class="flex-1 truncate" title={item.name}>
								{item.name}
							</div>
							<div class="ml-2 whitespace-nowrap text-xs">
								{formatTime(item.timeLeft)} - {calculateDoneSize(
									item.size,
									item.remaining
								)}/{item.size}
							</div>
						</div>
					</div>
				{/each}
				{#if pluginData.queue.length > maxItemsToShow}
					<div class="text-xs opacity-75 mt-1">
						+ {pluginData.queue.length - maxItemsToShow} more items
					</div>
				{/if}
				<div class="text-sm opacity-75 mt-1">
					Speed: {pluginData.speed}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Should ideally not be reached if Plugin.svelte handles loading, but as a fallback -->
		<div class="text-sm opacity-75">Loading data...</div>
	{/if}
</div>
