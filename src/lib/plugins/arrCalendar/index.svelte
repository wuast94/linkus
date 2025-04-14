<script lang="ts">
	import type { Service } from '$lib/types';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Calendar } from '@fullcalendar/core';
	import listPlugin from '@fullcalendar/list';
	import { OverlayScrollbarsComponent } from 'overlayscrollbars-svelte';

	export let service: Service;
	let calendar: Calendar;
	let error: string | null = null;
	let calendarEl: HTMLElement;
	const dispatch = createEventDispatcher();

	async function fetchData() {
		// Clear previous error and dispatch event if necessary
		if (error) {
			error = null; // Clear local error first
			dispatch('clearErrorState');
		}

		try {
			const response = await fetch(
				`/api/plugins/${service.plugin}/${encodeURIComponent(service.name)}`
			);

			if (!response.ok) {
				error = `HTTP ${response.status} ${response.statusText}`;
				dispatch('errorState', { error });
				return;
			}

			const data = await response.json();

			if (data.error) {
				error = data.error;
				dispatch('errorState', { error });
			} else {
				if (calendar) {
					calendar.removeAllEvents();
					calendar.addEventSource(data);
				}
			}
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An unknown error occurred';
			}
			dispatch('errorState', { error });
		}
	}

	function canAccess(service: Service) {
		return service.config?.access_level === 'full' || service.config?.access_level === 'read';
	}

	onMount(() => {
		if (calendarEl) {
			calendar = new Calendar(calendarEl, {
				plugins: [listPlugin],
				initialView: 'list',
				headerToolbar: false,
				height: 'auto',
				duration: { days: 28 },
				visibleRange: {
					start: new Date(),
					end: (() => {
						const end = new Date();
						end.setDate(end.getDate() + 28);
						return end;
					})()
				},
				eventContent: (arg) => {
					const typeIcon = arg.event.extendedProps.type === 'movie' ? '🎬' : '📺';
					const imdbLink = arg.event.extendedProps.imdbId
						? `<a href="https://www.imdb.com/title/${arg.event.extendedProps.imdbId}" target="_blank" rel="noopener noreferrer" class="text-xs text-purple hover:text-pink">IMDb</a>`
						: '';
					const tmdbLink = arg.event.extendedProps.tmdbId
						? `<a href="https://www.themoviedb.org/movie/${arg.event.extendedProps.tmdbId}" target="_blank" rel="noopener noreferrer" class="text-xs text-purple hover:text-pink ml-2">TMDB</a>`
						: '';

					return {
						html: `
							<div class="flex items-center justify-between w-full">
								<div class="fc-event-main-content flex-1">
									<div class="font-bold">${typeIcon} ${arg.event.title}</div>
									<div class="text-sm opacity-80">
										${
											arg.event.extendedProps.episodeNumber
												? `${arg.event.extendedProps.episodeNumber} - ${arg.event.extendedProps.subtitle}`
												: arg.event.extendedProps.subtitle
										}
									</div>
									<div class="flex items-center mt-1">
										${imdbLink}
										${tmdbLink}
									</div>
								</div>
								${
									arg.event.extendedProps.thumbnail
										? `
									<div class="ml-4">
										<img src="${arg.event.extendedProps.thumbnail}" 
											alt="${arg.event.title}" 
											class="w-12 h-16 object-cover rounded"
										/>
									</div>
								`
										: ''
								}
							</div>
						`
					};
				}
			});
			calendar.render();
			fetchData();
		}
	});

	// Set up interval for fetching data
	const updateIntervalMs = service.config?.update_interval ?? 60000; // Default to 60s
	const interval = setInterval(fetchData, updateIntervalMs);

	onDestroy(() => {
		if (calendar) {
			calendar.destroy();
		}
		clearInterval(interval);
	});
</script>

<div
	class="block rounded border border-border bg-dark-900 p-4 shadow-lg transition-colors hover:border-border-light"
	class:pointer-events-none={!canAccess(service)}
>
	{#if error}
		<p class="text-dracula-red">{service.plugin}: {error}</p>
	{:else}
		<OverlayScrollbarsComponent
			class="max-h-96 rounded"
			defer
			options={{
				scrollbars: {
					theme: 'os-theme-dark',
					autoHide: 'move'
				}
			}}
		>
			<div bind:this={calendarEl}></div>
		</OverlayScrollbarsComponent>
	{/if}
</div>

<style>
	:global(.fc) {
		--fc-border-color: var(--current-line);
		--fc-button-bg-color: var(--current-line);
		--fc-button-border-color: var(--current-line);
		--fc-button-hover-bg-color: var(--comment);
		--fc-button-hover-border-color: var(--comment);
		--fc-button-active-bg-color: var(--purple);
		--fc-today-bg-color: var(--current-line);
		--fc-page-bg-color: transparent;
		--fc-neutral-bg-color: var(--background);
		--fc-list-event-hover-bg-color: var(--current-line);
		--fc-theme-standard-border-color: var(--current-line);
		--fc-event-bg-color: var(--purple);
		--fc-event-border-color: var(--purple);
		--fc-event-text-color: var(--foreground);
		--fc-list-event-dot-width: 8px;
		font-size: 0.875rem;
	}

	:global(.fc .fc-list-event-dot) {
		border-color: var(--purple);
	}

	:global(.fc-theme-standard .fc-list-day-cushion) {
		background-color: var(--current-line);
	}

	:global(.fc .fc-list-event:hover td) {
		background-color: var(--comment);
	}

	:global(.fc-direction-ltr .fc-list-day-text) {
		color: var(--foreground);
	}

	:global(.fc .fc-list-event-title),
	:global(.fc .fc-list-event-time) {
		color: var(--foreground);
	}

	:global(.fc-toolbar-title) {
		color: var(--foreground);
		font-size: 1.25rem !important;
	}

	:global(.fc-list-event td) {
		padding: 0.5rem !important;
	}
</style>
