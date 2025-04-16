<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import '../app.css';
	import 'overlayscrollbars/overlayscrollbars.css';

	export let data: PageData;

	// Backend Status Tracking
	let isBackendOnline = true; // Assume online initially
	let wasBackendOffline = false; // Track if it was ever offline
	let checkInterval: number | null = null;

	async function checkBackendStatus() {
		try {
			// Replace '/api/health' with your actual backend health check endpoint
			const response = await fetch('/api/health');
			if (response.ok) {
				if (!isBackendOnline) {
					// Backend just came back online
					wasBackendOffline = true; // Mark that it was offline
				}
				isBackendOnline = true;
			} else {
				// Backend is offline or health check failed
				isBackendOnline = false;
			}
		} catch (error) {
			// Network error, assume backend is offline
			isBackendOnline = false;
			console.error('Backend check failed:', error);
		}

		// If it was offline and is now online, force reload
		if (wasBackendOffline && isBackendOnline) {
			console.log('Backend connection restored. Reloading page...');
			window.location.reload();
			// No need to clear wasBackendOffline here, as the page will reload
		} else if (!isBackendOnline) {
			// If it's currently offline, make sure we note that state for the next check
			wasBackendOffline = true;
		}
	}

	onMount(() => {
		const appConfig = data.appConfig;
		const pageTitle = appConfig?.title ?? 'Linkus';
		const configTheme = appConfig?.theme ?? 'system'; // Renamed for clarity
		document.title = pageTitle; // Set title dynamically

		let actualTheme = configTheme; // Determine the theme to apply

		// Resolve 'system' theme immediately
		if (configTheme === 'system') {
			actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}

		// Set the initial theme
		document.documentElement.setAttribute('data-theme', actualTheme);

		// Add listener ONLY if the config is set to 'system'
		if (configTheme === 'system') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = () => {
				// Update based on OS preference change
				const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
				document.documentElement.setAttribute('data-theme', newSystemTheme);
			};
			mediaQuery.addEventListener('change', handleChange);
		}

		// Initial backend check
		checkBackendStatus();

		// Periodically check backend status (e.g., every 10 seconds)
		const intervalMs = 10000;
		checkInterval = window.setInterval(checkBackendStatus, intervalMs);
	});

	onDestroy(() => {
		// Clear the interval when the component is destroyed
		if (checkInterval !== null) {
			clearInterval(checkInterval);
		}
	});
</script>

<svelte:head>
	<title></title>
	<!-- Add meta tags, etc. here if needed -->
</svelte:head>

<!-- Basic layout structure -->
<div class="app-container">
	<!-- Header placeholder (optional) -->
	<!-- <header><h1></h1></header> -->
	<main>
		<slot />
	</main>
	<!-- Footer placeholder (optional) -->
</div>

<!-- Backend Offline Modal -->
{#if !isBackendOnline}
<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Connection Lost</h3>
    <p class="py-4">Attempting to reconnect to the server...</p>
    <div class="flex justify-center">
         <span class="loading loading-dots loading-lg"></span>
    </div>
  </div>
</div>
{/if}

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex-grow: 1;
		/* Add padding or other layout styles as needed */
	}

	/* Define theme variables in app.css or here */
	/* Example: */
	/*
	:root { --background-color: #fff; --text-color: #333; }
	[data-theme='dark'] { --background-color: #333; --text-color: #fff; }
	*/
</style>
