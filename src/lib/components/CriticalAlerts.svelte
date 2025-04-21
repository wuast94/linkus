<script lang="ts">
	import { onMount } from 'svelte';
	import type { ClientSafeCriticalAlert } from '$lib/types'; // Use the sanitized type

	export let criticalAlerts: ClientSafeCriticalAlert[] = [];

	interface AlertStatusState {
		status: 'checking' | 'ok' | 'error';
		message?: string;
	}

	let alertStatuses = new Map<string, AlertStatusState>();
	let intervalIds = new Map<string, NodeJS.Timeout>(); // Use NodeJS.Timeout for setInterval return type

	const DEFAULT_INTERVAL_SECONDS = 60; // Default check interval

	type AlertStatusValue = 'error' | 'checking' | 'ok';

	// Reactive sorting of alerts based on status
	const statusOrder: Record<AlertStatusValue, number> = {
		'error': 1,
		'checking': 2,
		'ok': 3
	};

	let sortedAlerts: ClientSafeCriticalAlert[] = [];
	$: sortedAlerts = [...criticalAlerts].sort((a, b) => {
		// Default to 'checking' for sorting if not yet in map
		const statusA = alertStatuses.get(a.name)?.status || 'checking';
		const statusB = alertStatuses.get(b.name)?.status || 'checking';
		const orderA = statusOrder[statusA];
		const orderB = statusOrder[statusB];

		if (orderA !== orderB) {
			return orderA - orderB; // Sort by status priority
		}
		return a.name.localeCompare(b.name); // Then alphabetically by name
	});

	async function fetchAlertStatus(alert: ClientSafeCriticalAlert) {
		const alertName = alert.name;
		// Do NOT set to 'checking' here - this prevents the flicker
		// alertStatuses.set(alertName, { status: 'checking' });

		try {
			const response = await fetch(`/api/alerts/status?name=${encodeURIComponent(alertName)}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: response.statusText }));
				console.error(`Error fetching status for ${alertName}:`, errorData);
				alertStatuses.set(alertName, { status: 'error', message: errorData.message || `HTTP ${response.status}` });
			} else {
				const data = await response.json();
				alertStatuses.set(alertName, { status: data.status, message: data.message });
			}
		} catch (error: unknown) {
			console.error(`Failed to fetch status for ${alertName}:`, error);
			const message = error instanceof Error ? error.message : 'Network error or invalid response';
			alertStatuses.set(alertName, { status: 'error', message });
		}
		// Trigger reactivity
		alertStatuses = alertStatuses;
	}

	onMount(() => {
		// Initialize all alert statuses to 'checking'
		criticalAlerts.forEach(alert => {
			if (!alertStatuses.has(alert.name)) {
				alertStatuses.set(alert.name, { status: 'checking' });
			}
		});
		// Trigger initial reactivity for the map
		alertStatuses = alertStatuses;

		criticalAlerts.forEach((alert) => {
			// Initial fetch
			fetchAlertStatus(alert);

			// Set up interval
			const intervalSeconds = alert.interval ?? DEFAULT_INTERVAL_SECONDS;
			const intervalId = setInterval(() => {
				fetchAlertStatus(alert);
			}, intervalSeconds * 1000);
			intervalIds.set(alert.name, intervalId);
		});

		// Cleanup intervals on component destroy
		return () => {
			intervalIds.forEach((id) => clearInterval(id));
		};
	});
</script>

{#if criticalAlerts.length > 0}
	<!-- Use flex for horizontal layout, wrap if needed -->
	<div class="critical-alerts-container flex flex-wrap items-center gap-2 mb-2">
		{#each sortedAlerts as alert (alert.name)}
			{@const statusInfo = alertStatuses.get(alert.name) || { status: 'checking' }}
			<!-- Badge for each alert -->
			<div
				class="badge badge-sm gap-1"
				class:badge-success={statusInfo.status === 'ok'}
				class:badge-error={statusInfo.status === 'error'}
				class:badge-warning={statusInfo.status === 'checking'}
				class:badge-outline={statusInfo.status === 'checking'} 
				title={statusInfo.message || ''}
			>
				{alert.name}
				<!-- Optional: Icon based on status -->
				{#if statusInfo.status === 'ok'}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
				{:else if statusInfo.status === 'error'}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
				{:else}
					<span class="loading loading-spinner loading-xs"></span>
				{/if}
			</div>
		{/each}
	</div>
{/if}
