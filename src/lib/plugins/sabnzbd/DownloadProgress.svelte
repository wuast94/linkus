<!-- DownloadProgress.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fetchSabnzbdData, formatSpeed } from './api';
	import type { Service } from '$lib/types';

	interface Download {
		name: string;
		size: string;
		remaining: string;
		progress: number;
		status: string;
		timeLeft: string;
	}

	let maxDownloads = 3;

	let downloads: Download[] = [];
	let totalSpeed = 0;
	let totalRemaining = 0;
	let interval: ReturnType<typeof setInterval>;
	let error: string | null = null;

	function formatSize(bytes: number): string {
		if (bytes >= 1024 * 1024 * 1024) {
			return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
		} else if (bytes >= 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
		}
		return `${(bytes / 1024).toFixed(2)} KB`;
	}

	async function fetchData() {
		try {
			const requestParams: Service = {
				name: 'status',
				type: 'plugin',
				plugin: 'Sabnzbd',
				category: 'downloads',
				config: { update_interval: 5000 }
			};

			const data = await fetchSabnzbdData(requestParams);

			// Process downloads
			if (data.queue) {
				downloads = data.queue;
				totalSpeed = parseFloat(data.speed) || 0;
				totalRemaining = parseFloat(data.remaining) || 0;
				error = null; // Clear any previous errors
			}
		} catch (err) {
			console.error('Error fetching SABnzbd data:', err);
			if (err instanceof Error) {
				error = err.message;
			} else if (typeof err === 'object' && err !== null && 'status' in err) {
				// Use optional chaining for statusText as it might not exist
				const statusText = 'statusText' in err ? err.statusText : 'Unknown Error';
				error = `HTTP ${err.status} ${statusText}`;
			} else {
				error = 'An unknown error occurred';
			}
		}
	}

	onMount(() => {
		fetchData();
		interval = setInterval(fetchData, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<div class="space-y-2">
	{#if error}
		<p class="text-dracula-red">Sabnzbd: {error}</p>
	{:else}
		{#each downloads as download}
			<div class="mb-4" class:opacity-50={download.status === 'Paused'}>
				<div class="mb-1 flex justify-between">
					<span class="truncate text-sm">{download.name}</span>
					<span class="text-xs text-gray-400">{download.status}</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-700">
					<div class="h-2 rounded-full bg-primary" style="width: {download.progress}%"></div>
				</div>
				<div class="mt-1 flex justify-between text-xs text-gray-400">
					<span>{download.timeLeft}</span>
					<span>{download.size}</span>
				</div>
			</div>
		{/each}
		{#if totalSpeed > 0}
			<div class="text-sm text-gray-400">Total Speed: {formatSpeed(totalSpeed)}</div>
		{/if}
	{/if}
</div>
