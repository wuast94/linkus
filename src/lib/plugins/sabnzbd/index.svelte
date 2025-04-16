<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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

	let error = $state<string | null>(null);
	let loading = $state(true);
	let isInitialLoad = $state(true); // Flag for initial load
	// Initialize with default structure
	let data = $state<SabnzbdData>({ queue: [], speed: '0 KB/s', remaining: '0 GB' });

	let {
		service,
		onClearErrorState = () => {},
		onErrorState = (detail: { error: string | null }) => {}
	} = $props<{
		service: Service;
		onClearErrorState?: () => void;
		onErrorState?: (detail: { error: string | null }) => void;
	}>();

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

	function canAccess(service: Service) {
		return service.config?.access_level === 'full' || service.config?.access_level === 'write';
	}

	async function fetchData() {
		if (isInitialLoad) {
			loading = true;
		}
		error = null; // Clear previous error
		onClearErrorState();
		try {
			const response = await fetch(
				`/api/plugins/${service.plugin}/${encodeURIComponent(service.name)}`
			);

			if (!response.ok) {
				error = `HTTP ${response.status} ${response.statusText}`;
				onErrorState({ error });
				return;
			}

			const dataResponse = await response.json();

			if (dataResponse.error) {
				error = dataResponse.error;
				onErrorState({ error });
			} else {
				data = {
					queue: dataResponse.queue,
					speed: dataResponse.speed,
					remaining: dataResponse.remaining
				};
			}
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An unknown error occurred';
			}
			onErrorState({ error });
		} finally {
			if (isInitialLoad) {
				loading = false;
				isInitialLoad = false; // Set flag after first fetch completes
			}
		}
	}

	// Initial fetch
	fetchData();

	// Set up interval for fetching data
	const updateIntervalMs = service.config?.update_interval ?? 60000; // Default to 60s
	const interval = setInterval(fetchData, updateIntervalMs);

	// Cleanup interval on component destroy
	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<div class="block border border-base-300 bg-base-200 shadow-md rounded p-4">
	{#if error}
		<p class="text-error">{service.plugin}: {error}</p>
	{:else if loading && isInitialLoad}
		<div class="flex justify-center items-center h-full">
			<div class="flex items-center gap-2">
				<span class="loading loading-spinner loading-sm"></span>
				<p class="opacity-75">Loading {service.name}...</p>
			</div>
		</div>
	{:else if service.config?.show_queue}
		{#if data.queue.length === 0}
			<div class="text-sm opacity-75">No active downloads</div>
		{:else}
			{@const maxItemsToShow = typeof service.config?.max_items === 'number' && service.config.max_items > 0 ? service.config.max_items : 3}
			<div class="flex flex-col gap-2">
				{#each data.queue.slice(0, maxItemsToShow) as item}
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
				{#if data.queue.length > maxItemsToShow}
					<div class="text-xs opacity-75 mt-1">
						+ {data.queue.length - maxItemsToShow} more items
					</div>
				{/if}
				<div class="text-sm opacity-75 mt-1">
					Speed: {data.speed}
				</div>
			</div>
		{/if}
	{:else}
		<p class="opacity-75">Plugin configured, but queue display is disabled.</p>
	{/if}
</div>
