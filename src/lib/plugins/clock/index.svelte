<script lang="ts">
	import { onMount } from 'svelte';

	let currentTime: string = new Date().toLocaleTimeString();

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date().toLocaleTimeString();
		}, 1000);

		// Clear interval on component destroy
		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="block rounded border border-border bg-dark-900 p-4 shadow-lg transition-colors hover:bg-dark">
	<p class="time">{currentTime}</p>
</div>

<style>
	.time {
		font-size: 2rem;
		font-weight: bold;
		color: var(--text-primary);
		margin: 0;
		text-align: center;
	}
</style>
