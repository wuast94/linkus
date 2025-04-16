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

	let selectedCategory: string | null = 'all'; // Default to 'all'

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

	function selectCategory(categoryId: string | null) {
		selectedCategory = categoryId;
	}

	$: filteredCategories = selectedCategory === 'all'
		? Object.values(servicesByCategory)
		: selectedCategory
			? [servicesByCategory[selectedCategory]]
			: [];

	let mainContentElement: HTMLElement;
	let pluginWidth = 500;
	let resizeObserver: ResizeObserver;

	function calculatePluginWidth(currentContainerWidth: number) {
		const moduleItemWidth = 250;
		const moduleGap = 8;
		const mainGap = 16;
		const minPluginWidth = 350;
		const maxPluginWidth = 650;

		const maxModuleAreaWidth = currentContainerWidth - minPluginWidth - mainGap;

		if (maxModuleAreaWidth <= moduleItemWidth) {
			pluginWidth = Math.max(minPluginWidth, Math.min(currentContainerWidth - moduleItemWidth - mainGap, maxPluginWidth));
			pluginWidth = Math.max(minPluginWidth, pluginWidth);
			pluginWidth = maxPluginWidth;
			return;
		}

		const numColumns = Math.max(1, Math.floor((maxModuleAreaWidth + moduleGap) / (moduleItemWidth + moduleGap)));

		const actualModulesWidth = numColumns * moduleItemWidth + (numColumns > 0 ? (numColumns - 1) * moduleGap : 0);

		let calculatedPluginWidth = currentContainerWidth - actualModulesWidth - mainGap;

		pluginWidth = Math.max(minPluginWidth, Math.min(calculatedPluginWidth, maxPluginWidth));

		if (pluginWidth + actualModulesWidth + mainGap > currentContainerWidth + 1) {
			calculatedPluginWidth = currentContainerWidth - actualModulesWidth - mainGap;
			pluginWidth = Math.max(minPluginWidth, Math.min(calculatedPluginWidth, maxPluginWidth));
		}

		pluginWidth = Math.max(minPluginWidth, pluginWidth);
	}

	onMount(() => {
		if (mainContentElement) {
			resizeObserver = new ResizeObserver(entries => {
				for (let entry of entries) {
					const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
					if (width) {
						calculatePluginWidth(width);
					}
				}
			});
			resizeObserver.observe(mainContentElement);
			calculatePluginWidth(mainContentElement.clientWidth);
		}
	});

	onDestroy(() => {
		if (resizeObserver && mainContentElement) {
			resizeObserver.unobserve(mainContentElement);
		}
	});

</script>

<div class="p-4 min-h-screen">
	<div class="flex flex-col gap-4">
		<!-- Header with Welcome and Search -->
		<div class="flex items-center gap-8 mt-4">
			<div class="flex-1">
				<SearchBar />
			</div>
			<h1 class="text-2xl font-bold whitespace-nowrap">Welcome, {user.name}</h1>
		</div>

		<!-- Category filters -->
		<div class="flex flex-wrap gap-2">
			<button
				class="btn btn-sm {selectedCategory === 'all' ? 'btn-primary' : 'btn-ghost'}"
				on:click={() => selectCategory('all')}
			>
				All
			</button>
			{#each categories as category}
				<button
					class="btn btn-sm {selectedCategory === category.id ? 'btn-primary' : 'btn-ghost'}"
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
								<Module {service} />
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
