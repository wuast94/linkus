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

<!-- Use <a> tag for semantics and accessibility -->
<a
	href={service.url}
	{...(service.url ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }
	class="block border border-base-300 bg-base-200 shadow-md rounded p-4"
	class:pointer-events-none={!service.url}
	title={service.url ? `Open ${service.name}` : service.name}
>
	<!-- Content directly inside, card-body removed -->
	<div class="relative h-full">
		{#if !error}
			<div class="absolute right-0 top-0 flex items-center gap-2">
				{#if responseTime !== null}
					<span class="text-xs opacity-75">{responseTime}ms</span>
				{/if}
				<div
					class="badge badge-xs
						{status === 'online'
							? 'badge-success'
							: status === 'offline'
								? 'badge-error'
								: 'badge-ghost'}"
				></div>
			</div>
		{/if}

		<div class="flex h-full flex-col">
			<h3 class="truncate text-base font-medium">{service.name}</h3>
			{#if service.description}
				<p class="mt-1 line-clamp-2 text-xs opacity-75">{service.description}</p>
			{/if}
			{#if error}
				<p class="mt-auto truncate text-xs text-error">Error: {error}</p>
			{/if}
		</div>
	</div>
</a>
