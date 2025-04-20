<script lang="ts">
	import type { Service } from '$lib/types';

	// Define the type for the props
	interface Props {
		service: Service;
		pluginData: any[] | null; // Expecting an array or null
		pluginStatus: 'unknown' | 'online' | 'warning' | 'error';
		pluginError: string | null;
	}

	// Use $props() - Types are inferred from the Props interface with lang="ts"
	let { service, pluginData, pluginStatus, pluginError } = $props();

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
	{#if pluginStatus === 'error'}
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
				<span>Error: {pluginError ?? 'Unknown Error'}</span>
			</div>
		</div>
	{:else if pluginStatus === 'online' || pluginStatus === 'warning'}
		<!-- Display data (stale during warning) -->
		{#if pluginData && pluginData.length > 0}
			<!-- Scrollable container for cards -->
			<div class="overflow-y-auto max-h-80 space-y-2 p-1 {pluginStatus === 'warning' ? 'opacity-75' : ''}">
				{#if pluginStatus === 'warning'}
					<div class="text-xs text-warning text-center opacity-100">Showing stale data...</div>
				{/if}
				{#each pluginData as item (item.id || item.title + item.airDateUtc)}
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
			<!-- No data message -->
			<div class="text-center p-4 opacity-75">
				{pluginStatus === 'warning' ? 'Waiting for data...' : 'No upcoming items.'}
			</div>
		{/if}
	{/if}
</div>
