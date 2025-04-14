<script lang="ts">
	import Module from '$lib/components/Module.svelte';
	import DynamicPlugin from '$lib/components/Plugin.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import type { Service as ServiceType, Category } from '$lib/types';
	import { onMount, onDestroy } from 'svelte';

	export let data: {
		services: ServiceType[];
		categories: Category[];
		user: { name: string };
	};

	const { services, categories, user } = data;

	interface CategoryGroup {
		name: string;
		icon: string;
		services: ServiceType[];
	}

	type ServicesByCategory = {
		[key: string]: CategoryGroup;
	}

	let selectedCategory: string | null = null;

	// Group services by category
	const servicesByCategory: ServicesByCategory = {};

	for (const category of categories) {
		servicesByCategory[category.id] = {
			name: category.name,
			icon: category.icon,
			services: []
		};
	}

	for (const service of services) {
		if (servicesByCategory[service.category]) {
			servicesByCategory[service.category].services.push(service);
		} else {
			if (!servicesByCategory['uncategorized']) {
				servicesByCategory['uncategorized'] = {
					name: 'Uncategorized',
					icon: 'question',
					services: []
				};
			}
			servicesByCategory['uncategorized'].services.push(service);
		}
	}

	function selectCategory(categoryId: string) {
		selectedCategory = selectedCategory === categoryId ? null : categoryId;
	}

	$: filteredCategories = selectedCategory
		? [servicesByCategory[selectedCategory]]
		: Object.values(servicesByCategory);

	let mainContentElement: HTMLElement;
	let pluginWidth = 500;
	let resizeObserver: ResizeObserver;

	function calculatePluginWidth(currentContainerWidth: number) {
		const moduleItemWidth = 250; // Width of one module
		const moduleGap = 8; // gap-2 between modules
		const mainGap = 16;  // gap-4 between modules area and plugin area
		const minPluginWidth = 350;
		const maxPluginWidth = 650;

		// Container width MINUS minimum plugin width MINUS the gap between them
		const maxModuleAreaWidth = currentContainerWidth - minPluginWidth - mainGap;

		if (maxModuleAreaWidth <= moduleItemWidth) { // If not enough space for even one module + min plugin
			pluginWidth = Math.max(minPluginWidth, Math.min(currentContainerWidth - moduleItemWidth - mainGap, maxPluginWidth)); // Try to fit at least one module if possible
			pluginWidth = Math.max(minPluginWidth, pluginWidth); // Ensure it doesn't go below min plugin width
			pluginWidth = maxPluginWidth;
			return;
		}

		// Add moduleGap to the width to account for the space needed *before* the first gap applies
		const numColumns = Math.max(1, Math.floor((maxModuleAreaWidth + moduleGap) / (moduleItemWidth + moduleGap)));

		// Calculate the actual width these columns will occupy
		const actualModulesWidth = numColumns * moduleItemWidth + (numColumns > 0 ? (numColumns - 1) * moduleGap : 0);

		// Total width minus the calculated actual module width minus the gap between the two sections
		let calculatedPluginWidth = currentContainerWidth - actualModulesWidth - mainGap;

		// Clamp the plugin width
		pluginWidth = Math.max(minPluginWidth, Math.min(calculatedPluginWidth, maxPluginWidth));

		// --- Sanity Check ---
		// If the calculated plugin width + actual module width + main gap > total width,
		// it means clamping forced the plugin wider, potentially causing overflow.
		// In this scenario, prioritize fitting modules and let the plugin take exactly the remainder clamped.
		if (pluginWidth + actualModulesWidth + mainGap > currentContainerWidth + 1) { // Add 1px tolerance for rounding
		   // Recalculate plugin width strictly based on remaining space after modules take their calculated width
		   calculatedPluginWidth = currentContainerWidth - actualModulesWidth - mainGap;
		   pluginWidth = Math.max(minPluginWidth, Math.min(calculatedPluginWidth, maxPluginWidth)); // Re-clamp, prioritizing not overflowing container
		}

		// Final check: Ensure plugin width isn't negative or excessively small if container is tiny
		pluginWidth = Math.max(minPluginWidth, pluginWidth);
	}

	onMount(() => {
		if (mainContentElement) {
			resizeObserver = new ResizeObserver(entries => {
				for (let entry of entries) {
					// Use contentBoxSize for more accurate width calculation
					const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
					if (width) {
						calculatePluginWidth(width);
					}
				}
			});
			resizeObserver.observe(mainContentElement);
			// Initial calculation
			calculatePluginWidth(mainContentElement.clientWidth);
		}
	});

	onDestroy(() => {
		if (resizeObserver && mainContentElement) {
			resizeObserver.unobserve(mainContentElement);
		}
	});

</script>

<div class="container p-4 bg-darker min-h-screen">
	<div class="flex flex-col gap-4">
		<!-- Header with Welcome and Search -->
		<div class="flex items-center gap-8 mt-4">
			<div class="flex-1">
				<SearchBar />
			</div>
			<h1 class="text-2xl font-bold text-dracula whitespace-nowrap">Welcome, {user.name}</h1>
		</div>

		<!-- Category filters -->
		<div class="flex flex-wrap gap-2">
			{#each categories as category}
				<button
					class="px-4 py-2 rounded-full transition-colors duration-200 {selectedCategory === category.id ? 'bg-primary text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}"
					on:click={() => selectCategory(category.id)}
				>
					{category.name}
				</button>
			{/each}
		</div>

		<!-- Main content area using Flexbox -->
		<div class="flex gap-4" bind:this={mainContentElement}>
			<!-- Modules section (grows, contains auto-fit grid) -->
			<div class="min-w-0 flex-1">
				<div class="grid gap-2" style="grid-template-columns: repeat(auto-fit, 250px); justify-content: start;">
					{#each filteredCategories as category}
						{#each category.services as service}
							{#if service.type === 'http_check'}
								<div class="h-[100px]">
									<Module {service} />
								</div>
							{/if}
						{/each}
					{/each}
				</div>
			</div>

			<!-- Plugins section (doesn't shrink, width is reactive) -->
			<div class="flex-shrink-0" style="width: {pluginWidth}px;">
				<div class="grid gap-2">
					{#each filteredCategories as category}
						{#each category.services as service}
							{#if service.type !== 'http_check'}
								<DynamicPlugin {service} />
							{/if}
						{/each}
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		width: 100%;
		margin: 0 auto;
		padding: 0 1rem;
	}

	button {
		font-size: 0.9rem;
		font-weight: 500;
	}
</style>
