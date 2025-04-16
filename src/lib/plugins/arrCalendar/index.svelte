<script lang="ts">
	import type { Service } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';

	let error = $state<string | null>(null);
	let loading = $state<boolean>(true); // Start loading true
	let isInitialLoad = $state<boolean>(true); // Flag for initial load
	let data = $state<any[]>([]);
	let {
		service,
		onClearErrorState = () => {},
		onErrorState = (detail: { error: string | null }) => {}
	} = $props<{
		service: Service;
		onClearErrorState?: () => void;
		onErrorState?: (detail: { error: string | null }) => void;
	}>();

	async function fetchData() {
		// Clear previous error and dispatch event if necessary
		if (error) {
			error = null; // Clear local error first
			onClearErrorState();
		}

		if (isInitialLoad) {
			loading = true;
		}

		try {
			const response = await fetch(
				`/api/plugins/${service.plugin}/${encodeURIComponent(service.name)}`
			);

			if (!response.ok) {
				error = `HTTP ${response.status} ${response.statusText}`;
				onErrorState({ error });
				loading = false;
				return;
			}

			const response_data = await response.json();

			if (response_data.error) {
				error = response_data.error;
				onErrorState({ error });
			} else {
				data = response_data; // Just update data array
				error = null; // Clear error on successful fetch
				onClearErrorState(); // Call clear prop
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

	onMount(async () => {
		fetchData(); // Fetch data on mount
	});

	// Set up interval for fetching data
	const updateIntervalMs = service.config?.update_interval ?? 60000; // Default to 60s
	const interval = setInterval(fetchData, updateIntervalMs);

	onDestroy(() => {
		clearInterval(interval);
	});

	function formatDate(dateString: string): string {
		// Format date as DD/MM
		return new Date(dateString).toLocaleDateString('en-GB', { // Use en-GB locale for DD/MM
			day: '2-digit',
			month: '2-digit'
		});
	}
</script>

<!-- Main container with consistent styling, removed outer card if present -->
<div class="block border border-base-300 bg-base-200 shadow-md rounded p-4">
	{#if loading && isInitialLoad}
		<div class="flex justify-center items-center h-full">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error shadow-sm">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current flex-shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/></svg
				>
				<span>Error: {error}</span>
			</div>
		</div>
	{:else if data && data.length > 0}
		<!-- Scrollable container for cards -->
		<div class="overflow-y-auto max-h-80 space-y-2 p-1">
			{#each data as item (item.id || item.title + item.airDateUtc)}
				{@const props = item.extendedProps || {}}
				{@const linkUrl = props.imdbId ? `https://www.imdb.com/title/${props.imdbId}` : null}

				<a
					href={linkUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="block hover:shadow-lg transition-shadow duration-200"
				>
					<!-- Add flex to this div for side-by-side layout -->
					<div class="p-2 flex items-center space-x-3">
						<!-- Thumbnail -->
						{#if props.thumbnail}
							<div class="avatar flex-shrink-0">
								<div class="w-10 h-14 rounded">
									<img src={props.thumbnail} alt={item.title} class="object-cover" />
								</div>
							</div>
						{/if}

						<!-- Info -->
						<div class="flex-grow overflow-hidden">
							<div class="flex justify-between items-start">
								<span class="font-semibold text-sm truncate block" title={item.title}>{item.title}</span>
								<span class="badge badge-sm badge-outline ml-2 flex-shrink-0">{formatDate(item.start || item.airDateUtc)}</span> <!-- Use item.start if available -->
							</div>
							{#if props.seasonNumber != null && props.episodeNumber != null}
								<span class="text-xs opacity-70 block">
									S{String(props.seasonNumber).padStart(2, '0')}E{String(props.episodeNumber).padStart(2, '0')}
									{#if props.subtitle} - {props.subtitle}{/if}
								</span>
							{:else if props.subtitle}
								<span class="text-xs opacity-70 block">{props.subtitle}</span>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-center py-4 opacity-75">No upcoming media found.</p>
	{/if}
</div>
