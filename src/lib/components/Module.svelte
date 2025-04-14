<script lang="ts">
	import type { Service } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';

	export let service: Service;

	let status: 'unknown' | 'online' | 'offline' = 'unknown';
	let responseTime: number | null = null;
	let error: string | null = null;
	let interval: number | null = null;

	async function checkStatus() {
		if (!service.url) {
			error = 'No URL configured';
			status = 'offline';
			return;
		}

		try {
			const startTime = performance.now();
			const response = await fetch(`/api/status?url=${encodeURIComponent(service.url)}`);
			const data = await response.json();
			const endTime = performance.now();
			
			if (data.online) {
				responseTime = data.responseTime ?? Math.round(endTime - startTime);
				status = 'online';
				error = null;
			} else {
				status = 'offline';
				error = data.error || `Service returned ${data.status} ${data.statusText}`;
				responseTime = null;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to check service status';
			responseTime = null;
			status = 'offline';
		}
	}

	onMount(() => {
		checkStatus();
		const updateInterval = service.config?.update_interval ?? 30000;
		interval = window.setInterval(checkStatus, updateInterval);
	});

	onDestroy(() => {
		if (interval !== null) {
			clearInterval(interval);
		}
	});

	function openService() {
		if (service.url) {
			window.open(service.url, '_blank');
		}
	}
</script>

<a
	href={service.url}
	class="block h-[100px] w-[250px] overflow-hidden rounded border border-border bg-dark-900 shadow-lg transition-colors hover:bg-dark"
	class:cursor-not-allowed={!service.url}
	on:click|preventDefault={openService}
>
	<div class="relative h-full p-3">
		{#if !error}
			<div class="absolute right-2 top-2 flex items-center gap-2">
				{#if responseTime !== null}
					<span class="text-xs text-text-muted">{responseTime}ms</span>
				{/if}
				<div
					class="h-2 w-2 rounded-full {status === 'online'
						? 'bg-success'
						: status === 'offline'
							? 'bg-error'
							: 'bg-text-muted'}"
				></div>
			</div>
		{/if}

		<div class="flex h-full flex-col">
			<h3 class="truncate text-base font-medium text-dracula-foreground">{service.name}</h3>
			{#if service.description}
				<p class="mt-1 line-clamp-2 text-xs text-dracula-comment">{service.description}</p>
			{/if}
			{#if error}
				<p class="mt-auto truncate text-xs text-dracula-red">Error: {error}</p>
			{/if}
		</div>
	</div>
</a>
