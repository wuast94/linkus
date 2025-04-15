<script lang="ts">
	import type { Service } from '$lib/types';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { Calendar } from '@fullcalendar/core';
	import listPlugin from '@fullcalendar/list';
	import { OverlayScrollbarsComponent } from 'overlayscrollbars-svelte';

	export let service: Service;
	let calendar: Calendar;
	let error: string | null = null;
	let loading: boolean = false;
	let data: any[] = [];
	let calendarEl: HTMLElement;
	const dispatch = createEventDispatcher();

	async function fetchData() {
		// Clear previous error and dispatch event if necessary
		if (error) {
			error = null; // Clear local error first
			dispatch('clearErrorState');
		}

		try {
			loading = true;
			const response = await fetch(
				`/api/plugins/${service.plugin}/${encodeURIComponent(service.name)}`
			);

			if (!response.ok) {
				error = `HTTP ${response.status} ${response.statusText}`;
				dispatch('errorState', { error });
				return;
			}

			const response_data = await response.json();

			if (response_data.error) {
				error = response_data.error;
				dispatch('errorState', { error });
			} else {
				data = response_data;
				error = null; // Clear error on successful fetch
				dispatch('clearErrorState'); // Dispatch clear event
				if (calendar) {
					calendar.removeAllEvents();
					calendar.addEventSource(data);
				}
			}
			loading = false;
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An unknown error occurred';
			}
			dispatch('errorState', { error });
			loading = false;
		}
	}

	function canAccess(service: Service) {
		return service.config?.access_level === 'full' || service.config?.access_level === 'read';
	}

	onMount(async () => {
		if (calendarEl) {
			calendar = new Calendar(calendarEl, {
				plugins: [listPlugin],
				initialView: 'list',
				headerToolbar: false, // Keep header off unless needed
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
			fetchData(); // Fetch data after calendar is rendered
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

<a
	href={service.url}
	target="_blank"
	rel="noopener noreferrer"
	class="block rounded border border-border bg-dark-900 p-4 shadow-lg transition-colors hover:bg-dark"
	class:pointer-events-none={!canAccess(service)}
>
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
		<div bind:this={calendarEl} class="calendar-container">
			{#if error}
				<p class="text-error p-4">{service.plugin}: {error}</p>
			{:else if loading}
				<p class="text-foreground-secondary p-4">Loading calendar...</p> 
			{:else if !calendar && (!data || data.length === 0) && !loading}
				<!-- Show only if calendar hasn't rendered and data is empty after load -->
				<p class="text-foreground-secondary p-4">No upcoming calendar events.</p>
			{/if}
		</div>
	</OverlayScrollbarsComponent>
</a>

<style>
	:global(.fc) {
		--fc-border-color: var(--border-primary);
		--fc-button-bg-color: var(--accent-primary);
		--fc-button-border-color: var(--accent-primary);
		--fc-button-hover-bg-color: var(--accent-primary-hover);
		--fc-button-hover-border-color: var(--accent-primary-hover);
		--fc-button-active-bg-color: var(--accent-secondary); /* Use pink for active */
		--fc-today-bg-color: var(--bg-secondary);
		--fc-page-bg-color: transparent;
		--fc-neutral-bg-color: var(--bg-secondary); /* Date headers background */
		--fc-list-event-hover-bg-color: var(--bg-secondary);
		--fc-theme-standard-border-color: var(--border-secondary);
		--fc-event-bg-color: var(--accent-primary);
		--fc-event-border-color: var(--accent-primary);
		--fc-event-text-color: var(--text-on-accent);
		--fc-list-event-dot-width: 8px;
		font-size: 0.875rem;
	}

	/* === Styles adapted from FullCalendar Source === */

	/* General List & Theme */
	:global(.fc-theme-standard .fc-list) {
		border: 1px solid var(--fc-border-color);
	}

	/* List Table Structure */
	:global(.fc .fc-list-table) {
		width: 100%;
		border-style: hidden; /* kill outer border on theme */
	}
	:global(.fc .fc-list-table tr > *) {
		border-left: 0;
		border-right: 0;
	}
	:global(.fc .fc-list-table thead) {
		position: absolute;
		left: -10000px;
	}
	:global(.fc .fc-list-table tbody > tr:first-child th) {
		border-top: 0;
	}
	:global(.fc .fc-list-table th) {
		padding: 0;
	}

	/* Date Headers */
	:global(.fc .fc-list-day-cushion) {
		padding: 8px 14px;
	}
	:global(.fc-theme-standard .fc-list-day-cushion) {
		background-color: var(--fc-neutral-bg-color);
	}
	:global(.fc .fc-list-sticky .fc-list-day > *) {
		position: sticky;
		top: 0;
		background: var(--fc-page-bg-color);
	}

	/* Event Rows & Cells */
	:global(.fc .fc-list-event td) {
		/* User override for padding */
		padding: 5px !important;
	}
	:global(.fc .fc-list-event:hover td) {
		background-color: var(--fc-list-event-hover-bg-color);
	}
	:global(.fc .fc-list-event.fc-event-forced-url) {
		cursor: pointer;
	}

	/* Event Content Styling */
	:global(.fc .fc-list-event-graphic),
	:global(.fc .fc-list-event-time) {
		white-space: nowrap;
		width: 1px;
	}
	:global(.fc .fc-list-event-dot) {
		display: inline-block;
		box-sizing: content-box;
		width: 0;
		height: 0;
		border: calc(var(--fc-list-event-dot-width) / 2) solid var(--fc-event-border-color);
		border-radius: calc(var(--fc-list-event-dot-width) / 2);
	}
	:global(.fc .fc-list-event-title a) {
		color: inherit;
		text-decoration: none;
	}
	:global(.fc .fc-list-event.fc-event-forced-url:hover a) {
		text-decoration: underline;
	}

	/* Empty List Message */
	:global(.fc .fc-list-empty) {
		background-color: var(--fc-neutral-bg-color);
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	:global(.fc .fc-list-empty-cushion) {
		margin: 5em 0;
	}

	/* Directional Styles (LTR/RTL) */
	:global(.fc-direction-ltr .fc-list-day-text),
	:global(.fc-direction-rtl .fc-list-day-side-text) {
		float: left;
	}
	:global(.fc-direction-ltr .fc-list-day-side-text),
	:global(.fc-direction-rtl .fc-list-day-text) {
		float: right;
	}
	:global(.fc-direction-ltr .fc-list-table .fc-list-event-graphic) { padding-right: 0 }
	:global(.fc-direction-rtl .fc-list-table .fc-list-event-graphic) { padding-left: 0 }
</style>
