<script lang="ts">
	import type { Service } from '$lib/types';

	export let service: Service;
	export let status: 'unknown' | 'online' | 'offline';
	export let responseTime: number | null;
	export let error: string | null;

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
