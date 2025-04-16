<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import '../app.css';
	import 'overlayscrollbars/overlayscrollbars.css';

	export let data: PageData;

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
			// Cleanup listener on unmount
			return () => mediaQuery.removeEventListener('change', handleChange);
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
