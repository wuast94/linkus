<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { Service } from '$lib/types';

	export let service: Service;

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

	let error: string | null = null;
	let loading = true;
	// Initialize with default structure
	let data: SabnzbdData = { queue: [], speed: '0 KB/s', remaining: '0 GB' };

	const dispatch = createEventDispatcher();

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
		loading = true;
		error = null; // Clear previous error
		try {
			const response = await fetch(
				`/api/plugins/${service.plugin}/${encodeURIComponent(service.name)}`
			);

			if (!response.ok) {
				error = `HTTP ${response.status} ${response.statusText}`;
				dispatch('errorState', { error });
				return;
			}

			const dataResponse = await response.json();

			if (dataResponse.error) {
				error = dataResponse.error;
				dispatch('errorState', { error });
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
			dispatch('errorState', { error });
		} finally {
			loading = false;
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

<a
	href={canAccess(service) ? service.url : undefined}
	target="_blank"
	rel="noopener noreferrer"
	class="block rounded border border-border bg-dark-900 p-4 shadow-lg transition-colors hover:bg-dark"
	class:pointer-events-none={!canAccess(service)}
>
	{#if error}
		<p class="text-error">{service.plugin}: {error}</p>
	{:else if service.config?.show_queue}
		{#if data.queue.length === 0}
			<div class="text-sm text-foreground-secondary">No active downloads</div>
		{:else}
			<div class="flex flex-col gap-2">
				{#each data.queue.slice(0, 3) as item}
					<div class="relative h-8 w-full overflow-hidden rounded bg-background-tertiary">
						<div
							class="absolute left-0 top-0 h-full bg-primary"
							style="width: {item.progress}%"
						></div>
						<div
							class="absolute left-0 top-0 flex h-full w-full items-center justify-between px-2 text-foreground"
						>
							<div class="flex-1 truncate" title={item.name}>
								{item.name}
							</div>
							<div class="ml-2 whitespace-nowrap">
								{formatTime(item.timeLeft)} - {calculateDoneSize(
									item.size,
									item.remaining
								)}/{item.size}
							</div>
						</div>
					</div>
				{/each}
				<div class="text-sm text-foreground-secondary">
					Speed: {data.speed}
				</div>
			</div>
		{/if}
	{/if}
</a>

<style>
	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
