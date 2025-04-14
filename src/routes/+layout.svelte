<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import '../app.css';
	import 'overlayscrollbars/overlayscrollbars.css';

	let { children, data } = $props<{ children: any; data: PageData }>();

	const appConfig = data.appConfig;
	const pageTitle = appConfig?.title ?? 'Linkus';
	const theme = appConfig?.theme ?? 'system';

	onMount(() => {
		let currentTheme = theme;
		if (theme === 'system') {
			currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		document.documentElement.setAttribute('data-theme', currentTheme);

		if (theme === 'system') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = () => {
				document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
			};
			mediaQuery.addEventListener('change', handleChange);
			return () => mediaQuery.removeEventListener('change', handleChange);
		}
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<!-- Add meta tags, etc. here if needed -->
</svelte:head>

<!-- Basic layout structure -->
<div class="app-container">
	<!-- Header placeholder (optional) -->
	<!-- <header><h1>{pageTitle}</h1></header> -->
	<main>
		{@render children()}
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
