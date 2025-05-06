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

	interface ServiceStatus {
		status: 'unknown' | 'online' | 'offline' | 'warning';
		responseTime: number | null;
		error: string | null;
		failureCount: number;
	}

	let serviceStatuses: { [key: string]: ServiceStatus } = {};

	for (const service of services) {
		if (service.type === 'http_check') {
			serviceStatuses[service.name] = { status: 'unknown', responseTime: null, error: null, failureCount: 0 };
		}
	}

	async function fetchServiceStatus(serviceUrl: string): Promise<{ online: boolean; responseTime: number | null; error: string | null; status?: number; statusText?: string; }> {
		try {
			const response = await fetch(`/api/status?url=${encodeURIComponent(serviceUrl)}`);
			const data = await response.json();

			if (data.online) {
				return {
					online: true,
					responseTime: data.responseTime,
					error: null,
				};
			} else {
				return {
					online: false,
					responseTime: null,
					error: data.error || `Service returned ${data.status} ${data.statusText}`,
				};
			}
		} catch (err) {
			return {
				online: false,
				responseTime: null,
				error: err instanceof Error ? err.message : 'Failed to check service status',
			};
		}
	}

	async function fetchAllStatuses() {
		// console.log("Fetching all statuses...");
		const promises = services
			.filter(s => s.type === 'http_check' && s.url)
			.map(async (service) => {
				const result = await fetchServiceStatus(service.url!);
				const currentStatus = serviceStatuses[service.name];
				if (result.online) {
					serviceStatuses[service.name] = {
						status: 'online',
						responseTime: result.responseTime,
						error: null, // Clear error on success
						failureCount: 0 // Reset failure count
					};
				} else {
					const newFailureCount = (currentStatus?.failureCount || 0) + 1;
					serviceStatuses[service.name] = {
						status: newFailureCount >= 3 ? 'offline' : 'warning', // Set status based on count
						responseTime: null,
						error: newFailureCount >= 3 ? result.error : null, // Only show error after 3 failures
						failureCount: newFailureCount
					};
				}
			});

		await Promise.allSettled(promises);
		// serviceStatuses = { ...serviceStatuses };
	}

	let statusInterval: number | null = null;

	let selectedCategory: string | null = 'all';

	function selectCategory(categoryId: string | null) {
		selectedCategory = categoryId;
	}

	onMount(() => {
		fetchAllStatuses();

		const updateInterval = 30000;
		statusInterval = window.setInterval(fetchAllStatuses, updateInterval);
	});

	onDestroy(() => {
		if (statusInterval !== null) {
			clearInterval(statusInterval);
		}
	});

	let mainContentElement: HTMLElement;
	let pluginWidth = 500;
	let resizeObserver: ResizeObserver;

	function calculatePluginWidth(currentContainerWidth: number) {
		const moduleItemWidth = 250;
		const moduleGap = 8;
		const mainGap = 16;
		const minPluginWidth = 458;
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

<div class="min-h-screen">
	<div class="flex flex-col gap-4">
		<!-- Header with Welcome and Search -->
		<div class="flex items-center gap-8">
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
			{#each categories as category (category.id)}
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
					{#each services as service (service.name)}
						{#if selectedCategory === 'all' || service.category === selectedCategory}
							{#if service.type === 'http_check'}
								{@const statusData = serviceStatuses[service.name] || { status: 'unknown', responseTime: null, error: 'Loading...' }}
								<Module {service} status={statusData.status} responseTime={statusData.responseTime} error={statusData.error} />
							{/if}
						{/if}
					{/each}
				</div>
			</div>

			<!-- Plugins section (doesn't shrink, width is reactive) -->
			<div class="flex-shrink-0" style="width: {pluginWidth}px;">
				<div class="grid gap-2">
					{#each services as service (service.name)}
						{#if selectedCategory === 'all' || service.category === selectedCategory}
							{#if service.type !== 'http_check'}
								<DynamicPlugin {service} />
							{/if}
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
