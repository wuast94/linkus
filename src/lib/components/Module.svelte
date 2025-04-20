<script lang="ts">
	import type { Service } from '$lib/types';
	import { icons } from 'lucide-svelte';
	import type { SvelteComponent } from 'svelte';

	export let service: Service;
	export let status: 'unknown' | 'online' | 'offline';
	export let responseTime: number | null;
	export let error: string | null;

	// --- Icon Handling --- State ---
	let iconSource: string | undefined = undefined; // Holds the src for <img>
	let iconType: 'image' | 'lucide' | 'none' = 'none'; // Tracks current display type
	let IconComponent: typeof SvelteComponent | null = null;

	// --- Icon Handling --- Logic ---
	// Function to attempt loading Lucide icon
	async function loadLucideIcon(name: string) {
		try {
			const pascalCaseIconName = name
				.toLowerCase()
				.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
				.replace(/^./, (char) => char.toUpperCase());

			if (pascalCaseIconName in icons) {
				const Icon = icons[pascalCaseIconName as keyof typeof icons];
				if (Icon) {
					IconComponent = Icon as typeof SvelteComponent; // Assert type to avoid complexity error
					iconType = 'lucide'; // Update type on success
				} else {
					throw new Error(`Lucide component '${pascalCaseIconName}' not found in map.`);
				}
			} else {
				throw new Error(`Lucide name '${pascalCaseIconName}' not found.`);
			}
		} catch (err) {
			console.warn(`Failed Lucide lookup for '${name}':`, err);
			IconComponent = null;
			iconType = 'none'; // Fallback if Lucide fails
		}
	}

	// Reactive statement to set initial icon state based on service.icon
	$: {
		// Reset state when service.icon changes
		iconSource = undefined;
		iconType = 'none'; // Default to none
		IconComponent = null;

		if (service.icon) {
			if (service.icon.startsWith('http://') || service.icon.startsWith('https://')) {
				// It's a URL
				iconType = 'image';
				iconSource = service.icon;
			} else {
				// Not a URL, try Lucide
				loadLucideIcon(service.icon);
			}
		} // else: No service.icon, state remains 'none'
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
		<!-- Main Content Area -->
		<div class="flex h-full flex-col justify-between">
			<!-- Top part: Icon and Name (Stacked Vertically) -->
			<div class="flex flex-col items-center text-center mb-2">
				<!-- Icon (Rendered First) -->
				<div class="mb-1 h-5">
					{#if iconType === 'image' && iconSource} <img src={iconSource} alt="{service.name} icon" class="h-5 w-5 object-contain" loading="lazy" />
					{:else if iconType === 'lucide' && IconComponent}
						<svelte:component this={IconComponent} size="20" class="flex-shrink-0" />
					{/if}
					<!-- No explicit 'none' case needed, just renders empty div -->
				</div>
				<!-- Service Name -->
				<h3 class="w-full truncate text-base font-medium">{service.name}</h3>
			</div>

			<!-- Middle part: Description (flexible height) -->
			<div class="flex-grow">
				{#if service.description}
					<p class="line-clamp-2 text-center text-xs opacity-75">{service.description}</p>
				{/if}
			</div>

			<!-- Status Indicator & Response Time (Below Description) -->
			{#if !error}
				<div class="flex justify-center items-center gap-2 mt-2">
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

			<!-- Bottom part: Error Message (if any) -->
			{#if error}
				<div class="mt-2 text-center text-xs text-error">{error}</div>
			{/if}
		</div>
	</div>
</a>
